import "server-only";

import { getPasswordResetEmailEnv } from "@/lib/config/password-reset-email-env";

export type PasswordResetEmailInput = Readonly<{
  recipient: string;
  resetUrl: string;
  requestId: string;
  expiresInMinutes: number;
}>;

export type PasswordResetEmailSender = (
  input: PasswordResetEmailInput,
) => Promise<void>;

export class PasswordResetEmailDeliveryError extends Error {
  constructor() {
    super("PASSWORD_RESET_EMAIL_DELIVERY_FAILED");
    this.name = "PasswordResetEmailDeliveryError";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export const sendPasswordResetEmail: PasswordResetEmailSender = async (input) => {
  const env = getPasswordResetEmailEnv();
  const safeResetUrl = escapeHtml(input.resetUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `password-reset/${input.requestId}`,
      "User-Agent": "MijnPlanning/1.0",
    },
    body: JSON.stringify({
      from: env.PASSWORD_RESET_EMAIL_FROM,
      to: [input.recipient],
      subject: "Nieuw wachtwoord instellen voor MijnPlanning",
      text: [
        "Er is gevraagd om een nieuw wachtwoord voor MijnPlanning in te stellen.",
        "",
        `Open deze link binnen ${input.expiresInMinutes} minuten:`,
        input.resetUrl,
        "",
        "Heb je dit niet aangevraagd? Dan hoef je niets te doen.",
      ].join("\n"),
      html: [
        "<p>Er is gevraagd om een nieuw wachtwoord voor MijnPlanning in te stellen.</p>",
        `<p><a href="${safeResetUrl}">Nieuw wachtwoord instellen</a></p>`,
        `<p>Deze link is ${input.expiresInMinutes} minuten geldig en kan één keer worden gebruikt.</p>`,
        "<p>Heb je dit niet aangevraagd? Dan hoef je niets te doen.</p>",
      ].join(""),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new PasswordResetEmailDeliveryError();
  }
};
