import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Update the user's role to INSTRUCTOR
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'INSTRUCTOR' },
    });

    return NextResponse.json({ message: 'Role updated to INSTRUCTOR successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ message: 'Failed to update user role.' }, { status: 500 });
  }
}
