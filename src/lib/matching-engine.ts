import { prisma } from './prisma';
import { BloodRequest, DonorProfile, DonorMatch, ConsentStatus, FulfillmentStatus, NotificationType } from '@prisma/client';
import { getCompatibleDonorGroups } from './blood-compatibility';
import { getCooldownDays, checkEligibility } from './eligibility';

/**
 * Matching Engine Scoring & Matching Logic
 * 
 * When a request is verified, this engine:
 * 1. Finds eligible donors (correct blood group, active, eligible cooldown, not already matched).
 * 2. Calculates a match score based on proximity and compatibility.
 * 3. Saves the matches in the database.
 * 4. Notifies the top matches.
 */

interface ScoredDonor {
  donor: DonorProfile & { user: { name: string; email: string; phone: string | null } };
  score: number;
}

export async function runMatchingEngine(requestId: string): Promise<DonorMatch[]> {
  // 1. Fetch the request details
  const request = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error(`Request not found: ${requestId}`);
  }

  // Only run matching for verified or active requests
  if (request.status !== 'VERIFIED' && request.status !== 'ACTIVE') {
    throw new Error(`Request is not in a matchable status: ${request.status}`);
  }

  // 2. Get compatible blood groups
  const compatibleGroups = getCompatibleDonorGroups(request.bloodGroup);
  const cooldownDays = await getCooldownDays();

  // 3. Find all available donors with compatible blood groups
  const eligibleDonors = await prisma.donorProfile.findMany({
    where: {
      bloodGroup: { in: compatibleGroups },
      isAvailable: true,
      user: {
        isActive: true,
      },
      // Exclude donors who are already matched to this request
      donorMatches: {
        none: {
          requestId: request.id,
        },
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  // Filter out donors who are not eligible due to cooldown rules
  const activeEligibleDonors = eligibleDonors.filter((donor) =>
    checkEligibility(donor.lastDonationDate, cooldownDays)
  );

  const scoredDonors: ScoredDonor[] = activeEligibleDonors.map((donor) => {
    let score = 0;

    // A. Exact Blood Group Match (+50 points)
    if (donor.bloodGroup === request.bloodGroup) {
      score += 50;
    }

    // B. Proximity: Location matching (City: +30 points)
    if (donor.city.trim().toLowerCase() === request.hospitalCity.trim().toLowerCase()) {
      score += 30;

      // C. Proximity: Area matching (Area: +20 points)
      if (donor.area.trim().toLowerCase() === request.hospitalArea.trim().toLowerCase()) {
        score += 20;
      }
    }

    // D. History/Experience: +1 point per successful donation (capped at 10)
    const donationBonus = Math.min(donor.totalDonations, 10);
    score += donationBonus;

    return { donor, score };
  });

  // Sort by score descending
  scoredDonors.sort((a, b) => b.score - a.score);

  // Take top 10 matched donors (or config limit)
  const topMatches = scoredDonors.slice(0, 10);

  const createdMatches: DonorMatch[] = [];

  for (const item of topMatches) {
    const match = await prisma.donorMatch.create({
      data: {
        requestId: request.id,
        donorId: item.donor.id,
        matchScore: item.score,
        consentStatus: ConsentStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.NOTIFIED,
      },
    });

    // Create in-app notification for the donor
    await prisma.notification.create({
      data: {
        userId: item.donor.userId,
        type: NotificationType.CONSENT_REQUEST,
        title: 'Emergency Blood Request Match',
        body: `Urgent! A patient needs blood matching your type (${request.bloodGroup}) at ${request.hospitalName}, ${request.hospitalArea}. Would you like to accept?`,
        referenceId: match.id,
      },
    });

    createdMatches.push(match);
  }

  // Update request status to ACTIVE if it was VERIFIED (ready for matching)
  if (request.status === 'VERIFIED') {
    await prisma.bloodRequest.update({
      where: { id: requestId },
      data: { status: 'ACTIVE' },
    });
  }

  return createdMatches;
}
