
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/admin';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedGoal, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Goal deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
