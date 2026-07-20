import "server-only";

import {
  MINIMUM_PASSWORD_LENGTH,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from "@/lib/auth/constants";
import { getServerEnv } from "@/lib/config/server-env";
import {
  sendPasswordResetEmail,
  type PasswordResetEmailSender,
} from "@/lib/email/resend";
import { logger } from "@/lib/logging/logger";
import {
  consumePasswordResetRequestLimit,
  consumePasswordResetTokenAttemptLimit,
} from "@/lib/security/password-reset-rate-limit";

import { hashPassword, verifyPassword } from "./password";
import {
  PasswordResetConflictError,
  passwordResetRepository,
  type PasswordResetCandidate,
} from "./password-reset-repository";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
} from "./password-reset-token";

const MINIMUM_RESPONSE_TIME_MS = 500;

export type PasswordResetRequestInput = Readonly<{
  email: string;
  requestSource: string;
  origin: string;
}>;

export type CompletePasswordResetInput = Readonly<{
  token: string;
  newPassword: string;
  requestSource: string;
}>;

export type CompletePasswordResetResult =
  | "SUCCESS"
  | "INVALID_OR_EXPIRED"
  | "PASSWORD_INVALID"
  | "PASSWORD_UNCHANGED";

export type PasswordResetServiceRepository = Readonly<{
  findUserByEmail: (
    email: string,
  ) => Promise<{ id: string; email: string } | null>;
  createToken: (input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    now: Date;
  }) => Promise<{ id: string }>;
  deleteToken: (id: string) => Promise<unknown>;
  findCandidate: (tokenHash: string) => Promise<PasswordResetCandidate | null>;
  commitReset: (
    candidate: PasswordResetCandidate,
    passwordHash: string,
    now: Date,
  ) => Promise<{ revokedSessionCount: number }>;
}>;

export type PasswordResetRequestDependencies = Readonly<{
  repository: PasswordResetServiceRepository;
  sendEmail: PasswordResetEmailSender;
  consumeRequestLimit: typeof consumePasswordResetRequestLimit;
  getSecret: () => string;
  waitForGenericResponse: (startedAt: number) => Promise<void>;
}>;

export type CompletePasswordResetDependencies = Readonly<{
  repository: PasswordResetServiceRepository;
  consumeTokenAttemptLimit: typeof consumePasswordResetTokenAttemptLimit;
  getSecret: () => string;
}>;

const defaultRequestDependencies: PasswordResetRequestDependencies = {
  repository: passwordResetRepository,
  sendEmail: sendPasswordResetEmail,
  consumeRequestLimit: consumePasswordResetRequestLimit,
  getSecret: () => getServerEnv().SESSION_SECRET,
  waitForGenericResponse: async (startedAt) => {
    const remaining = MINIMUM_RESPONSE_TIME_MS - (Date.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  },
};

const defaultCompleteDependencies: CompletePasswordResetDependencies = {
  repository: passwordResetRepository,
  consumeTokenAttemptLimit: consumePasswordResetTokenAttemptLimit,
  getSecret: () => getServerEnv().SESSION_SECRET,
};

function getResetUrl(origin: string, token: string): string {
  const resetUrl = new URL("/wachtwoord-herstellen", origin);
  if (!["http:", "https:"].includes(resetUrl.protocol)) {
    throw new Error("INVALID_PASSWORD_RESET_ORIGIN");
  }

  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

export async function requestPasswordReset(
  input: PasswordResetRequestInput,
  now = new Date(),
  dependencies: PasswordResetRequestDependencies = defaultRequestDependencies,
): Promise<void> {
  const startedAt = Date.now();
  const email = input.email.trim().toLowerCase();

  try {
    const allowed = await dependencies.consumeRequestLimit(
      email,
      input.requestSource,
      now,
    );

    if (!allowed) {
      logger.warn({
        code: "AUTH_PASSWORD_RESET_REQUEST_RATE_LIMITED",
        route: "/wachtwoord-vergeten",
        status: "rejected",
      });
      return;
    }

    const user = await dependencies.repository.findUserByEmail(email);
    if (!user) {
      return;
    }

    const token = createPasswordResetToken();
    const tokenHash = hashPasswordResetToken(token, dependencies.getSecret());
    const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS);
    const record = await dependencies.repository.createToken({
      userId: user.id,
      tokenHash,
      expiresAt,
      now,
    });

    try {
      await dependencies.sendEmail({
        recipient: user.email,
        resetUrl: getResetUrl(input.origin, token),
        requestId: record.id,
        expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MS / 60_000,
      });
    } catch {
      await dependencies.repository.deleteToken(record.id).catch(() => undefined);
      logger.error({
        code: "AUTH_PASSWORD_RESET_EMAIL_FAILED",
        route: "/wachtwoord-vergeten",
        status: "error",
      });
    }
  } finally {
    await dependencies.waitForGenericResponse(startedAt);
  }
}

export async function completePasswordReset(
  input: CompletePasswordResetInput,
  now = new Date(),
  dependencies: CompletePasswordResetDependencies = defaultCompleteDependencies,
): Promise<CompletePasswordResetResult> {
  if (
    input.newPassword.length < MINIMUM_PASSWORD_LENGTH ||
    input.newPassword.length > 1024
  ) {
    return "PASSWORD_INVALID";
  }

  if (input.token.length < 32 || input.token.length > 512) {
    return "INVALID_OR_EXPIRED";
  }

  const allowed = await dependencies.consumeTokenAttemptLimit(
    input.requestSource,
    now,
  );
  if (!allowed) {
    return "INVALID_OR_EXPIRED";
  }

  const tokenHash = hashPasswordResetToken(
    input.token,
    dependencies.getSecret(),
  );
  const candidate = await dependencies.repository.findCandidate(tokenHash);
  if (
    !candidate ||
    candidate.usedAt ||
    candidate.expiresAt.getTime() <= now.getTime()
  ) {
    return "INVALID_OR_EXPIRED";
  }

  if (await verifyPassword(candidate.user.passwordHash, input.newPassword)) {
    return "PASSWORD_UNCHANGED";
  }

  const passwordHash = await hashPassword(input.newPassword);

  try {
    await dependencies.repository.commitReset(candidate, passwordHash, now);
  } catch (error) {
    if (error instanceof PasswordResetConflictError) {
      return "INVALID_OR_EXPIRED";
    }
    throw error;
  }

  logger.info({
    code: "AUTH_PASSWORD_RESET_SUCCEEDED",
    route: "/wachtwoord-herstellen",
    status: "ok",
  });
  return "SUCCESS";
}
