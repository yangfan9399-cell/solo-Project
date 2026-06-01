import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { prisma } from "./db.server";
import type { UserRole } from "../app/utils/types";

export type { UserRole };

const sessionSecret = process.env.SESSION_SECRET || "default-secret-change-in-production";

const storage = createCookieSessionStorage({
  cookie: {
    name: "CMT_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      select: { id: true, name: true, role: true, username: true },
      where: { id: userId },
    });
    return user;
  } catch {
    throw await logout(request);
  }
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    select: { id: true, name: true, role: true, username: true },
    where: { id: userId },
  });
  if (!user) throw await logout(request);
  return { ...user, role: user.role as UserRole };
}

export async function requireRole(request: Request, roles: UserRole[]) {
  const user = await requireUser(request);
  if (!roles.includes(user.role)) {
    throw redirect("/forbidden");
  }
  return user;
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

export async function verifyLogin(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return { id: user.id, name: user.name, role: user.role, username: user.username };
}

export { getRoleName } from "../app/utils/labels";
