import { NextResponse } from 'next/server';
import { PrismaClient, Role, SubmissionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.INSTRUCTOR || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: submissionId } = await params;
    const { status: newStatus, reviewerComment } = await request.json();
    const instructorId = session.user.id;

    if (!newStatus || !['APPROVED', 'REJECTED'].includes(newStatus)) {
      return NextResponse.json({ message: 'Invalid submission status provided' }, { status: 400 });
    }

    const submission = await prisma.dailySubmission.findUnique({
      where: { id: submissionId },
      include: {
        goal: true, // Include goal to check instructor ownership
      },
    });

    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    if (submission.goal.instructorId !== instructorId) {
      return NextResponse.json({ message: 'You are not the instructor for this goal' }, { status: 403 });
    }

    const updatedSubmission = await prisma.dailySubmission.update({
      where: { id: submissionId },
      data: { status: newStatus as SubmissionStatus, reviewerId: instructorId, reviewerComment: newStatus === 'REJECTED' ? reviewerComment : null },
    });

    return NextResponse.json(updatedSubmission, { status: 200 });
  } catch (error) {
    console.error('Error updating submission status:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}