import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { changeSingleUserPassword } from "@/lib/auth/change-password";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

function createPrismaMock(passwordHash: string) {
  let storedPasswordHash = passwordHash;
  const revokeSessions = vi.fn(async () => ({ count: 2 }));
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
  };
  const prisma = {
    user: {
      findMany: vi.fn(async () => [
        { id: "user-1", passwordHash: storedPasswordHash },
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
    readStoredPasswordHash: () => storedPasswordHash,
  };
}

describe("wachtwoord wijzigen", () => {
  it("weigert een nieuw wachtwoord korter dan acht tekens", async () => {
    const currentHash = await hashPassword("huidig-wachtwoord");
    const { prisma } = createPrismaMock(currentHash);

    await expect(
      changeSingleUserPassword(prisma, "huidig-wachtwoord", "zeven!!"),
    ).rejects.toMatchObject({
      code: "NEW_PASSWORD_INVALID",
    });
  });

  it("controleert het huidige wachtwoord en trekt sessies in", async () => {
    const currentHash = await hashPassword("huidig-wachtwoord");
    const { prisma, readStoredPasswordHash, revokeSessions } =
      createPrismaMock(currentHash);
    const changedAt = new Date("2026-07-20T12:00:00.000Z");

    await expect(
      changeSingleUserPassword(prisma, "verkeerd", "nieuw-123", changedAt),
    ).rejects.toMatchObject({
      code: "CURRENT_PASSWORD_INVALID",
    });

    await expect(
      changeSingleUserPassword(
        prisma,
        "huidig-wachtwoord",
        "nieuw-123",
        changedAt,
      ),
    ).resolves.toEqual({ revokedSessionCount: 2 });

    expect(revokeSessions).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: { revokedAt: changedAt },
    });
    await expect(
      verifyPassword(readStoredPasswordHash(), "nieuw-123"),
    ).resolves.toBe(true);
  });
});
