import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ConsentStatus, FulfillmentStatus, NotificationType } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await auth();
  const { matchId } = params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body; // action is either 'ACCEPT' or 'DECLINE'

    if (!action || !['ACCEPT', 'DECLINE'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action parameter. Must be ACCEPT or DECLINE.' }, { status: 400 });
    }

    // Find the donor match with donor profile details
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

    // Verify ownership: Only the matched donor can respond
    if (match.donor.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (match.consentStatus !== ConsentStatus.PENDING) {
      return NextResponse.json({ error: 'You have already responded to this match request.' }, { status: 400 });
    }

    let updatedMatch;

    if (action === 'ACCEPT') {
      updatedMatch = await prisma.donorMatch.update({
        where: { id: matchId },
        data: {
          consentStatus: ConsentStatus.ACCEPTED,
          consentAt: new Date(),
          fulfillmentStatus: FulfillmentStatus.CONTACTED,
          contactRevealedAt: new Date(),
        },
      });

      // Write audit log for contact reveal
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: 'CONTACT_REVEALED',
          targetId: matchId,
          targetType: 'DonorMatch',
          metadata: { requestId: match.requestId },
        },
      });

      // Send in-app notification to ALL coordinators (or a coordinator group) about match acceptance
      // In MVP we find all Coordinator users in database and notify them
      const coordinators = await prisma.user.findMany({
        where: { role: 'COORDINATOR' },
      });

      for (const coordinator of coordinators) {
        await prisma.notification.create({
          data: {
            userId: coordinator.id,
            type: NotificationType.MATCH_ACCEPTED,
            title: 'Donor Accepted Request',
            body: `Donor ${session.user.name} has accepted the blood request at ${match.request.hospitalName}. Contact info is now visible.`,
            referenceId: match.requestId,
          },
        });
      }
    } else {
      // Decline
      updatedMatch = await prisma.donorMatch.update({
        where: { id: matchId },
        data: {
          consentStatus: ConsentStatus.DECLINED,
          consentAt: new Date(),
          fulfillmentStatus: FulfillmentStatus.CANCELLED,
        },
      });
    }

    return NextResponse.json({ success: true, match: updatedMatch });
  } catch (error) {
    console.error('Consent response error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
