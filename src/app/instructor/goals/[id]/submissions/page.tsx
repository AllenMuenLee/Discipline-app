
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FaHome, FaCheck, FaTimes } from 'react-icons/fa'; // Import icons

interface Submission {
  id: string;
  submissionDate: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  goalId: string;
  reviewerId: string | null;
  reviewerComment: string | null;
  fileUrl?: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  status: string;
  submissions: Submission[];
  user: { name: string; email: string };
}

export default function InstructorGoalSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { id: goalId } = params;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [submissionToReject, setSubmissionToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchGoalSubmissions = useCallback(async () => {
    if (status === 'authenticated' && goalId && session?.user?.role === 'INSTRUCTOR') {
      setLoading(true);
      try {
        const res = await fetch(`/api/instructor/goals/${goalId}/submissions`);
        if (res.ok) {
          const data = await res.json();
          setGoal(data);
        } else {
          const errorData = await res.json();
          setError(errorData.message || 'Failed to fetch goal submissions.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching goal submissions.');
      } finally {
        setLoading(false);
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'INSTRUCTOR') {
      router.push('/dashboard');
    }
  }, [goalId, router, session?.user?.role, status]);

  useEffect(() => {
    fetchGoalSubmissions();
  }, [fetchGoalSubmissions]);

  const handleSubmissionStatusChange = async (submissionId: string, newStatus: 'APPROVED' | 'REJECTED', reason: string | null = null) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/instructor/submissions/${submissionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, reviewerComment: reason }),
        }
      );

      if (res.ok) {
        setShowRejectModal(false);
        setSubmissionToReject(null);
        setRejectReason('');
        await fetchGoalSubmissions();
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Failed to update submission status.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating submission status.');
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = (submissionId: string) => {
    setSubmissionToReject(submissionId);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSubmissionToReject(null);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (submissionToReject) {
      handleSubmissionStatusChange(submissionToReject, 'REJECTED', rejectReason);
    }
  };

  if (status === 'loading' || loading || !goal) {
    return <p>Loading...</p>;
  }

  const sortedSubmissions = [...goal.submissions].sort((a, b) =>
    new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysSubmission = sortedSubmissions.find(sub => {
    const subDate = new Date(sub.submissionDate);
    subDate.setHours(0, 0, 0, 0);
    return subDate.getTime() === today.getTime();
  });

  const pastSubmissions = sortedSubmissions.filter(sub => {
    const subDate = new Date(sub.submissionDate);
    subDate.setHours(0, 0, 0, 0);
    return subDate.getTime() !== today.getTime();
  });

  return (
    <div className="container my-5">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/instructor/dashboard" className="d-flex align-items-center">
              <FaHome className="me-2" /> Instructor Dashboard
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">{goal.title} Submissions</li>
        </ol>
      </nav>

      {error && <div className="alert alert-danger my-4 animate__animated animate__fadeIn">{error}</div>}

      <div className="card mb-4 animate__animated animate__fadeInUp">
        <div className="card-header">
          <h2 className="card-title h5 mb-0">{goal.title}</h2>
        </div>
        <div className="card-body">
          <p className="card-text">{goal.description}</p>
          <p className="card-text"><small className="text-muted">Student: {goal.user.name} ({goal.user.email})</small></p>
          <p className="mb-0"><span className={`badge bg-${goal.status === 'COMPLETED' ? 'success' : goal.status === 'FAILED' ? 'danger' : 'primary'}`}>{goal.status}</span></p>
        </div>
      </div>

      {todaysSubmission && (
        <>
          <h3 className="mb-3">Today's Submission</h3>
          <div className="card mb-4 shadow-sm animate__animated animate__fadeInUp">
            <div className="card-body">
              <p className="card-text">{todaysSubmission.content}</p>
              {todaysSubmission.fileUrl ? (
                <p><a href={todaysSubmission.fileUrl} target="_blank" rel="noopener noreferrer">View Uploaded File</a></p>
              ) : (
                <p><small className="text-muted">No file uploaded</small></p>
              )}
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small>Status:</small>
                  <span className={`badge ms-2 bg-${todaysSubmission.status === 'APPROVED' ? 'success' : todaysSubmission.status === 'REJECTED' ? 'danger' : 'warning'}`}>{todaysSubmission.status}</span>
                  {todaysSubmission.reviewerComment && (
                    <p className="text-danger mb-0 mt-2"><strong>Reason:</strong> {todaysSubmission.reviewerComment}</p>
                  )}
                </div>
                {todaysSubmission.status === 'PENDING' && (
                  <div>
                    <button onClick={() => handleSubmissionStatusChange(todaysSubmission.id, 'APPROVED')} className="btn btn-success btn-sm me-2">
                      <FaCheck className="me-1" /> Approve
                    </button>
                    <button onClick={() => openRejectModal(todaysSubmission.id)} className="btn btn-danger btn-sm">
                      <FaTimes className="me-1" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <h3 className="mb-3 mt-4">Past Submissions</h3>
      {pastSubmissions.length > 0 ? (
        pastSubmissions.map(sub => (
          <div key={sub.id} className="card mb-3 animate__animated animate__fadeInUp">
            <div className="card-body">
              <p className="card-text mb-1"><strong>{new Date(sub.submissionDate).toLocaleDateString()}</strong></p>
              <p className="card-text">{sub.content}</p>
              {sub.fileUrl ? (
                <p><a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">View Uploaded File</a></p>
              ) : (
                <p><small className="text-muted">No file uploaded</small></p>
              )}
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small>Status:</small>
                  <span className={`badge ms-2 bg-${sub.status === 'APPROVED' ? 'success' : sub.status === 'REJECTED' ? 'danger' : 'warning'}`}>{sub.status}</span>
                  {sub.reviewerComment && (
                    <p className="text-danger mb-0 mt-2"><strong>Reason:</strong> {sub.reviewerComment}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>No past submissions.</p>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="modal animate__animated animate__fadeIn" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog animate__animated animate__zoomIn">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reason for Rejection</h5>
                <button type="button" className="btn-close" onClick={closeRejectModal}></button>
              </div>
              <div className="modal-body">
                <textarea
                  className="form-control"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this submission."
                ></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeRejectModal}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmReject} disabled={!rejectReason.trim()}>Reject Submission</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
