
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    // @ts-expect-error
    const userId = session.user.id;

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ message: 'Goal not found or you are not the owner' }, { status: 404 });
    }

    if (goal.status !== 'ASSIGNED') {
      return NextResponse.json({ message: 'Goal is not in a state to be started' }, { status: 400 });
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + goal.durationDays * 24 * 60 * 60 * 1000);

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        startedAt: now,
        status: 'ACTIVE',
        endDate: endDate,
      },
    });

    return NextResponse.json(updatedGoal, { status: 200 });

  } catch (error) {
    console.error('Error starting goal:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
