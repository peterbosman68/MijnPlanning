import "server-only";

import { cookies } from "next/headers";

import { getServerEnv } from "@/lib/config/server-env";

import { getSessionCookieName, getSessionCookieOptions } from "./cookie-options";
import {
  findSessionByTokenHash,
  revokeAllSessionsForUser,
  revokeSessionById,
  revokeSessionByTokenHash,
  touchSession,
} from "./repository";
import { isSessionUsable, shouldTouchSession } from "./session-policy";
import { hashOpaqueValue } from "./session-token";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function validRawToken(value: string | undefined): value is string {
  return Boolean(value && value.length >= 40 && value.length <= 128);
}

export type AuthenticatedSession = Readonly<{
  id: string;
  user: Readonly<{
    id: string;
    email: string;
    timeZone: string;
  }>;
}>;

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    getSessionCookieName(isProduction()),
    token,
    getSessionCookieOptions(expiresAt, isProduction()),
  );
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(getSessionCookieName(isProduction()));
}

export async function getSession(
  now = new Date(),
): Promise<AuthenticatedSession | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(getSessionCookieName(isProduction()))?.value;

  if (!validRawToken(rawToken)) {
    return null;
  }

  const tokenHash = hashOpaqueValue(rawToken, getServerEnv().SESSION_SECRET);
  const session = await findSessionByTokenHash(tokenHash);

  if (!session) {
    return null;
  }

  if (!isSessionUsable(session, now)) {
    await revokeSessionById(session.id, now);
    return null;
  }

  if (shouldTouchSession(session.lastUsedAt, now)) {
    await touchSession(session.id, now);
  }

  return {
    id: session.id,
    user: session.user,
  };
}

export async function revokeCurrentSession(now = new Date()): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(getSessionCookieName(isProduction()))?.value;

  if (validRawToken(rawToken)) {
    const tokenHash = hashOpaqueValue(rawToken, getServerEnv().SESSION_SECRET);
    await revokeSessionByTokenHash(tokenHash, now);
  }

  await clearSessionCookie();
}

export async function revokeAllUserSessions(
  userId: string,
  now = new Date(),
): Promise<void> {
  await revokeAllSessionsForUser(userId, now);
  await clearSessionCookie();
}
