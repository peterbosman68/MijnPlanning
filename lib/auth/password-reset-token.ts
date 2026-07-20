import { randomBytes } from "node:crypto";

import { hashOpaqueValue } from "./session-token";

const PASSWORD_RESET_TOKEN_CONTEXT = "password-reset-token";

export function createPasswordResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string, secret: string): string {
  return hashOpaqueValue(`${PASSWORD_RESET_TOKEN_CONTEXT}:${token}`, secret);
}
