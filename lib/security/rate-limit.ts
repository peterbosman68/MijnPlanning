import "server-only";

import { Prisma } from "@prisma/client";

import {
  LOGIN_BLOCK_MS,
  LOGIN_MAX_FAILURES,
  LOGIN_THROTTLE_TTL_MS,
  LOGIN_WINDOW_MS,
} from "@/lib/auth/constants";
import { hashOpaqueValue } from "@/lib/auth/session-token";
import { getServerEnv } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/client";

type LoginLimit = Readonly<{
  allowed: boolean;
  retryAfterSeconds: number;
}>;

type ThrottleRecord = Readonly<{
  failureCount: number;
  windowStartedAt: Date;
}>;

export function calculateNextThrottleState(
  current: ThrottleRecord | null,
  now: Date,
) {
  const windowExpired =
    !current || now.getTime() - current.windowStartedAt.getTime() >= LOGIN_WINDOW_MS;
  const failureCount = windowExpired ? 1 : current.failureCount + 1;

  return {
    failureCount,
    windowStartedAt: windowExpired ? now : current.windowStartedAt,
    blockedUntil:
      failureCount >= LOGIN_MAX_FAILURES
        ? new Date(now.getTime() + LOGIN_BLOCK_MS)
        : null,
    expiresAt: new Date(now.getTime() + LOGIN_THROTTLE_TTL_MS),
  };
}

function getKeyHashes(email: string, requestSource: string): string[] {
  const secret = getServerEnv().SESSION_SECRET;
  return [
    hashOpaqueValue(`login-account-source:${email}:${requestSource}`, secret),
    hashOpaqueValue(`login-source:${requestSource}`, secret),
  ];
}

export async function checkLoginLimit(
  email: string,
  requestSource: string,
  now: Date,
): Promise<LoginLimit> {
  const records = await prisma.authThrottle.findMany({
    where: { keyHash: { in: getKeyHashes(email, requestSource) } },
  });
  const activeRecords = records.filter(
    (record) => record.expiresAt.getTime() > now.getTime(),
  );
  const blockedRecord = activeRecords.find(
    (record) => record.blockedUntil && record.blockedUntil.getTime() > now.getTime(),
  );

  if (!blockedRecord?.blockedUntil) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((blockedRecord.blockedUntil.getTime() - now.getTime()) / 1000),
    ),
  };
}

export async function recordLoginFailure(
  email: string,
  requestSource: string,
  now: Date,
): Promise<void> {
  for (const keyHash of getKeyHashes(email, requestSource)) {
    await recordFailureWithRetry(keyHash, now);
  }
}

async function recordFailureWithRetry(
  keyHash: string,
  now: Date,
  retryCount = 0,
): Promise<void> {
  try {
    await prisma.$transaction(
      async (transaction) => {
        const current = await transaction.authThrottle.findUnique({
          where: { keyHash },
        });
        const next = calculateNextThrottleState(current, now);

        await transaction.authThrottle.upsert({
          where: { keyHash },
          create: {
            keyHash,
            ...next,
          },
          update: {
            ...next,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    const retryable =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034");

    if (retryable && retryCount < 2) {
      await recordFailureWithRetry(keyHash, now, retryCount + 1);
      return;
    }

    throw error;
  }
}

export function clearLoginFailures(email: string, requestSource: string) {
  return prisma.authThrottle.deleteMany({
    where: { keyHash: { in: getKeyHashes(email, requestSource) } },
  });
}
