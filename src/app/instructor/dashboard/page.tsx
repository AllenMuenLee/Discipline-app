'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaChalkboardTeacher, FaCheck, FaTimes, FaClipboardList, FaTasks } from 'react-icons/fa';

// Define the types for the goal and user
interface User {
  name: string;
  email: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  user: User;
  endDate: string;
  durationDays: number;
}

export default function InstructorDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingGoals, setPendingGoals] = useState<Goal[]>([]);
  const [assignedGoals, setAssignedGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (status === 'loading') return;

    // @ts-ignore
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (session?.user?.role !== 'INSTRUCTOR') {
      router.push('/dashboard');
    } else {
      fetchPendingGoals();
      fetchAssignedGoals();
    }
  }, [session, status, router]);

  const fetchPendingGoals = async () => {
    try {
      const response = await fetch('/api/instructor/pending-goals');
      if (response.ok) {
        const goals = await response.json();
        setPendingGoals(goals);
      } else {
        console.error('Failed to fetch pending goals');
      }
    } catch (error) {
      console.error('Error fetching pending goals:', error);
    }
  };

  const fetchAssignedGoals = async () => {
    try {
      const response = await fetch('/api/instructor/assigned-goals');
      if (response.ok) {
        const goals = await response.json();
        setAssignedGoals(goals);
      } else {
        console.error('Failed to fetch assigned goals');
      }
    } catch (error) {
      console.error('Error fetching assigned goals:', error);
    }
  };

  const handleAccept = async (goalId: string) => {
    try {
      const response = await fetch(`/api/instructor/goals/${goalId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'accept' }),
        }
      );

      if (response.ok) {
        const acceptedGoal = pendingGoals.find((goal) => goal.id === goalId);
        if (acceptedGoal) {
          setAssignedGoals([...assignedGoals, acceptedGoal]);
        }
        setPendingGoals(pendingGoals.filter((goal) => goal.id !== goalId));
      } else {
        const errorData = await response.json();
        alert(`Failed to accept goal: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error accepting goal:', error);
      alert('An error occurred while accepting the goal.');
    }
  };

  const handleReject = (goalId: string) => {
    // For now, just remove from the list on the frontend
    setPendingGoals(pendingGoals.filter((goal) => goal.id !== goalId));
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  // @ts-ignore
  if (session?.user?.role !== 'INSTRUCTOR') {
    return <p>Access Denied. You must be an instructor to view this page.</p>;
  }

  return (
    <div className="container mt-5 animate__animated animate__fadeIn">
      <div className="row">
        <div className="col-md-8">
          <h1 className="mb-4"><FaChalkboardTeacher className="me-3" />Instructor Dashboard</h1>
          <p className="lead">Welcome, Instructor {session?.user?.email}!</p>
          <hr />
          <h2 className="mb-3"><FaTasks className="me-2" />Assigned Goals</h2>
          <div className="row animate__animated animate__fadeInUp">
            {assignedGoals.length > 0 ? (
              assignedGoals.map((goal) => (
                <div key={goal.id} className="col-md-6 mb-4">
                  <Link href={`/instructor/goals/${goal.id}/submissions`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card h-100 shadow-sm">
                      <div className="card-body">
                        <h5 className="card-title">{goal.title}</h5>
                        <p className="card-text">{goal.description}</p>
                        <p className="card-text">
                          <small className="text-muted">
                            Student: {goal.user.name} ({goal.user.email})
                          </small>
                        </p>
                        <p className="card-text">
                          <small className="text-muted">
                            Deadline: {new Date(goal.endDate).toLocaleDateString()}
                          </small>
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <p>You have not accepted any goals yet.</p>
            )}
          </div>
        </div>
        <div className="col-md-4">
          <h2 className="mb-3"><FaClipboardList className="me-2" />Pending Goals</h2>
          <div className="animate__animated animate__fadeInUp">
            {pendingGoals.length > 0 ? (
              <ul className="list-group">
                {pendingGoals.map((goal) => (
                  <li key={goal.id} className="list-group-item d-flex justify-content-between align-items-center mb-2 shadow-sm">
                    <Link href={`/instructor/goals/${goal.id}/submissions`} style={{ textDecoration: 'none', color: 'inherit' }} className="flex-grow-1 me-2">
                      <h5>{goal.title}</h5>
                      <p className="mb-1">{goal.description}</p>
                      <p className="mb-1"><small>Duration: {goal.durationDays} days</small></p>
                      <p className="mb-0"><small>From: {goal.user.name} ({goal.user.email})</small></p>
                    </Link>
                    <div className="d-flex flex-column">
                      <button className="btn btn-success btn-sm mb-1 animate__animated animate__pulse animate__infinite" onClick={(e) => { e.preventDefault(); handleAccept(goal.id); }}>
                        <FaCheck /> Accept
                      </button>
                      <button className="btn btn-danger btn-sm animate__animated animate__pulse animate__infinite" onClick={(e) => { e.preventDefault(); handleReject(goal.id); }}>
                        <FaTimes /> Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No pending goals at the moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}