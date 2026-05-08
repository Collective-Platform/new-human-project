import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/src/db";
import { sessions, users } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { hashToken, generateSessionId, generateRawToken } from "./crypto";

const SESSION_COOKIE = "__session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SLIDING_RENEWAL_MS = 7 * 24 * 60 * 60 * 1000;
// Don't UPDATE the session row more than once a day to avoid hammering Neon
// HTTP with a write per request once we're inside the renewal window.
const RENEWAL_WRITE_THROTTLE_MS = 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: number;
  email: string;
  role: string;
  status: string;
  displayName: string | null;
  searchHandle: string | null;
  onboardedAt: Date | null;
}

async function _getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) return null;

  const dotIndex = sessionCookie.value.indexOf(".");
  if (dotIndex === -1) return null;

  const sessionId = sessionCookie.value.substring(0, dotIndex);
  const rawToken = sessionCookie.value.substring(dotIndex + 1);

  if (!sessionId || !rawToken) return null;

  const tokenHash = hashToken(rawToken);

  const rows = await db
    .select({
      sessionTokenHash: sessions.tokenHash,
      sessionExpiresAt: sessions.expiresAt,
      sessionUpdatedAt: sessions.updatedAt,
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      displayName: users.displayName,
      searchHandle: users.searchHandle,
      onboardedAt: users.onboardedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];

  if (row.sessionTokenHash !== tokenHash) return null;
  if (row.sessionExpiresAt < new Date()) return null;

  const now = Date.now();
  const timeUntilExpiry = row.sessionExpiresAt.getTime() - now;
  const timeSinceLastWrite = now - row.sessionUpdatedAt.getTime();
  if (
    timeUntilExpiry < SLIDING_RENEWAL_MS &&
    timeSinceLastWrite > RENEWAL_WRITE_THROTTLE_MS
  ) {
    const newExpiry = new Date(now + SESSION_DURATION_MS);
    await db
      .update(sessions)
      .set({ expiresAt: newExpiry, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    displayName: row.displayName,
    searchHandle: row.searchHandle,
    onboardedAt: row.onboardedAt,
  };
}

export const getSessionUser = cache(_getSessionUser);

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

  // Clear the cookie regardless — even if the value is malformed, we still
  // want the browser to drop it.
  cookieStore.delete(SESSION_COOKIE);

  if (!sessionCookie?.value) return;

  const dotIndex = sessionCookie.value.indexOf(".");
  if (dotIndex === -1) return;

  const sessionId = sessionCookie.value.substring(0, dotIndex);
  const rawToken = sessionCookie.value.substring(dotIndex + 1);
  if (!sessionId || !rawToken) return;

  const tokenHash = hashToken(rawToken);

  // Defense in depth: only delete the session if the token hash also matches.
  // Stops anyone with just the session_id half from logging another user out.
  await db
    .delete(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.tokenHash, tokenHash)));
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
