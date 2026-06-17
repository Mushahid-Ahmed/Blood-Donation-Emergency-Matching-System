import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { recalculateAllEligibility } from '@/lib/eligibility';

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const configList = await prisma.systemConfig.findMany();
    
    // Map list to key-value pairs
    const configMap = configList.reduce((acc, curr) => {
      acc[curr.key] = {
        value: curr.value,
        description: curr.description,
      };
      return acc;
    }, {} as Record<string, { value: string; description: string }>);

    return NextResponse.json(configMap);
  } catch (error) {
    console.error('Failed to get system config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    // Upsert the system config value
    const updatedConfig = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value: String(value),
        updatedById: session.user.id,
      },
      create: {
        key,
        value: String(value),
        description: key === 'COOLDOWN_DAYS' ? 'Minimum cooldown days between donations' : 'Hours before request automatically expires',
        updatedById: session.user.id,
      },
    });

    // If cooldown changes, recalculate eligibility for all donors in background
    if (key === 'COOLDOWN_DAYS') {
      recalculateAllEligibility().catch(err => {
        console.error('Failed to recalculate all eligibility:', err);
      });
    }

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Failed to update system config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
