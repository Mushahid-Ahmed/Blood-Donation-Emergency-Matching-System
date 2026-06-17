import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { updateDonorEligibility } from '@/lib/eligibility';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const { id } = params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // A donor can only get their own profile, unless they are Admin or Coordinator
  const isSelf = session.user.id === id || session.user.role === Role.DONOR && session.user.id === id;
  const isAuthorized = isSelf || session.user.role === Role.ADMIN || session.user.role === Role.COORDINATOR;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const donor = await prisma.donorProfile.findFirst({
      where: {
        OR: [
          { id: id },
          { userId: id }
        ]
      },
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
    });

    if (!donor) {
      return NextResponse.json({ error: 'Donor not found' }, { status: 404 });
    }

    return NextResponse.json(donor);
  } catch (error) {
    console.error('Get donor by ID error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const { id } = params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find profile first to identify owner
    const donor = await prisma.donorProfile.findFirst({
      where: {
        OR: [
          { id: id },
          { userId: id }
        ]
      }
    });

    if (!donor) {
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 });
    }

    // Only profile owner or Admin can update it
    const isOwner = session.user.id === donor.userId;
    const isAdmin = session.user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { isAvailable, city, area, notes, lastDonationDate } = body;

    const updateData: any = {};
    if (isAvailable !== undefined) updateData.isAvailable = !!isAvailable;
    if (city !== undefined) updateData.city = city;
    if (area !== undefined) updateData.area = area;
    if (notes !== undefined) updateData.notes = notes;
    
    if (lastDonationDate !== undefined) {
      updateData.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : null;
    }

    const updatedDonor = await prisma.donorProfile.update({
      where: { id: donor.id },
      data: updateData,
    });

    // If last donation date changed, recalculate eligibility
    if (lastDonationDate !== undefined) {
      await updateDonorEligibility(donor.id);
    }

    return NextResponse.json(updatedDonor);
  } catch (error) {
    console.error('Update donor profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
