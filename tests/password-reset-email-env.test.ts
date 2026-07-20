import { describe, expect, it } from "vitest";

import { parsePasswordResetEmailEnv } from "@/lib/config/password-reset-email-env";

describe("Resend-configuratie voor wachtwoordherstel", () => {
  it("accepteert alleen een Resend-key en een expliciete afzender", () => {
    expect(
      parsePasswordResetEmailEnv({
        RESEND_API_KEY: "re_uitsluitend_een_testwaarde",
        PASSWORD_RESET_EMAIL_FROM: "MijnPlanning <onboarding@resend.dev>",
      }),
    ).toEqual({
      RESEND_API_KEY: "re_uitsluitend_een_testwaarde",
      PASSWORD_RESET_EMAIL_FROM: "MijnPlanning <onboarding@resend.dev>",
    });

    expect(() =>
      parsePasswordResetEmailEnv({
        RESEND_API_KEY: "ongeldig",
        PASSWORD_RESET_EMAIL_FROM: "",
      }),
    ).toThrow();
  });
});
