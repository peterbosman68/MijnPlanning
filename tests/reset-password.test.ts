import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  ResetPasswordError,
  resetSingleUserPassword,
} from "@/lib/auth/reset-password";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

function createPrismaMock(passwordHash: string) {
  let storedPasswordHash = passwordHash;
  const revokeSessions = vi.fn(async () => ({ count: 3 }));
  const clearThrottles = vi.fn(async () => ({ count: 2 }));
  const updatePassword = vi.fn(
    async (input: {
      where: { id: string; passwordHash: string };
      data: { passwordHash: string };
    }) => {
      if (
        input.where.id !== "user-1" ||
        input.where.passwordHash !== storedPasswordHash
      ) {
        return { count: 0 };
      }
      storedPasswordHash = input.data.passwordHash;
      return { count: 1 };
    },
  );
  const transaction = {
    user: { updateMany: updatePassword },
    session: { updateMany: revokeSessions },
    authThrottle: { deleteMany: clearThrottles },
  };
  const prisma = {
    user: {
      findMany: vi.fn(async () => [
        {
          id: "user-1",
          email: "peter@example.com",
          passwordHash: storedPasswordHash,
        },
      ]),
    },
    $transaction: vi.fn(
      async (operation: (client: typeof transaction) => Promise<unknown>) =>
        operation(transaction),
    ),
  } as unknown as PrismaClient;

  return {
    prisma,
    revokeSessions,
    clearThrottles,
    readStoredPasswordHash: () => storedPasswordHash,
  };
}

describe("lokaal wachtwoordnoodherstel", () => {
  it("vereist het exacte single-user-e-mailadres", async () => {
    const currentHash = await hashPassword("huidig-wachtwoord");
    const { prisma } = createPrismaMock(currentHash);

    await expect(
      resetSingleUserPassword(prisma, "ander@example.com", "nieuw-123"),
    ).rejects.toBeInstanceOf(ResetPasswordError);
    await expect(
      resetSingleUserPassword(prisma, "ander@example.com", "nieuw-123"),
    ).rejects.toMatchObject({ code: "ACCOUNT_MISMATCH" });
  });

  it("weigert een te kort of ongewijzigd wachtwoord", async () => {
    const currentHash = await hashPassword("huidig-wachtwoord");
    const { prisma } = createPrismaMock(currentHash);

    await expect(
      resetSingleUserPassword(prisma, "peter@example.com", "kort"),
    ).rejects.toMatchObject({ code: "NEW_PASSWORD_INVALID" });
    await expect(
      resetSingleUserPassword(
        prisma,
        "peter@example.com",
        "huidig-wachtwoord",
      ),
    ).rejects.toMatchObject({ code: "PASSWORD_UNCHANGED" });
  });

  it("vervangt de hash, trekt sessies in en wist loginblokkades", async () => {
    const currentHash = await hashPassword("huidig-wachtwoord");
    const {
      prisma,
      revokeSessions,
      clearThrottles,
      readStoredPasswordHash,
    } = createPrismaMock(currentHash);
    const changedAt = new Date("2026-07-20T13:00:00.000Z");

    await expect(
      resetSingleUserPassword(
        prisma,
        "  PETER@EXAMPLE.COM ",
        "nieuw-123",
        changedAt,
      ),
    ).resolves.toEqual({ revokedSessionCount: 3, clearedThrottleCount: 2 });

    expect(revokeSessions).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: { revokedAt: changedAt },
    });
    expect(clearThrottles).toHaveBeenCalledWith();
    await expect(
      verifyPassword(readStoredPasswordHash(), "nieuw-123"),
    ).resolves.toBe(true);
  });
});
