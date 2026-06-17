import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, RequestStatus, NotificationType } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const { id } = params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only COORDINATOR or ADMIN can close requests manually
  if (session.user.role !== Role.COORDINATOR && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status } = body; // status must be either 'FULFILLED' or 'EXPIRED'

    if (!status || !['FULFILLED', 'EXPIRED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status parameter. Must be FULFILLED or EXPIRED.' }, { status: 400 });
    }

    const request = await prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status === RequestStatus.FULFILLED || request.status === RequestStatus.EXPIRED || request.status === RequestStatus.REJECTED) {
      return NextResponse.json({ error: 'Request is already closed' }, { status: 400 });
    }

    const updatedRequest = await prisma.bloodRequest.update({
      where: { id },
      data: {
        status: status as RequestStatus,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: `MANUALLY_CLOSED_AS_${status}`,
        targetId: id,
        targetType: 'BloodRequest',
      },
    });

    // Notify patient attendant
    await prisma.notification.create({
      data: {
        userId: request.attendantId,
        type: status === 'FULFILLED' ? NotificationType.REQUEST_FULFILLED : NotificationType.REQUEST_EXPIRED,
        title: status === 'FULFILLED' ? 'Blood Request Fulfilled' : 'Blood Request Expired',
        body: `Your blood request (ID: ${request.id.slice(-6)}) is now marked as ${status.toLowerCase()} and closed.`,
        referenceId: request.id,
      },
    });

    // Cancel all pending notifications or active matching indicators for this request
    // In our system they expire/disappear automatically from active dashboards because the status is no longer ACTIVE.

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('Close request error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
