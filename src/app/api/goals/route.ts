
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use your desired API version
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // @ts-expect-error
    const userId = session.user.id;
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      include: {
        submissions: true, // Include submissions
      },
    });
    return NextResponse.json(goals, { status: 200 });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, durationDays, stakeAmount, stripeToken } = await request.json();
    // @ts-expect-error
    const userId = session.user.id;

    if (!title || !description || !durationDays || !stakeAmount || !stripeToken) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // Create a Stripe Charge
    const charge = await stripe.charges.create({
      amount: Math.round(parseFloat(stakeAmount) * 100), // amount in cents
      currency: 'usd',
      source: stripeToken,
      description: `Stake for goal: ${title}`,
      metadata: {
        userId: userId,
        goalTitle: title,
      },
      capture: false, // Do not capture immediately, hold the funds
    });

    const newGoal = await prisma.goal.create({
      data: {
        title,
        description,
        startDate: new Date(),
        durationDays,
        stakeAmount,
        userId,
        payment: {
          create: {
            stripeChargeId: charge.id,
            amount: parseFloat(stakeAmount),
            status: 'HELD',
            type: 'STAKE',
            recipientId: userId,
          },
        },
      },
      include: {
        payment: true,
      },
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error: Error) {
    console.error('Error creating goal or Stripe charge:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
