import { z } from "zod";

import { MINIMUM_PASSWORD_LENGTH } from "./constants";

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export const loginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320)
    .email()
    .transform(normalizeEmail),
  password: z.string().min(1).max(1024),
});

export const bootstrapUserSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320)
    .email()
    .transform(normalizeEmail),
  password: z.string().min(MINIMUM_PASSWORD_LENGTH).max(1024),
});

export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320)
    .email()
    .transform(normalizeEmail),
});

export const completePasswordResetSchema = z
  .object({
    token: z.string().min(32).max(512),
    newPassword: z.string().min(MINIMUM_PASSWORD_LENGTH).max(1024),
    confirmPassword: z.string().min(MINIMUM_PASSWORD_LENGTH).max(1024),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: "PASSWORD_CONFIRMATION_MISMATCH",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginInputSchema>;
