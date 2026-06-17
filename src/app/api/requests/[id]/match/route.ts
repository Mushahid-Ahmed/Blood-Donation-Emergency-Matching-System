import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, RequestStatus } from '@prisma/client';
import { runMatchingEngine } from '@/lib/matching-engine';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const { id } = params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only COORDINATOR or ADMIN can trigger manual matching
  if (session.user.role !== Role.COORDINATOR && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== RequestStatus.ACTIVE && request.status !== RequestStatus.VERIFIED) {
      return NextResponse.json({ error: 'Request is not in active matching state' }, { status: 400 });
    }

    // Run matching engine
    const matches = await runMatchingEngine(id);

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'TRIGGER_MANUAL_MATCHING',
        targetId: id,
        targetType: 'BloodRequest',
        metadata: { matchesCreatedCount: matches.length },
      },
    });

    return NextResponse.json({ success: true, matchesCreated: matches.length, matches });
  } catch (error) {
    console.error('Trigger manual matching error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
