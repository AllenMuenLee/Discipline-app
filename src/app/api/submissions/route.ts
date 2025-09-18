
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const goalId = formData.get('goalId') as string;
    const content = formData.get('content') as string;
    const file = formData.get('file') as File | null;

    const userId = session.user.id;

    if (!goalId || !content) {
      return NextResponse.json({ message: 'Goal ID and content are required' }, { status: 400 });
    }

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      return NextResponse.json({ message: 'Goal not found or you do not have permission to access it' }, { status: 404 });
    }

    let fileUrl: string | undefined;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      fileUrl = `/uploads/${fileName}`;
    }

    const newSubmission = await prisma.dailySubmission.create({
      data: {
        content,
        goalId,
        fileUrl,
      },
    });

    return NextResponse.json(newSubmission, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
