
import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || !session.user || session.user.role !== Role.INSTRUCTOR) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const pendingSubmissions = await prisma.dailySubmission.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        goal: {
          include: {
            user: {
              select: { email: true }, // Only select the email
            },
          },
        },
      },
      orderBy: {
        submissionDate: 'asc',
      },
    });

    return NextResponse.json(pendingSubmissions, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
