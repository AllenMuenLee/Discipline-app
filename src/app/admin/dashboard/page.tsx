'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string; // Add name field
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

interface Goal {
  id: string;
  title: string;
  description: string;
  endDate: string;
  userId: string;
  instructorId: string | null;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [editableUsers, setEditableUsers] = useState<User[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'goals'>('users');

  useEffect(() => {
    if (status === 'loading') return;

    // @ts-expect-error
    if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
      router.push('/login');
    } else {
      fetchUsers();
      fetchGoals();
    }
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setEditableUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleNameChange = (userId: string, newName: string) => {
    setEditableUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, name: newName } : user
      )
    );
  };

  const handleSaveAllChanges = async () => {
    try {
      for (const editableUser of editableUsers) {
        const originalUser = users.find((u) => u.id === editableUser.id);
        if (originalUser && originalUser.name !== editableUser.name) {
          await fetch(`/api/admin/users/${editableUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editableUser.name }),
          });
        }
      }
      fetchUsers(); // Re-fetch all users to ensure UI is in sync
      alert('All changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save all changes.');
    }
  };

  const handleCancelAllEdits = () => {
    setEditableUsers(users); // Revert to original users
    alert('All edits cancelled.');
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/admin/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      } else {
        console.error('Failed to fetch goals');
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchUsers(); // Re-fetch users to update the UI
      } else {
        alert('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('An error occurred while updating user role.');
    }
  };

  const handleUserDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsers(); // Re-fetch users to update the UI
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An error occurred while deleting user.');
    }
  };

  const handleGoalEndDateChange = async (goalId: string, newEndDate: string) => {
    try {
      const res = await fetch(`/api/admin/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate: newEndDate }),
      });
      if (res.ok) {
        fetchGoals(); // Re-fetch goals to update the UI
      } else {
        alert('Failed to update goal end date');
      }
    } catch (error) {
      console.error('Error updating goal end date:', error);
      alert('An error occurred while updating goal end date.');
    }
  };

  const handleGoalDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      const res = await fetch(`/api/admin/goals/${goalId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchGoals(); // Re-fetch goals to update the UI
      } else {
        alert('Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('An error occurred while deleting goal.');
    }
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  // @ts-expect-error
  if (session?.user?.role !== 'ADMIN') {
    return <p>Access Denied. You must be an admin to view this page.</p>;
  }

  return (
    <div className="container mt-5">
      <h1>Admin Dashboard</h1>
      <div className="mb-3">
        <button className={`btn me-2 ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>Manage Users</button>
        <button className={`btn ${activeTab === 'goals' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('goals')}>Manage Goals</button>
      </div>

      {activeTab === 'users' && (
        <div>
          <h2>Users</h2>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {editableUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={user.name || ''}
                      onChange={(e) => handleNameChange(user.id, e.target.value)}
                    />
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="form-select"
                      value={user.role}
                      onChange={(e) => handleUserRoleChange(user.id, e.target.value as User['role'])}
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="INSTRUCTOR">INSTRUCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleUserDelete(user.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <button className="btn btn-primary me-2" onClick={handleSaveAllChanges}>Save All Changes</button>
            <button className="btn btn-secondary" onClick={handleCancelAllEdits}>Cancel All Edits</button>
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div>
          <h2>Goals</h2>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>End Date</th>
                <th>User ID</th>
                <th>Instructor ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={goal.id}>
                  <td>{goal.id}</td>
                  <td>{goal.title}</td>
                  <td>{goal.description}</td>
                  <td>
                    <input
                      type="date"
                      className="form-control"
                      value={new Date(goal.endDate).toISOString().split('T')[0]}
                      onChange={(e) => handleGoalEndDateChange(goal.id, e.target.value)}
                    />
                  </td>
                  <td>{goal.userId}</td>
                  <td>{goal.instructorId || 'N/A'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleGoalDelete(goal.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
