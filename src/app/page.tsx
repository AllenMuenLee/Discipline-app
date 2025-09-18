'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return <p>Loading...</p>;
  }

  return (
    <div className="text-center">
      <h1 className="display-4 fw-bold">Build Discipline, Achieve Your Goals</h1>
      <p className="lead mt-3">The only app that puts your money where your mouth is.</p>
      <p>Set a goal, stake some cash, and get it back when you succeed.</p>
      <Link href="/register" className="btn btn-primary btn-lg mt-3">Get Started</Link>
    </div>
  );
}

