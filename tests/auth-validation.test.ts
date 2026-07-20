import { describe, expect, it } from "vitest";

import {
  bootstrapUserSchema,
  completePasswordResetSchema,
  loginInputSchema,
  normalizeEmail,
  passwordResetRequestSchema,
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

  it("valideert herstelmail en twee gelijke nieuwe wachtwoorden", () => {
    expect(
      passwordResetRequestSchema.parse({ email: " PETER@EXAMPLE.COM " }),
    ).toEqual({ email: "peter@example.com" });
    expect(
      completePasswordResetSchema.safeParse({
        token: "a".repeat(43),
        newPassword: "nieuw-123",
        confirmPassword: "nieuw-123",
      }).success,
    ).toBe(true);
    expect(
      completePasswordResetSchema.safeParse({
        token: "a".repeat(43),
        newPassword: "nieuw-123",
        confirmPassword: "anders-123",
      }).success,
    ).toBe(false);
  });
});
