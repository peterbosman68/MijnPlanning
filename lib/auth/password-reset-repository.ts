import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";

export type PasswordResetCandidate = Readonly<{
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: Readonly<{
    passwordHash: string;
  }>;
}>;

export class PasswordResetConflictError extends Error {
  constructor() {
    super("PASSWORD_RESET_CONFLICT");
    this.name = "PasswordResetConflictError";
  }
}

export const passwordResetRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
  },

  createToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    now: Date;
  }) {
    return prisma.passwordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        createdAt: input.now,
      },
      select: { id: true },
    });
  },

  deleteToken(id: string) {
    return prisma.passwordResetToken.deleteMany({ where: { id } });
  },

  findCandidate(tokenHash: string): Promise<PasswordResetCandidate | null> {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        tokenHash: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { passwordHash: true } },
      },
    });
  },

  async commitReset(
    candidate: PasswordResetCandidate,
    passwordHash: string,
    now: Date,
    retryCount = 0,
  ): Promise<{ revokedSessionCount: number }> {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const claimedToken = await transaction.passwordResetToken.updateMany({
            where: {
              id: candidate.id,
              tokenHash: candidate.tokenHash,
              usedAt: null,
              expiresAt: { gt: now },
            },
            data: { usedAt: now },
          });

          if (claimedToken.count !== 1) {
            throw new PasswordResetConflictError();
          }

          const updatedUser = await transaction.user.updateMany({
            where: {
              id: candidate.userId,
              passwordHash: candidate.user.passwordHash,
            },
            data: { passwordHash },
          });

          if (updatedUser.count !== 1) {
            throw new PasswordResetConflictError();
          }

          const [revokedSessions] = await Promise.all([
            transaction.session.updateMany({
              where: { userId: candidate.userId, revokedAt: null },
              data: { revokedAt: now },
            }),
            transaction.passwordResetToken.updateMany({
              where: { userId: candidate.userId, usedAt: null },
              data: { usedAt: now },
            }),
            transaction.authThrottle.deleteMany(),
          ]);

          return { revokedSessionCount: revokedSessions.count };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";

      if (retryable && retryCount < 2) {
        return this.commitReset(candidate, passwordHash, now, retryCount + 1);
      }

      throw error;
    }
  },
};
