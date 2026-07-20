import type { PrismaClient } from "@prisma/client";

import { MINIMUM_PASSWORD_LENGTH } from "./constants.ts";
import { hashPassword, verifyPassword } from "./password.ts";

export type ChangePasswordErrorCode =
  | "CURRENT_PASSWORD_INVALID"
  | "NEW_PASSWORD_INVALID"
  | "PASSWORD_CHANGE_CONFLICT"
  | "SINGLE_USER_NOT_CONFIGURED";

export class ChangePasswordError extends Error {
  readonly code: ChangePasswordErrorCode;

  constructor(code: ChangePasswordErrorCode) {
    super(code);
    this.name = "ChangePasswordError";
    this.code = code;
  }
}

export async function changeSingleUserPassword(
  prisma: PrismaClient,
  currentPassword: string,
  newPassword: string,
  now = new Date(),
): Promise<{ revokedSessionCount: number }> {
  if (
    newPassword.length < MINIMUM_PASSWORD_LENGTH ||
    newPassword.length > 1024
  ) {
    throw new ChangePasswordError("NEW_PASSWORD_INVALID");
  }

  const users = await prisma.user.findMany({
    select: { id: true, passwordHash: true },
    take: 2,
  });

  if (users.length !== 1) {
    throw new ChangePasswordError("SINGLE_USER_NOT_CONFIGURED");
  }

  const [user] = users;
  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    throw new ChangePasswordError("CURRENT_PASSWORD_INVALID");
  }

  const passwordHash = await hashPassword(newPassword);

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.user.updateMany({
      where: { id: user.id, passwordHash: user.passwordHash },
      data: { passwordHash },
    });

    if (updated.count !== 1) {
      throw new ChangePasswordError("PASSWORD_CHANGE_CONFLICT");
    }

    const revoked = await transaction.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: now },
    });

    return { revokedSessionCount: revoked.count };
  });
}
