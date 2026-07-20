import { describe, expect, it } from "vitest";

import {
  getAbsoluteSessionExpiry,
  isSessionUsable,
  shouldTouchSession,
} from "@/lib/auth/session-policy";

describe("sessiebeleid", () => {
  const now = new Date("2026-07-20T10:00:00.000Z");

  it("begrensd een sessie absoluut op dertig dagen", () => {
    expect(getAbsoluteSessionExpiry(now).toISOString()).toBe(
      "2026-08-19T10:00:00.000Z",
    );
  });

  it("weigert ingetrokken, absoluut verlopen en zeven dagen inactieve sessies", () => {
    const base = {
      expiresAt: new Date("2026-08-01T10:00:00.000Z"),
      lastUsedAt: new Date("2026-07-20T09:00:00.000Z"),
      revokedAt: null,
    };

    expect(isSessionUsable(base, now)).toBe(true);
    expect(isSessionUsable({ ...base, revokedAt: now }, now)).toBe(false);
    expect(isSessionUsable({ ...base, expiresAt: now }, now)).toBe(false);
    expect(
      isSessionUsable(
        { ...base, lastUsedAt: new Date("2026-07-13T09:59:59.999Z") },
        now,
      ),
    ).toBe(false);
  });

  it("werkt lastUsedAt niet iedere request bij", () => {
    expect(
      shouldTouchSession(new Date("2026-07-20T09:50:00.000Z"), now),
    ).toBe(false);
    expect(
      shouldTouchSession(new Date("2026-07-20T09:45:00.000Z"), now),
    ).toBe(true);
  });
});
