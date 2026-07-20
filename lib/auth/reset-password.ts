import type { PrismaClient } from "@prisma/client";

import { MINIMUM_PASSWORD_LENGTH } from "./constants.ts";
import { hashPassword, verifyPassword } from "./password.ts";

export type ResetPasswordErrorCode =
  | "ACCOUNT_MISMATCH"
  | "NEW_PASSWORD_INVALID"
  | "PASSWORD_UNCHANGED"
  | "PASSWORD_RESET_CONFLICT"
  | "SINGLE_USER_NOT_CONFIGURED";

export class ResetPasswordError extends Error {
  readonly code: ResetPasswordErrorCode;

  constructor(code: ResetPasswordErrorCode) {
    super(code);
    this.name = "ResetPasswordError";
    this.code = code;
  }
}

export async function resetSingleUserPassword(
  prisma: PrismaClient,
  accountEmail: string,
  newPassword: string,
  now = new Date(),
): Promise<{ revokedSessionCount: number; clearedThrottleCount: number }> {
  if (
    newPassword.length < MINIMUM_PASSWORD_LENGTH ||
    newPassword.length > 1024
  ) {
    throw new ResetPasswordError("NEW_PASSWORD_INVALID");
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, passwordHash: true },
    take: 2,
  });

  if (users.length !== 1) {
    throw new ResetPasswordError("SINGLE_USER_NOT_CONFIGURED");
  }

  const [user] = users;
  if (user.email !== accountEmail.trim().toLowerCase()) {
    throw new ResetPasswordError("ACCOUNT_MISMATCH");
  }

  if (await verifyPassword(user.passwordHash, newPassword)) {
    throw new ResetPasswordError("PASSWORD_UNCHANGED");
  }

  const passwordHash = await hashPassword(newPassword);

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.user.updateMany({
      where: { id: user.id, passwordHash: user.passwordHash },
      data: { passwordHash },
    });

    if (updated.count !== 1) {
      throw new ResetPasswordError("PASSWORD_RESET_CONFLICT");
    }

    const [revoked, clearedThrottles] = await Promise.all([
      transaction.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now },
      }),
      transaction.authThrottle.deleteMany(),
    ]);

    return {
      revokedSessionCount: revoked.count,
      clearedThrottleCount: clearedThrottles.count,
    };
  });
}
