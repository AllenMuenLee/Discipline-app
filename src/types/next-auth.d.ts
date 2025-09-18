import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'STUDENT' | 'INSTRUCTOR' | "ADMIN";
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: 'STUDENT' | 'INSTRUCTOR' | "ADMIN";
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'STUDENT' | 'INSTRUCTOR' | "ADMIN";
  }
}
