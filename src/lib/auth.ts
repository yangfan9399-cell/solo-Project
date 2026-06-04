import prisma from "./prisma";
import type { UserInfo } from "./types";

interface CookieValue {
  value?: string;
}

interface CookieEvent {
  cookie: {
    get: (name: string) => CookieValue | null;
    set: (name: string, value: string, options?: any) => void;
    delete: (name: string) => void;
  };
}

const COOKIE_NAME = "current_user";

export const userCookie = {
  get: (event: CookieEvent) => {
    const cookie = event.cookie.get(COOKIE_NAME);
    return cookie?.value;
  },
  set: (event: CookieEvent, value: string) => {
    event.cookie.set(COOKIE_NAME, value, {
      secure: false,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });
  },
  delete: (event: CookieEvent) => {
    event.cookie.delete(COOKIE_NAME);
  },
};

export async function getCurrentUser(
  cookieValue: string | undefined
): Promise<UserInfo | null> {
  if (!cookieValue) return null;

  try {
    const userId = JSON.parse(cookieValue);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function switchUser(userId: string): Promise<UserInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
    },
  });

  return user;
}

export async function getAllUsers(): Promise<UserInfo[]> {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
    },
    orderBy: { role: "asc" },
  });
}
