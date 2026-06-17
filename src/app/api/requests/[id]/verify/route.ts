import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, RequestStatus, NotificationType } from '@prisma/client';
import { runMatchingEngine } from '@/lib/matching-engine';
import { getExpiryHours } from '@/lib/eligibility';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const { id } = params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only VERIFIER or ADMIN can verify requests
  if (session.user.role !== Role.VERIFIER && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, note, rejectionReason } = body; // action is either 'VERIFY' or 'REJECT'

    if (!action || !['VERIFY', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

    const request = await prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== RequestStatus.PENDING_VERIFICATION) {
      return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
    }

    let updatedRequest;

    if (action === 'VERIFY') {
      const expiryHours = await getExpiryHours();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      // 1. Update request status to VERIFIED
      updatedRequest = await prisma.bloodRequest.update({
        where: { id },
        data: {
          status: RequestStatus.VERIFIED,
          verifiedById: session.user.id,
          verifiedAt: new Date(),
          expiresAt,
        },
      });

      // Write audit log
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: 'VERIFIED_REQUEST',
          targetId: id,
          targetType: 'BloodRequest',
          metadata: { note },
        },
      });

      // Notify patient attendant
      await prisma.notification.create({
        data: {
          userId: request.attendantId,
          type: NotificationType.REQUEST_VERIFIED,
          title: 'Blood Request Verified',
          body: `Good news! Your blood request (ID: ${request.id.slice(-6)}) has been verified and active donor matching has begun.`,
          referenceId: request.id,
        },
      });

      // 2. Trigger the matching engine (converts status to ACTIVE and notifies matched donors)
      try {
        await runMatchingEngine(id);
      } catch (matchError) {
        console.error('Matching engine run failed:', matchError);
        // Continue regardless so request status is still VERIFIED and can be re-run
      }
    } else {
      // Reject request
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      updatedRequest = await prisma.bloodRequest.update({
        where: { id },
        data: {
          status: RequestStatus.REJECTED,
          verifiedById: session.user.id,
          verifiedAt: new Date(),
          rejectionReason,
        },
      });

      // Write audit log
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: 'REJECTED_REQUEST',
          targetId: id,
          targetType: 'BloodRequest',
          metadata: { rejectionReason },
        },
      });

      // Notify patient attendant
      await prisma.notification.create({
        data: {
          userId: request.attendantId,
          type: NotificationType.REQUEST_REJECTED,
          title: 'Blood Request Rejected',
          body: `Your blood request (ID: ${request.id.slice(-6)}) was not verified. Reason: ${rejectionReason}`,
          referenceId: request.id,
        },
      });
    }

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('Verify request API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
