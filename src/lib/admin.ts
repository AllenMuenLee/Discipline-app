import { Session } from 'next-auth';

export function isAdmin(session: Session | null): boolean {
  // @ts-expect-error
  return session?.user?.role === 'ADMIN';
}
