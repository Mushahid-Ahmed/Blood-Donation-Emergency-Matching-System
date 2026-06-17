import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { estimateNoShowRisk } from '@/lib/ai-service';
import { Role } from '@prisma/client';

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only COORDINATOR or ADMIN can run no-show risk analysis
  if (session.user.role !== Role.COORDINATOR && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'MatchId is required' }, { status: 400 });
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

    // Call AI service to estimate no-show risk score
    const riskScore = await estimateNoShowRisk(
      match.donorId,
      match.request.hospitalCity,
      match.request.hospitalArea,
      match.donor.city,
      match.donor.area
    );

    // Save risk score in DB for reference
    const updatedMatch = await prisma.donorMatch.update({
      where: { id: matchId },
      data: {
        noShowRiskScore: riskScore,
      },
    });

    return NextResponse.json({ success: true, riskScore, match: updatedMatch });
  } catch (error) {
    console.error('API risk estimation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
