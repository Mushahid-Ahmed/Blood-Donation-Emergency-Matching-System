import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, RequestStatus, BloodGroup, UrgencyLevel } from '@prisma/client';
import { classifyRequestUrgency } from '@/lib/ai-service';

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only ATTENDANT or ADMIN can submit requests
  if (session.user.role !== Role.ATTENDANT && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      bloodGroup,
      unitsNeeded,
      hospitalName,
      hospitalCity,
      hospitalArea,
      urgency,
      description,
      contactName,
      contactPhone,
      bypassDuplicateCheck
    } = body;

    // Validate fields
    if (
      !bloodGroup ||
      !unitsNeeded ||
      !hospitalName ||
      !hospitalCity ||
      !hospitalArea ||
      !urgency ||
      !description ||
      !contactName ||
      !contactPhone
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Duplicate detection (within 24 hours in the same hospital and same blood group)
    if (!bypassDuplicateCheck) {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const potentialDuplicate = await prisma.bloodRequest.findFirst({
        where: {
          bloodGroup: bloodGroup as BloodGroup,
          hospitalName: { equals: hospitalName, mode: 'insensitive' },
          createdAt: { gte: oneDayAgo },
          status: { in: [RequestStatus.PENDING_VERIFICATION, RequestStatus.VERIFIED, RequestStatus.ACTIVE] },
        },
      });

      if (potentialDuplicate) {
        return NextResponse.json({
          duplicateDetected: true,
          message: `Warning: A similar active request for ${bloodGroup} was recently submitted for ${hospitalName} at ${potentialDuplicate.createdAt.toLocaleTimeString()}. Do you wish to proceed anyway?`,
          requestId: potentialDuplicate.id,
        }, { status: 409 });
      }
    }

    // Call AI Service to classify request urgency (stored in aiUrgencyLabel suggestion)
    let aiUrgency = null;
    try {
      aiUrgency = await classifyRequestUrgency(description, urgency);
    } catch (err) {
      console.error('AI Urgency classification failed, skipping:', err);
    }

    // Create the request
    const request = await prisma.bloodRequest.create({
      data: {
        attendantId: session.user.id,
        bloodGroup: bloodGroup as BloodGroup,
        unitsNeeded: parseInt(unitsNeeded, 10),
        hospitalName,
        hospitalCity,
        hospitalArea,
        urgency: urgency as UrgencyLevel,
        description,
        contactName,
        contactPhone,
        status: RequestStatus.PENDING_VERIFICATION,
        aiUrgencyLabel: aiUrgency,
      },
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('Submit blood request error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');

  try {
    let whereClause: any = {};

    // Filter by role-based workspace views
    if (session.user.role === Role.ATTENDANT) {
      // Attendants only see requests they submitted
      whereClause.attendantId = session.user.id;
    } else if (session.user.role === Role.DONOR) {
      // Donors only see active requests where they have a match record
      whereClause.status = RequestStatus.ACTIVE;
      whereClause.donorMatches = {
        some: {
          donor: {
            userId: session.user.id,
          },
        },
      };
    } else if (session.user.role === Role.VERIFIER) {
      // Verifiers see pending queue by default, or they can filter
      if (statusParam) {
        whereClause.status = statusParam as RequestStatus;
      } else {
        whereClause.status = RequestStatus.PENDING_VERIFICATION;
      }
    } else if (session.user.role === Role.COORDINATOR) {
      // Coordinators manage active, verified, or fulfilled requests
      if (statusParam) {
        whereClause.status = statusParam as RequestStatus;
      } else {
        whereClause.status = { in: [RequestStatus.ACTIVE, RequestStatus.VERIFIED] };
      }
    } else if (session.user.role === Role.ADMIN) {
      // Admins see everything
      if (statusParam) {
        whereClause.status = statusParam as RequestStatus;
      }
    }

    const requests = await prisma.bloodRequest.findMany({
      where: whereClause,
      include: {
        attendant: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        // Only include donorMatches relevant to the user if they are a donor
        ...(session.user.role === Role.DONOR && {
          donorMatches: {
            where: {
              donor: {
                userId: session.user.id,
              },
            },
            select: {
              id: true,
            },
          },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('List blood requests error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
