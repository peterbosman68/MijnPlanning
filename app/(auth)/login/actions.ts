"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authenticate } from "@/lib/auth/service";
import { setSessionCookie } from "@/lib/auth/session";
import { loginInputSchema } from "@/lib/auth/validation";
import { logger } from "@/lib/logging/logger";
import { assertTrustedRequestOrigin } from "@/lib/security/origin";
import { getRequestSource } from "@/lib/security/request-source";

export type LoginActionState = Readonly<{
  message: string;
}>;

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: "E-mailadres of wachtwoord is onjuist." };
  }

  try {
    const requestHeaders = await headers();
    assertTrustedRequestOrigin(requestHeaders);
    const result = await authenticate(
      parsed.data,
      getRequestSource(requestHeaders),
    );

    if (!result.ok) {
      return {
        message:
          result.reason === "RATE_LIMITED"
            ? "Te veel mislukte pogingen. Probeer het later opnieuw."
            : "E-mailadres of wachtwoord is onjuist.",
      };
    }

    await setSessionCookie(result.token, result.expiresAt);
  } catch {
    logger.error({ code: "AUTH_LOGIN_UNAVAILABLE", route: "/login", status: "error" });
    return {
      message: "Inloggen is tijdelijk niet beschikbaar. Probeer het later opnieuw.",
    };
  }

  redirect("/vandaag");
}
