"use server";

import { headers } from "next/headers";

import { completePasswordReset } from "@/lib/auth/password-reset-service";
import { completePasswordResetSchema } from "@/lib/auth/validation";
import { logger } from "@/lib/logging/logger";
import { assertTrustedRequestOrigin } from "@/lib/security/origin";
import { getRequestSource } from "@/lib/security/request-source";

export type ResetPasswordActionState = Readonly<{
  status: "idle" | "success" | "error";
  message: string;
}>;

export async function resetPasswordAction(
  _previousState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const parsed = completePasswordResetSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const confirmationMismatch = parsed.error.issues.some(
      (issue) => issue.message === "PASSWORD_CONFIRMATION_MISMATCH",
    );
    return {
      status: "error",
      message: confirmationMismatch
        ? "De twee wachtwoorden zijn niet gelijk."
        : "Gebruik een wachtwoord van minimaal 8 tekens.",
    };
  }

  try {
    const requestHeaders = await headers();
    assertTrustedRequestOrigin(requestHeaders);
    const result = await completePasswordReset({
      token: parsed.data.token,
      newPassword: parsed.data.newPassword,
      requestSource: getRequestSource(requestHeaders),
    });

    if (result === "SUCCESS") {
      return {
        status: "success",
        message:
          "Je wachtwoord is gewijzigd. Alle bestaande sessies zijn uitgelogd.",
      };
    }

    if (result === "PASSWORD_UNCHANGED") {
      return {
        status: "error",
        message: "Kies een ander wachtwoord dan je huidige wachtwoord.",
      };
    }

    if (result === "PASSWORD_INVALID") {
      return {
        status: "error",
        message: "Gebruik een wachtwoord van minimaal 8 tekens.",
      };
    }

    return {
      status: "error",
      message:
        "Deze herstellink is ongeldig of verlopen. Vraag een nieuwe link aan.",
    };
  } catch {
    logger.error({
      code: "AUTH_PASSWORD_RESET_UNAVAILABLE",
      route: "/wachtwoord-herstellen",
      status: "error",
    });
    return {
      status: "error",
      message:
        "Wachtwoordherstel is tijdelijk niet beschikbaar. Probeer het later opnieuw.",
    };
  }
}
