
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/admin';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const goals = await prisma.goal.findMany();
    return NextResponse.json(goals, { status: 200 });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
