"use server";

import { headers } from "next/headers";

import { requestPasswordReset } from "@/lib/auth/password-reset-service";
import { passwordResetRequestSchema } from "@/lib/auth/validation";
import { logger } from "@/lib/logging/logger";
import { assertTrustedRequestOrigin } from "@/lib/security/origin";
import { getRequestSource } from "@/lib/security/request-source";

export type ForgotPasswordActionState = Readonly<{
  status: "idle" | "success" | "error";
  message: string;
}>;

export async function forgotPasswordAction(
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Vul een geldig e-mailadres in.",
    };
  }

  try {
    const requestHeaders = await headers();
    assertTrustedRequestOrigin(requestHeaders);
    const origin = requestHeaders.get("origin");
    if (!origin) {
      throw new Error("MISSING_PASSWORD_RESET_ORIGIN");
    }

    await requestPasswordReset({
      email: parsed.data.email,
      requestSource: getRequestSource(requestHeaders),
      origin: new URL(origin).origin,
    });
  } catch {
    logger.error({
      code: "AUTH_PASSWORD_RESET_REQUEST_UNAVAILABLE",
      route: "/wachtwoord-vergeten",
      status: "error",
    });
  }

  return {
    status: "success",
    message:
      "Als dit e-mailadres bij MijnPlanning bekend is, ontvang je een herstelmail.",
  };
}
