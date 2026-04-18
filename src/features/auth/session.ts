import { cookies } from "next/headers";
import { db } from "@/src/db";
import { sessions, users } from "@/src/db/shared-schema";
import { eq } from "drizzle-orm";
import { hashToken, generateSessionId, generateRawToken } from "./crypto";

const SESSION_COOKIE = "__session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SLIDING_RENEWAL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  displayName: string | null;
  onboardedAt: Date | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) return null;

  const dotIndex = sessionCookie.value.indexOf(".");
  if (dotIndex === -1) return null;

  const sessionId = sessionCookie.value.substring(0, dotIndex);
  const rawToken = sessionCookie.value.substring(dotIndex + 1);

  if (!sessionId || !rawToken) return null;

  const tokenHash = hashToken(rawToken);

  const sessionRows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (sessionRows.length === 0) return null;

  const session = sessionRows[0];

  if (session.tokenHash !== tokenHash) return null;
  if (session.expiresAt < new Date()) return null;

  const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
  if (timeUntilExpiry < SLIDING_RENEWAL_MS) {
    const newExpiry = new Date(Date.now() + SESSION_DURATION_MS);
    await db
      .update(sessions)
      .set({ expiresAt: newExpiry, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      status: users.status,
      displayName: users.displayName,
      onboardedAt: users.onboardedAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (userRows.length === 0) return null;

  return userRows[0];
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: sessionId,
    tokenHash,
    userId,
    createdAt: now,
    expiresAt,
    updatedAt: now,
  });

  return `${sessionId}.${rawToken}`;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) return;

  const dotIndex = sessionCookie.value.indexOf(".");
  if (dotIndex === -1) return;

  const sessionId = sessionCookie.value.substring(0, dotIndex);

  await db.delete(sessions).where(eq(sessions.id, sessionId));

  cookieStore.delete(SESSION_COOKIE);
}

export async function setSessionCookie(cookieValue: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  });
}
