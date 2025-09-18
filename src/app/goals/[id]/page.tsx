'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FaHome, FaCheckCircle, FaTimesCircle, FaEdit, FaPaperPlane, FaBan } from 'react-icons/fa';

type Submission = { id: string; submissionDate: string; content: string; status: string; goalId: string; fileUrl?: string | null; };
type Goal = { id: string; title: string; description: string; status: string; submissions: Submission[]; startedAt: string | null; endDate: string | null; instructorId: string | null; durationDays: number };

export default function GoalDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchGoal = useCallback(async () => {
    if (status === 'authenticated' && id) {
      const res = await fetch(`/api/goals/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGoal(data);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysSubmission = data.submissions.find((sub: Submission) => {
          const subDate = new Date(sub.submissionDate);
          subDate.setHours(0, 0, 0, 0);
          return subDate.getTime() === today.getTime();
        });

        if (todaysSubmission) {
          setSubmissionContent(todaysSubmission.content);
          setEditingSubmissionId(todaysSubmission.id);
        } else {
          setSubmissionContent('');
          setEditingSubmissionId(null);
        }
      } else {
        router.push('/dashboard');
      }
    }
  }, [id, router, status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    fetchGoal();
  }, [status, router, fetchGoal]);

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('content', submissionContent);
    if (submissionFile) {
      formData.append('file', submissionFile);
    }

    let res;
    if (editingSubmissionId) {
      res = await fetch(`/api/submissions/${editingSubmissionId}`, {
        method: 'PATCH',
        body: formData,
      });
    } else {
      formData.append('goalId', id as string);
      res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });
    }

    if (res.ok) {
      await fetchGoal();
      setSubmissionContent('');
      setSubmissionFile(null);
      setEditingSubmissionId(null);
    } else {
      const data = await res.json();
      setError(data.message || 'Failed to submit.');
    }
  };

  const handleEditSubmission = (submission: Submission) => {
    setSubmissionContent(submission.content);
    setEditingSubmissionId(submission.id);
    setSubmissionFile(null);
  };

  const handleCancelEdit = () => {
    setSubmissionContent('');
    setSubmissionFile(null);
    setEditingSubmissionId(null);
  };

  const handleGoalStatusChange = async (newStatus: 'COMPLETED' | 'FAILED') => {
    setError('');
    setLoading(true);
    const res = await fetch(`/api/instructor/goals/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    setLoading(false);
    if (res.ok) {
      await fetchGoal();
    } else {
      const data = await res.json();
      setError(data.message || 'Failed to update goal status.');
    }
  };

  if (status === 'loading' || !goal) {
    return <p>Loading...</p>;
  }

  // @ts-expect-error
  const isInstructor = session?.user?.role === 'INSTRUCTOR';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasSubmittedToday = goal.submissions.some(sub => {
    const subDate = new Date(sub.submissionDate);
    subDate.setHours(0, 0, 0, 0);
    return subDate.getTime() === today.getTime();
  });

  const canCreateNewSubmission = goal.status === 'ACTIVE' && !hasSubmittedToday;

  return (
    <div className="container my-5 animate__animated animate__fadeIn">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/dashboard" className="d-flex align-items-center">
              <FaHome className="me-2" /> Dashboard
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">{goal.title}</li>
        </ol>
      </nav>

      {error && <div className="alert alert-danger my-4 animate__animated animate__shakeX">{error}</div>}

      {isInstructor && goal.status === 'ACTIVE' && goal.instructorId === session.user?.id && (
        <div className="card bg-light mb-4 animate__animated animate__fadeInUp">
            <div className="card-body">
                <h5 className="card-title">Instructor Actions</h5>
                <p>As an instructor, you can finalize the status of this goal.</p>
                <button onClick={() => handleGoalStatusChange('COMPLETED')} className="btn btn-success me-2 animate__animated animate__pulse animate__infinite" disabled={loading}>
                  <FaCheckCircle className="me-2" /> Mark as Completed (Refund Stake)
                </button>
                <button onClick={() => handleGoalStatusChange('FAILED')} className="btn btn-danger animate__animated animate__pulse animate__infinite" disabled={loading}>
                  <FaTimesCircle className="me-2" /> Mark as Failed (Capture Stake)
                </button>
            </div>
        </div>
      )}

      <div className="card mb-4 animate__animated animate__fadeInUp">
        <div className="card-body">
          <h2 className="card-title">{goal.title}</h2>
          <p className="card-text">{goal.description}</p>
          <p><span className={`badge bg-${goal.status === 'COMPLETED' ? 'success' : goal.status === 'FAILED' ? 'danger' : 'primary'}`}>{goal.status}</span></p>
          <p>Duration: {goal.durationDays} days</p>
          {goal.startedAt && <p>Started: {new Date(goal.startedAt).toLocaleDateString()}</p>}
          {goal.endDate && <p>Ends: {new Date(goal.endDate).toLocaleDateString()}</p>}
        </div>
      </div>

      {goal.status === 'ACTIVE' && (editingSubmissionId || canCreateNewSubmission) && (
        <div className="card mt-4 animate__animated animate__fadeInUp">
          <div className="card-body">
            <h3 className="card-title">{editingSubmissionId ? 'Edit Submission' : 'New Submission'}</h3>
            <form onSubmit={handleSubmission}>
              <div className="mb-3">
                <label htmlFor="submissionContent" className="form-label">Notes / Link to your work</label>
                <textarea
                  className="form-control"
                  id="submissionContent"
                  rows={3}
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="fileUpload" className="form-label">Upload Evidence (optional)</label>
                <input type="file" className="form-control" id="fileUpload" onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)} />
                <small className="form-text text-muted">You can optionally upload a file as evidence.</small>
              </div>
              <button type="submit" className="btn btn-success animate__animated animate__pulse animate__infinite">{editingSubmissionId ? <><FaEdit className="me-2" /> Update Submission</> : <><FaPaperPlane className="me-2" /> Submit for Today</>}</button>
              {editingSubmissionId && (
                <button type="button" className="btn btn-secondary ms-2 animate__animated animate__pulse animate__infinite" onClick={handleCancelEdit}><FaBan className="me-2" /> Cancel Edit</button>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="mt-4 animate__animated animate__fadeInUp">
        <h3>Past Submissions</h3>
        <ul className="list-group">
          {goal.submissions && goal.submissions.length > 0 ? (
            goal.submissions.map(sub => {
              const subDate = new Date(sub.submissionDate);
              subDate.setHours(0, 0, 0, 0);
              const isTodaysSubmission = subDate.getTime() === today.getTime();

              return (
              <li key={sub.id} className="list-group-item d-flex justify-content-between align-items-center animate__animated animate__fadeInUp">
                <div>
                  <strong>{new Date(sub.submissionDate).toLocaleDateString()}</strong>: {sub.content}
                  {sub.fileUrl && <div><a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">View Uploaded File</a></div>}
                </div>
                {goal.status === 'ACTIVE' && sub.status === 'PENDING' && !editingSubmissionId && isTodaysSubmission && (
                  <button className="btn btn-sm btn-info float-end animate__animated animate__pulse animate__infinite" onClick={() => handleEditSubmission(sub)}><FaEdit className="me-2" /> Edit Today&apos;s Submission</button>
                )}
                <span className={`badge bg-${sub.status === 'APPROVED' ? 'success' : sub.status === 'REJECTED' ? 'danger' : 'warning'}`}>{sub.status}</span>
              </li>
              );
            })
          ) : (
            <p>No submissions yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
