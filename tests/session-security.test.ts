import { describe, expect, it } from "vitest";

import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/auth/cookie-options";
import { createSessionToken, hashOpaqueValue } from "@/lib/auth/session-token";

describe("sessiebeveiliging", () => {
  it("maakt sterke opaque tokens en bewaart alleen een deterministische hash", () => {
    const first = createSessionToken();
    const second = createSessionToken();
    const hash = hashOpaqueValue(first, "test-secret-met-minimaal-32-tekens");

    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(first).not.toBe(second);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(first);
  });

  it("gebruikt veilige cookieflags en een __Host-cookie in productie", () => {
    const expiresAt = new Date("2026-08-19T10:00:00.000Z");

    expect(getSessionCookieName(true)).toBe("__Host-mijnplanning_session");
    expect(getSessionCookieOptions(expiresAt, true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
    });
    expect(getSessionCookieOptions(expiresAt, false).secure).toBe(false);
  });
});
