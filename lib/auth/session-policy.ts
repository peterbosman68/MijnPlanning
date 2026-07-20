import {
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_IDLE_TTL_MS,
  SESSION_TOUCH_INTERVAL_MS,
} from "./constants";

type SessionTimes = Readonly<{
  expiresAt: Date;
  lastUsedAt: Date;
  revokedAt: Date | null;
}>;

export function getAbsoluteSessionExpiry(now: Date): Date {
  return new Date(now.getTime() + SESSION_ABSOLUTE_TTL_MS);
}

export function isSessionUsable(session: SessionTimes, now: Date): boolean {
  if (session.revokedAt || session.expiresAt.getTime() <= now.getTime()) {
    return false;
  }

  return now.getTime() - session.lastUsedAt.getTime() <= SESSION_IDLE_TTL_MS;
}

export function shouldTouchSession(lastUsedAt: Date, now: Date): boolean {
  return now.getTime() - lastUsedAt.getTime() >= SESSION_TOUCH_INTERVAL_MS;
}
