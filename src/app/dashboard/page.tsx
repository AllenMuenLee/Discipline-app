'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// This will be replaced with the actual Goal type from Prisma
type Submission = { id: string; submissionDate: string; content: string; status: string };
type Goal = {
  id: string;
  title: string;
  status: string;
  endDate: string;
  startedAt: string | null;
  submissions: Submission[];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // @ts-expect-error
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        fetchGoals();
      }
    }
  }, [session, status, router]);

  const fetchGoals = async () => {
    const res = await fetch('/api/goals');
    if (res.ok) {
      const data = await res.json();
      setGoals(data);
    }
  };

  const handleStartGoal = async (goalId: string) => {
    const res = await fetch(`/api/goals/${goalId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      await fetchGoals(); // Re-fetch goals to update the UI
    } else {
      const error = await res.json();
      alert(`Failed to start goal: ${error.message}`);
    }
  };

  const getNextDueDate = (goal: Goal) => {
    if (goal.status !== 'ACTIVE' || !goal.startedAt) {
      return 'N/A';
    }

    const startedAtDate = new Date(goal.startedAt);
    let lastSubmissionDate = startedAtDate;

    if (goal.submissions && goal.submissions.length > 0) {
      // Sort submissions by date to get the latest one
      const sortedSubmissions = [...goal.submissions].sort((a, b) =>
        new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime()
      );
      lastSubmissionDate = new Date(sortedSubmissions[sortedSubmissions.length - 1].submissionDate);
    }

    const nextDueDate = new Date(lastSubmissionDate);
    nextDueDate.setDate(nextDueDate.getDate() + 1);

    // Ensure the next due date is not past the goal's end date
    const endDate = new Date(goal.endDate);
    endDate.setHours(23, 59, 59, 999); // Set to end of day

    if (nextDueDate > endDate) {
      return 'N/A (Goal ended)';
    }

    return nextDueDate.toLocaleDateString();
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  // @ts-expect-error
  if (!session || session?.user?.role === 'ADMIN') {
    return null;
  }

  return (
    <div className="container mt-5">
      <h1>Welcome, {session.user?.email}</h1>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h2>Your Goals</h2>
        <Link href="/goals/new" className="btn btn-primary">Create New Goal</Link>
      </div>
      <div className="list-group mt-3">
        {goals.length > 0 ? (
          goals.map(goal => (
            <Link href={`/goals/${goal.id}`} key={goal.id} className="list-group-item list-group-item-action" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{goal.title}</h5>
                <small>{goal.status}</small>
              </div>

              {goal.status === 'ASSIGNED' && (
                <div className="mt-2">
                  <button className="btn btn-primary btn-sm" onClick={(e) => { e.preventDefault(); handleStartGoal(goal.id); }}>Start Assignment</button>
                </div>
              )}

              {goal.status === 'ACTIVE' && (
                <div>
                  <p className="mb-1">Next Due Date: {getNextDueDate(goal)}</p>
                  <small>Final Deadline: {new Date(goal.endDate).toLocaleDateString()}</small>
                </div>
              )}

              {goal.status === 'PENDING_INSTRUCTOR_ASSIGNMENT' && (
                 <small>Waiting for an instructor to accept your goal.</small>
              )}
            </Link>
          ))
        ) : (
          <p>You have no goals yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}
