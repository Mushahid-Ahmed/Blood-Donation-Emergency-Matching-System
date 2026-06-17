import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, FulfillmentStatus, RequestStatus, NotificationType } from '@prisma/client';

export async function PUT(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await auth();
  const { matchId } = params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only COORDINATOR or ADMIN can update donor match status
  if (session.user.role !== Role.COORDINATOR && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, note } = body; // status is a FulfillmentStatus enum

    if (!status || !Object.values(FulfillmentStatus).includes(status as FulfillmentStatus)) {
      return NextResponse.json({ error: 'Invalid fulfillment status parameter.' }, { status: 400 });
    }

    const match = await prisma.donorMatch.findUnique({
      where: { id: matchId },
      include: {
        donor: true,
        request: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match record not found' }, { status: 404 });
    }

    // Verify current state is active
    if (match.request.status === RequestStatus.FULFILLED || match.request.status === RequestStatus.EXPIRED || match.request.status === RequestStatus.REJECTED) {
      return NextResponse.json({ error: 'The associated blood request is already closed.' }, { status: 400 });
    }

    const previousStatus = match.fulfillmentStatus;
    const newStatus = status as FulfillmentStatus;

    if (previousStatus === newStatus) {
      return NextResponse.json({ success: true, match });
    }

    // Database transaction to update all dependent items atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the donor match status
      const updatedMatch = await tx.donorMatch.update({
        where: { id: matchId },
        data: {
          fulfillmentStatus: newStatus,
          coordinatorNotes: note || undefined,
        },
      });

      // 2. If transitioning to DONATED, log the donation and adjust request/donor details
      if (newStatus === FulfillmentStatus.DONATED && previousStatus !== FulfillmentStatus.DONATED) {
        const unitsDonated = 1; // Default to 1 unit per donation session

        // A. Create DonationRecord
        await tx.donationRecord.create({
          data: {
            donorId: match.donorId,
            requestId: match.requestId,
            matchId: matchId,
            donatedAt: new Date(),
            units: unitsDonated,
            hospital: match.request.hospitalName,
            notes: note || 'Donation tracked via coordinator dashboard',
          },
        });

        // B. Increment unitsReceived in the BloodRequest
        const updatedRequest = await tx.bloodRequest.update({
          where: { id: match.requestId },
          data: {
            unitsReceived: {
              increment: unitsDonated,
            },
          },
        });

        // C. Update DonorProfile: increment totalDonations, update lastDonationDate, and set isEligible to false
        await tx.donorProfile.update({
          where: { id: match.donorId },
          data: {
            totalDonations: {
              increment: unitsDonated,
            },
            lastDonationDate: new Date(),
            isEligible: false, // Immediately marked ineligible due to cooldown period
          },
        });

        // D. Check if request is now fully fulfilled (cumulative unitsReceived >= unitsNeeded)
        if (updatedRequest.unitsReceived >= updatedRequest.unitsNeeded) {
          // Auto-mark the request as FULFILLED and close it
          await tx.bloodRequest.update({
            where: { id: match.requestId },
            data: {
              status: RequestStatus.FULFILLED,
            },
          });

          // Create notification for attendant
          await tx.notification.create({
            data: {
              userId: match.request.attendantId,
              type: NotificationType.REQUEST_FULFILLED,
              title: 'Blood Request Fulfilled',
              body: `Success! Your blood request (ID: ${match.request.id.slice(-6)}) has been fully met with enough donations and is now closed. Thank you!`,
              referenceId: match.requestId,
            },
          });
        }
      }

      return updatedMatch;
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: `UPDATE_MATCH_STATUS_TO_${newStatus}`,
        targetId: matchId,
        targetType: 'DonorMatch',
        metadata: { previousStatus, note },
      },
    });

    return NextResponse.json({ success: true, match: result });
  } catch (error) {
    console.error('Update match status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
