
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

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.user.delete({
      where: {
        id: id,
      },
    });

    return new NextResponse("User deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return new NextResponse("Name is required", { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        name: name,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
