'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleRequestInstructor = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/user/request-instructor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Instructor request submitted successfully!');
        // Manually update the session to reflect the new role
        await update(); // Refresh the session to reflect the new role
      } else {
        setError(data.message || 'Failed to submit instructor request.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const userCurrentRole = session?.user?.role || 'STUDENT';
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  return (
    <div className="container mt-5">
      <h1>Account Center</h1>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">User Details</h5>
          <p className="card-text"><strong>ID:</strong> {userId}</p>
          <p className="card-text"><strong>Email:</strong> {userEmail}</p>
          <p className="card-text"><strong>Role:</strong> {userCurrentRole}</p>

          {userCurrentRole === 'STUDENT' && (
            <div className="mt-4">
              <button
                className="btn btn-primary"
                onClick={handleRequestInstructor}
                disabled={loading}
              >
                {loading ? 'Submitting Request...' : 'Request to be an Instructor'}
              </button>
              {message && <div className="alert alert-success mt-3">{message}</div>}
              {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div>
          )}

          {userCurrentRole === 'INSTRUCTOR' && (
            <div className="mt-4">
              <p className="alert alert-info">You are currently an instructor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
