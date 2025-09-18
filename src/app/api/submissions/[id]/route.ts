
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const file = formData.get('file') as File | null;

    // @ts-ignore
    const userId = session.user.id;

    if (!content) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    const submission = await prisma.dailySubmission.findUnique({
      where: { id },
      include: { goal: true },
    });

    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    if (submission.goal.userId !== userId) {
      return NextResponse.json({ message: 'You do not have permission to update this submission' }, { status: 403 });
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

    const updatedSubmission = await prisma.dailySubmission.update({
      where: { id },
      data: {
        content,
        ...(fileUrl && { fileUrl }), // Only include fileUrl if a new file was uploaded
      },
    });

    return NextResponse.json(updatedSubmission, { status: 200 });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
