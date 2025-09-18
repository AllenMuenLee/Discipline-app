
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.INSTRUCTOR || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: goalId } = await context.params;
    const instructorId = session.user.id;

    console.log(goalId, instructorId);

    const goal = await prisma.goal.findUnique({
      where: {
        id: goalId,
        instructorId: instructorId, // Ensure the goal is assigned to this instructor
      },
      include: {
        user: { select: { name: true, email: true } },
        submissions: { orderBy: { submissionDate: 'asc' } },
      },
    });
    if (!goal) {
      return NextResponse.json({ message: 'Goal not found or not assigned to you' }, { status: 404 });
    }

    return NextResponse.json(goal, { status: 200 });
  } catch (error) {
    console.error('Error fetching instructor goal submissions:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
