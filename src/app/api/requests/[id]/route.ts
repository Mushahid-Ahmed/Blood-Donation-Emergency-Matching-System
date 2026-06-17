import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, RequestStatus, ConsentStatus } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const { id } = params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch request with matched donors and their user profiles
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        attendant: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        donorMatches: {
          include: {
            donor: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
          orderBy: {
            matchScore: 'desc',
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Role-based filtering of contact details (Privacy protection)
    const isOwner = session.user.id === request.attendantId;
    const isVerifier = session.user.role === Role.VERIFIER;
    const isCoordinator = session.user.role === Role.COORDINATOR;
    const isAdmin = session.user.role === Role.ADMIN;
    
    // Check if the current user is a matched donor for this request
    const matchedDonor = request.donorMatches.find(
      (m) => m.donor.userId === session.user.id
    );

    const isMatchedDonor = !!matchedDonor;

    // Default structure: sanitize contact details
    const responseData: any = {
      ...request,
      contactName: 'Protected',
      contactPhone: 'Protected',
      donorMatches: [],
    };

    // 1. Attendant, Coordinator, Verifier, and Admin can see patient contact details
    if (isOwner || isVerifier || isCoordinator || isAdmin) {
      responseData.contactName = request.contactName;
      responseData.contactPhone = request.contactPhone;
    }

    // 2. A matched donor can only see contact details if they have ACCEPTED the consent request
    if (isMatchedDonor) {
      const acceptedMatch = request.donorMatches.find(
        (m) => m.donor.userId === session.user.id && m.consentStatus === ConsentStatus.ACCEPTED
      );

      if (acceptedMatch) {
        responseData.contactName = request.contactName;
        responseData.contactPhone = request.contactPhone;
      }
    }

    // 3. Coordinator and Admin see the full matches list
    if (isCoordinator || isAdmin) {
      responseData.donorMatches = request.donorMatches.map((m) => {
        const canSeeDonorContact = m.consentStatus === ConsentStatus.ACCEPTED;
        
        return {
          id: m.id,
          matchScore: m.matchScore,
          consentStatus: m.consentStatus,
          consentAt: m.consentAt,
          fulfillmentStatus: m.fulfillmentStatus,
          contactRevealedAt: m.contactRevealedAt,
          coordinatorNotes: m.coordinatorNotes,
          noShowRiskScore: m.noShowRiskScore,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          donor: {
            id: m.donor.id,
            bloodGroup: m.donor.bloodGroup,
            city: m.donor.city,
            area: m.donor.area,
            totalDonations: m.donor.totalDonations,
            // Reveal donor contact details only if they accepted consent
            user: {
              name: m.donor.user.name,
              email: canSeeDonorContact ? m.donor.user.email : 'Protected',
              phone: canSeeDonorContact ? m.donor.user.phone : 'Protected',
            },
          },
        };
      });
    }

    // 4. A matched donor can see their own match entry
    if (isMatchedDonor && matchedDonor) {
      responseData.myMatch = {
        id: matchedDonor.id,
        matchScore: matchedDonor.matchScore,
        consentStatus: matchedDonor.consentStatus,
        fulfillmentStatus: matchedDonor.fulfillmentStatus,
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Get single request error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
