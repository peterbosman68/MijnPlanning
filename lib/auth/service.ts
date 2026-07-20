import "server-only";

import { getServerEnv } from "@/lib/config/server-env";
import { logger } from "@/lib/logging/logger";
import {
  checkLoginLimit,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/security/rate-limit";

import { hashPassword, verifyPassword } from "./password";
import {
  createSessionRecord,
  findUserByEmail,
} from "./repository";
import { getAbsoluteSessionExpiry } from "./session-policy";
import { createSessionToken, hashOpaqueValue } from "./session-token";
import type { LoginInput } from "./validation";

const dummyPasswordHash = hashPassword(
  "mijnplanning-dummy-password-that-is-never-valid",
);

export type AuthenticationResult =
  | Readonly<{
      ok: true;
      token: string;
      expiresAt: Date;
    }>
  | Readonly<{
      ok: false;
      reason: "INVALID_CREDENTIALS" | "RATE_LIMITED";
      retryAfterSeconds?: number;
    }>;

async function shortFailureDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

export async function authenticate(
  input: LoginInput,
  requestSource: string,
  now = new Date(),
): Promise<AuthenticationResult> {
  const limit = await checkLoginLimit(input.email, requestSource, now);

  if (!limit.allowed) {
    logger.warn({ code: "AUTH_RATE_LIMITED", route: "/login", status: "rejected" });
    await shortFailureDelay();
    return {
      ok: false,
      reason: "RATE_LIMITED",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  const user = await findUserByEmail(input.email);
  const passwordHash = user?.passwordHash ?? (await dummyPasswordHash);
  const passwordMatches = await verifyPassword(passwordHash, input.password);

  if (!user || !passwordMatches) {
    await recordLoginFailure(input.email, requestSource, now);
    logger.warn({ code: "AUTH_INVALID_CREDENTIALS", route: "/login", status: "rejected" });
    await shortFailureDelay();
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  await clearLoginFailures(input.email, requestSource);

  const token = createSessionToken();
  const expiresAt = getAbsoluteSessionExpiry(now);
  const tokenHash = hashOpaqueValue(token, getServerEnv().SESSION_SECRET);
  await createSessionRecord({ userId: user.id, tokenHash, expiresAt, now });

  logger.info({ code: "AUTH_LOGIN_SUCCEEDED", route: "/login", status: "ok" });
  return { ok: true, token, expiresAt };
}
