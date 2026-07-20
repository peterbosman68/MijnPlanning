import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const runDatabaseTests = process.env.MIJNPLANNING_RUN_DB_TESTS === "1";
const describeDatabase = runDatabaseTests ? describe : describe.skip;

function loadDatabaseUrlWithoutLogging(): string {
  const raw = readFileSync(".env", "utf8");
  const match = raw.match(/^\s*DATABASE_URL\s*=\s*["']?([^\r\n"']+)/m);

  if (!match?.[1]) {
    throw new Error("TEST_DATABASE_URL_MISSING");
  }

  return match[1];
}

describeDatabase("authdatabase-integratie", () => {
  it("maakt een login en centrale rate limit controleerbaar zonder data achter te laten", async () => {
    process.env.DATABASE_URL = loadDatabaseUrlWithoutLogging();
    process.env.SESSION_SECRET = "fase-0-integration-test-secret-32-characters";

    const [
      { prisma },
      { hashPassword },
      { authenticate },
      { hashOpaqueValue },
      { revokeAllSessionsForUser, revokeSessionByTokenHash },
    ] = await Promise.all([
        import("@/lib/db/client"),
        import("@/lib/auth/password"),
        import("@/lib/auth/service"),
        import("@/lib/auth/session-token"),
        import("@/lib/auth/repository"),
      ]);
    const email = "phase0.integration@example.invalid";

    const initialCounts = await Promise.all([
      prisma.user.count(),
      prisma.session.count(),
      prisma.authThrottle.count(),
    ]);
    expect(initialCounts).toEqual([0, 0, 0]);

    try {
      await expect(
        prisma.user.create({
          data: {
            email: "Niet.Genormaliseerd@Example.INVALID",
            passwordHash: "geen-echt-wachtwoordhash",
          },
        }),
      ).rejects.toThrow("users_email_normalized");

      await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword("fase-0-sterk-testwachtwoord"),
        },
      });

      const successful = await authenticate(
        { email, password: "fase-0-sterk-testwachtwoord" },
        "integration-success",
      );
      expect(successful.ok).toBe(true);

      if (!successful.ok) {
        throw new Error("EXPECTED_SUCCESSFUL_AUTHENTICATION");
      }

      const storedSession = await prisma.session.findUnique({
        where: {
          tokenHash: hashOpaqueValue(
            successful.token,
            process.env.SESSION_SECRET,
          ),
        },
      });
      expect(storedSession).not.toBeNull();
      expect(storedSession?.tokenHash).not.toContain(successful.token);

      await revokeSessionByTokenHash(storedSession!.tokenHash, new Date());
      expect(
        (await prisma.session.findUnique({ where: { id: storedSession!.id } }))
          ?.revokedAt,
      ).not.toBeNull();

      const secondSession = await authenticate(
        { email, password: "fase-0-sterk-testwachtwoord" },
        "integration-second-session",
      );
      expect(secondSession.ok).toBe(true);
      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      await revokeAllSessionsForUser(user.id, new Date());
      expect(
        await prisma.session.count({
          where: { userId: user.id, revokedAt: null },
        }),
      ).toBe(0);

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const failed = await authenticate(
          { email, password: "bewust-fout-wachtwoord" },
          "integration-rate-limit",
        );
        expect(failed.ok).toBe(false);
      }

      const blocked = await authenticate(
        { email, password: "bewust-fout-wachtwoord" },
        "integration-rate-limit",
      );
      expect(blocked).toMatchObject({ ok: false, reason: "RATE_LIMITED" });
    } finally {
      await prisma.session.deleteMany();
      await prisma.authThrottle.deleteMany();
      await prisma.user.deleteMany({ where: { email } });
      await prisma.$disconnect();
    }
  }, 30_000);
});
