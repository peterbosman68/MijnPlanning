import { z } from "zod";

export const passwordResetEmailEnvSchema = z.object({
  RESEND_API_KEY: z.string().trim().startsWith("re_").min(10).max(512),
  PASSWORD_RESET_EMAIL_FROM: z.string().trim().min(3).max(320),
});

export type PasswordResetEmailEnv = z.infer<typeof passwordResetEmailEnvSchema>;

export function parsePasswordResetEmailEnv(
  input: Record<string, string | undefined>,
): PasswordResetEmailEnv {
  return passwordResetEmailEnvSchema.parse(input);
}

export function getPasswordResetEmailEnv(): PasswordResetEmailEnv {
  return parsePasswordResetEmailEnv(process.env);
}
