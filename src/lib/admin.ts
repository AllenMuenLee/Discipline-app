import { Session } from 'next-auth';

export function isAdmin(session: Session | null): boolean {
  // @ts-ignore
  return session?.user?.role === 'ADMIN';
}
