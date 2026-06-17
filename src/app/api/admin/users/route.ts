import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const roleParam = searchParams.get('role');
  const searchParam = searchParams.get('search');

  try {
    const users = await prisma.user.findMany({
      where: {
        ...(roleParam && Object.values(Role).includes(roleParam as Role)
          ? { role: roleParam as Role }
          : {}),
        ...(searchParam
          ? {
              OR: [
                { name: { contains: searchParam, mode: 'insensitive' } },
                { email: { contains: searchParam, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        donorProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to get users:', error);
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
    const { userId, isActive } = body;

    if (!userId || isActive === undefined) {
      return NextResponse.json({ error: 'Missing userId or isActive status' }, { status: 400 });
    }

    // Admins cannot deactivate themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Admins cannot deactivate themselves' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !!isActive },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        targetId: userId,
        targetType: 'User',
        metadata: { affectedUserEmail: updatedUser.email },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
