import "server-only";

import { Prisma } from "@prisma/client";

import {
  PASSWORD_RESET_MAX_ACCOUNT_SOURCE_REQUESTS,
  PASSWORD_RESET_MAX_SOURCE_REQUESTS,
  PASSWORD_RESET_MAX_TOKEN_ATTEMPTS,
  PASSWORD_RESET_REQUEST_TTL_MS,
  PASSWORD_RESET_REQUEST_WINDOW_MS,
} from "@/lib/auth/constants";
import { hashOpaqueValue } from "@/lib/auth/session-token";
import { getServerEnv } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/client";

type RateLimitKey = Readonly<{
  keyHash: string;
  maximum: number;
}>;

type ThrottleRecord = Readonly<{
  keyHash: string;
  failureCount: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
  expiresAt: Date;
}>;

export function calculatePasswordResetThrottleState(
  current: Pick<ThrottleRecord, "failureCount" | "windowStartedAt"> | null,
  maximum: number,
  now: Date,
) {
  const windowExpired =
    !current ||
    now.getTime() - current.windowStartedAt.getTime() >=
      PASSWORD_RESET_REQUEST_WINDOW_MS;
  const windowStartedAt = windowExpired ? now : current.windowStartedAt;
  const failureCount = windowExpired ? 1 : current.failureCount + 1;

  return {
    failureCount,
    windowStartedAt,
    blockedUntil:
      failureCount >= maximum
        ? new Date(windowStartedAt.getTime() + PASSWORD_RESET_REQUEST_WINDOW_MS)
        : null,
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_REQUEST_TTL_MS),
  };
}

function isBlocked(
  current: ThrottleRecord | undefined,
  maximum: number,
  now: Date,
): boolean {
  if (!current || current.expiresAt.getTime() <= now.getTime()) {
    return false;
  }

  const withinWindow =
    now.getTime() - current.windowStartedAt.getTime() <
    PASSWORD_RESET_REQUEST_WINDOW_MS;

  return (
    (current.blockedUntil?.getTime() ?? 0) > now.getTime() ||
    (withinWindow && current.failureCount >= maximum)
  );
}

function hashLimitKey(value: string): string {
  return hashOpaqueValue(value, getServerEnv().SESSION_SECRET);
}

function requestKeys(email: string, requestSource: string): RateLimitKey[] {
  return [
    {
      keyHash: hashLimitKey(`password-reset-request-account-source:${email}:${requestSource}`),
      maximum: PASSWORD_RESET_MAX_ACCOUNT_SOURCE_REQUESTS,
    },
    {
      keyHash: hashLimitKey(`password-reset-request-source:${requestSource}`),
      maximum: PASSWORD_RESET_MAX_SOURCE_REQUESTS,
    },
  ];
}

function tokenAttemptKeys(requestSource: string): RateLimitKey[] {
  return [
    {
      keyHash: hashLimitKey(`password-reset-token-source:${requestSource}`),
      maximum: PASSWORD_RESET_MAX_TOKEN_ATTEMPTS,
    },
  ];
}

async function consumeLimitWithRetry(
  keys: RateLimitKey[],
  now: Date,
  retryCount = 0,
): Promise<boolean> {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const records = await transaction.authThrottle.findMany({
          where: { keyHash: { in: keys.map(({ keyHash }) => keyHash) } },
        });
        const recordsByKey = new Map(
          records.map((record) => [record.keyHash, record]),
        );

        if (
          keys.some(({ keyHash, maximum }) =>
            isBlocked(recordsByKey.get(keyHash), maximum, now),
          )
        ) {
          return false;
        }

        for (const { keyHash, maximum } of keys) {
          const current = recordsByKey.get(keyHash) ?? null;
          const next = calculatePasswordResetThrottleState(current, maximum, now);
          await transaction.authThrottle.upsert({
            where: { keyHash },
            create: { keyHash, ...next },
            update: next,
          });
        }

        return true;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    const retryable =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034");

    if (retryable && retryCount < 2) {
      return consumeLimitWithRetry(keys, now, retryCount + 1);
    }

    throw error;
  }
}

export function consumePasswordResetRequestLimit(
  email: string,
  requestSource: string,
  now = new Date(),
): Promise<boolean> {
  return consumeLimitWithRetry(requestKeys(email, requestSource), now);
}

export function consumePasswordResetTokenAttemptLimit(
  requestSource: string,
  now = new Date(),
): Promise<boolean> {
  return consumeLimitWithRetry(tokenAttemptKeys(requestSource), now);
}
