import { createHmac, randomBytes } from "node:crypto";

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueValue(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}
