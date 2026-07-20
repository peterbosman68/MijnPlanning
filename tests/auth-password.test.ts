import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Argon2id-wachtwoorden", () => {
  it("hasht met de vastgelegde Argon2id-baseline en een unieke salt", async () => {
    const first = await hashPassword("een-sterk-testwachtwoord");
    const second = await hashPassword("een-sterk-testwachtwoord");

    expect(first).toContain("$argon2id$");
    expect(first).toContain("m=19456");
    expect(first).toContain("p=1");
    expect(first).toContain("t=2");
    expect(first).not.toBe(second);
  });

  it("accepteert alleen het juiste wachtwoord", async () => {
    const passwordHash = await hashPassword("een-sterk-testwachtwoord");

    await expect(
      verifyPassword(passwordHash, "een-sterk-testwachtwoord"),
    ).resolves.toBe(true);
    await expect(verifyPassword(passwordHash, "een-fout-wachtwoord")).resolves.toBe(
      false,
    );
  });
});
