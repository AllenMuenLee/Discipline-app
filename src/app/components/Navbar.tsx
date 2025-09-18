'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand">Discipline App</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            {session ? (
              <>
                <li className="nav-item">
                  <span className="nav-link">Welcome, {session.user?.email}</span>
                </li>
                <li className="nav-item">
                  <Link href="/dashboard" className="nav-link">Dashboard</Link>
                </li>
                {session.user?.role === 'INSTRUCTOR' && (
                  <li className="nav-item">
                    <Link href="/instructor/dashboard" className="nav-link">Instructor Dashboard</Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link href="/account" className="nav-link">Account</Link>
                </li>
                <li className="nav-item">
                  <button onClick={() => signOut()} className="btn btn-outline-danger">Logout</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link href="/login" className="nav-link">Login</Link>
                </li>
                <li className="nav-item">
                  <Link href="/register" className="nav-link">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
