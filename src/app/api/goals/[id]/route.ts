
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await Promise.resolve(params);
    // @ts-ignore
    const userId = session.user.id;

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        submissions: {
          orderBy: { submissionDate: 'desc' },
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json(goal, { status: 200 });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
