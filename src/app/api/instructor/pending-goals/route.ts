
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'INSTRUCTOR' || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const instructorId = session.user.id;

  try {
    const pendingGoals = await prisma.goal.findMany({
      where: {
        status: 'PENDING_INSTRUCTOR_ASSIGNMENT',
        NOT: {
          userId: instructorId,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true, // Select the 'name' field instead
          },
        },
      },
    });
    return NextResponse.json(pendingGoals);
  } catch (error) {
    console.error('Error fetching pending goals:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
