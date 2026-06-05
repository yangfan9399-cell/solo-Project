import { createCookieSessionStorage, redirect } from '@remix-run/node';
import bcrypt from 'bcryptjs';
import { prisma } from './db.server';
import type { User } from '@prisma/client';

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [process.env.SESSION_SECRET || 'secret'],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserFromSession(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireUser(request: Request) {
  const user = await getUserFromSession(request);
  if (!user) {
    throw redirect('/login');
  }
  return user;
}

export async function requireRole(request: Request, roles: User['role'][]) {
  const user = await requireUser(request);
  if (!roles.includes(user.role)) {
    throw redirect('/');
  }
  return user;
}

export async function logout(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return redirect('/login', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
