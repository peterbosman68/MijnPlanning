import { describe, expect, it, vi } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  completePasswordReset,
  requestPasswordReset,
  type CompletePasswordResetDependencies,
  type PasswordResetRequestDependencies,
  type PasswordResetServiceRepository,
} from "@/lib/auth/password-reset-service";
import { hashPasswordResetToken } from "@/lib/auth/password-reset-token";
import type { PasswordResetCandidate } from "@/lib/auth/password-reset-repository";
import type {
  PasswordResetEmailInput,
  PasswordResetEmailSender,
} from "@/lib/email/resend";

function createRepository(
  overrides: Partial<PasswordResetServiceRepository> = {},
): PasswordResetServiceRepository {
  return {
    findUserByEmail: vi.fn(async () => ({
      id: "user-1",
      email: "peter@example.com",
    })),
    createToken: vi.fn(async () => ({ id: "reset-1" })),
    deleteToken: vi.fn(async () => ({ count: 1 })),
    findCandidate: vi.fn(async () => null),
    commitReset: vi.fn(async () => ({ revokedSessionCount: 2 })),
    ...overrides,
  };
}

function requestDependencies(
  repository: PasswordResetServiceRepository,
  sendEmail: PasswordResetEmailSender = vi.fn(
    async (_input: PasswordResetEmailInput) => {
      void _input;
    },
  ),
): PasswordResetRequestDependencies {
  return {
    repository,
    sendEmail,
    consumeRequestLimit: vi.fn(async () => true),
    getSecret: () => "request-test-secret-met-minimaal-32-tekens",
    waitForGenericResponse: vi.fn(async () => undefined),
  };
}

function completeDependencies(
  repository: PasswordResetServiceRepository,
): CompletePasswordResetDependencies {
  return {
    repository,
    consumeTokenAttemptLimit: vi.fn(async () => true),
    getSecret: () => "complete-test-secret-met-minimaal-32-tekens",
  };
}

describe("wachtwoordherstelservice", () => {
  it("maakt voor een bekend account alleen een tokenhash en verstuurt de leesbare token", async () => {
    const repository = createRepository();
    const sendEmail = vi.fn(
      async (_input: PasswordResetEmailInput) => {
        void _input;
      },
    );
    const dependencies = requestDependencies(repository, sendEmail);
    const now = new Date("2026-07-20T12:00:00.000Z");

    await requestPasswordReset(
      {
        email: " PETER@EXAMPLE.COM ",
        requestSource: "test-source",
        origin: "https://mijnplanning.example",
      },
      now,
      dependencies,
    );

    expect(repository.findUserByEmail).toHaveBeenCalledWith("peter@example.com");
    expect(sendEmail).toHaveBeenCalledOnce();
    const email = vi.mocked(sendEmail).mock.calls[0]?.[0];
    if (!email) {
      throw new Error("EXPECTED_PASSWORD_RESET_EMAIL");
    }
    const readableToken = new URL(email.resetUrl).searchParams.get("token");
    expect(readableToken).toHaveLength(43);

    const stored = vi.mocked(repository.createToken).mock.calls[0][0];
    expect(stored.tokenHash).toBe(
      hashPasswordResetToken(readableToken!, dependencies.getSecret()),
    );
    expect(stored.tokenHash).not.toContain(readableToken!);
    expect(email.recipient).toBe("peter@example.com");
    expect(email.expiresInMinutes).toBe(30);
  });

  it("verstuurt niets voor een onbekend account en verwijdert een token na mailfout", async () => {
    const unknownRepository = createRepository({
      findUserByEmail: vi.fn(async () => null),
    });
    const unknownEmail = vi.fn(async () => undefined);
    await requestPasswordReset(
      {
        email: "onbekend@example.com",
        requestSource: "test-source",
        origin: "https://mijnplanning.example",
      },
      new Date(),
      requestDependencies(unknownRepository, unknownEmail),
    );
    expect(unknownEmail).not.toHaveBeenCalled();
    expect(unknownRepository.createToken).not.toHaveBeenCalled();

    const failingRepository = createRepository();
    const failingEmail = vi.fn(async () => {
      throw new Error("providerfout zonder gevoelige inhoud");
    });
    await requestPasswordReset(
      {
        email: "peter@example.com",
        requestSource: "test-source",
        origin: "https://mijnplanning.example",
      },
      new Date(),
      requestDependencies(failingRepository, failingEmail),
    );
    expect(failingRepository.deleteToken).toHaveBeenCalledWith("reset-1");
  });

  it("weigert verlopen, gebruikte en ongewijzigde wachtwoorden", async () => {
    const currentHash = await hashPassword("huidig-wachtwoord");
    const now = new Date("2026-07-20T13:00:00.000Z");
    const candidate: PasswordResetCandidate = {
      id: "reset-1",
      tokenHash: "hash",
      userId: "user-1",
      expiresAt: new Date("2026-07-20T12:59:59.000Z"),
      usedAt: null,
      user: { passwordHash: currentHash },
    };
    const expiredRepository = createRepository({
      findCandidate: vi.fn(async () => candidate),
    });

    await expect(
      completePasswordReset(
        {
          token: "a".repeat(43),
          newPassword: "nieuw-wachtwoord",
          requestSource: "test-source",
        },
        now,
        completeDependencies(expiredRepository),
      ),
    ).resolves.toBe("INVALID_OR_EXPIRED");

    const validRepository = createRepository({
      findCandidate: vi.fn(async () => ({
        ...candidate,
        expiresAt: new Date("2026-07-20T13:30:00.000Z"),
      })),
    });
    await expect(
      completePasswordReset(
        {
          token: "a".repeat(43),
          newPassword: "huidig-wachtwoord",
          requestSource: "test-source",
        },
        now,
        completeDependencies(validRepository),
      ),
    ).resolves.toBe("PASSWORD_UNCHANGED");
    expect(validRepository.commitReset).not.toHaveBeenCalled();
  });

  it("slaat een nieuwe Argon2id-hash transactioneel op", async () => {
    const currentHash = await hashPassword("huidig-wachtwoord");
    const candidate: PasswordResetCandidate = {
      id: "reset-1",
      tokenHash: "hash",
      userId: "user-1",
      expiresAt: new Date("2026-07-20T13:30:00.000Z"),
      usedAt: null,
      user: { passwordHash: currentHash },
    };
    const repository = createRepository({
      findCandidate: vi.fn(async () => candidate),
    });
    const now = new Date("2026-07-20T13:00:00.000Z");

    await expect(
      completePasswordReset(
        {
          token: "b".repeat(43),
          newPassword: "nieuw-wachtwoord",
          requestSource: "test-source",
        },
        now,
        completeDependencies(repository),
      ),
    ).resolves.toBe("SUCCESS");

    expect(repository.commitReset).toHaveBeenCalledOnce();
    const storedHash = vi.mocked(repository.commitReset).mock.calls[0][1];
    expect(storedHash).not.toBe("nieuw-wachtwoord");
    await expect(verifyPassword(storedHash, "nieuw-wachtwoord")).resolves.toBe(
      true,
    );
  });
});
