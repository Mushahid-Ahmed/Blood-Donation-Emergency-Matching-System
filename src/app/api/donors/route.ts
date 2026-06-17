import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, BloodGroup } from '@prisma/client';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, bloodGroup, city, area, lastDonationDate, notes } = body;

    // Validate fields
    if (!name || !email || !password || !bloodGroup || !city || !area) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Check blood group format
    if (!Object.values(BloodGroup).includes(bloodGroup as BloodGroup)) {
      return NextResponse.json({ error: 'Invalid blood group' }, { status: 400 });
    }

    // Hash password using bcryptjs
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role: Role.DONOR,
          isActive: true,
        },
      });

      const parsedDate = lastDonationDate ? new Date(lastDonationDate) : null;

      const profile = await tx.donorProfile.create({
        data: {
          userId: user.id,
          bloodGroup: bloodGroup as BloodGroup,
          city,
          area,
          isAvailable: true,
          lastDonationDate: parsedDate,
          notes,
        },
      });

      return { user, profile };
    });

    return NextResponse.json({
      success: true,
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
    });
  } catch (error) {
    console.error('Donor registration API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const donors = await prisma.donorProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        user: {
          createdAt: 'desc',
        },
      },
    });

    return NextResponse.json(donors);
  } catch (error) {
    console.error('Get donors API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
