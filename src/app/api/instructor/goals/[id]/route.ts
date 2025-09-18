
import { NextResponse } from 'next/server';
import { PrismaClient, Role, GoalStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || !session.user || session.user.role !== Role.INSTRUCTOR) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    let { id } = params;
    // Convert id to number if your Prisma schema uses Int for goal id
    // id = parseInt(id, 10);
    const { action } = await request.json();

    if (action !== 'accept') {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
    }

    if (goal.status !== GoalStatus.PENDING_INSTRUCTOR_ASSIGNMENT) {
      return NextResponse.json({ message: 'Goal is not pending instructor assignment' }, { status: 400 });
    }

    // @ts-ignore
    if (goal.userId === session.user.id) {
      return NextResponse.json({ message: 'You cannot instruct your own goal' }, { status: 400 });
    }

    if (action === 'accept') {
      const updatedGoal = await prisma.goal.update({
        where: { id },
        data: {
          // @ts-ignore
          instructorId: session.user.id,
          status: GoalStatus.ASSIGNED,
        },
      });
      return NextResponse.json({ message: 'Goal assigned successfully', goal: updatedGoal }, { status: 200 });
    }

  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || !session.user || session.user.role !== Role.INSTRUCTOR) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status || !['COMPLETED', 'FAILED'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status provided' }, { status: 400 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
    }

    if (status === 'FAILED') {
      // TODO: Implement PayPal payment logic here
      // 1. Retrieve the PayPal billing agreement token from the database
      // 2. Use the token to create a payment
    } else if (status === 'COMPLETED') {
      const payment = await prisma.payment.findUnique({
        where: { goalId: id },
      });

      if (!payment || !payment.stripeChargeId) {
        return NextResponse.json({ message: 'No held payment found for this goal.' }, { status: 400 });
      }

      await stripe.refunds.create({
        charge: payment.stripeChargeId,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: { status: status as GoalStatus },
    });

    return NextResponse.json({ message: `Goal marked as ${status}`, goal: updatedGoal }, { status: 200 });

  } catch (error) {
    console.error('Error updating goal status:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
