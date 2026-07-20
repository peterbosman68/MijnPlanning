import { describe, expect, it } from "vitest";

import {
  bootstrapUserSchema,
  loginInputSchema,
  normalizeEmail,
} from "@/lib/auth/validation";

describe("loginvalidatie", () => {
  it("normaliseert het e-mailadres zonder het wachtwoord te veranderen", () => {
    const parsed = loginInputSchema.parse({
      email: "  Peter@Example.COM ",
      password: " Exact wachtwoord ",
    });

    expect(parsed).toEqual({
      email: "peter@example.com",
      password: " Exact wachtwoord ",
    });
    expect(normalizeEmail(" PETER@EXAMPLE.COM ")).toBe("peter@example.com");
  });

  it("accepteert acht tekens en weigert een korter bootstrapwachtwoord", () => {
    expect(
      bootstrapUserSchema.safeParse({
        email: "peter@example.com",
        password: "acht-tek",
      }).success,
    ).toBe(true);
    expect(
      bootstrapUserSchema.safeParse({
        email: "peter@example.com",
        password: "zeven!!",
      }).success,
    ).toBe(false);
  });
});
