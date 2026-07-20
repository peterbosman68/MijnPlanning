import { describe, expect, it } from "vitest";

import { calculateNextThrottleState } from "@/lib/security/rate-limit";

describe("login-rate-limitbeleid", () => {
  const now = new Date("2026-07-20T10:00:00.000Z");

  it("blokkeert na de vijfde mislukte poging", () => {
    const state = calculateNextThrottleState(
      {
        failureCount: 4,
        windowStartedAt: new Date("2026-07-20T09:55:00.000Z"),
      },
      now,
    );

    expect(state.failureCount).toBe(5);
    expect(state.blockedUntil?.toISOString()).toBe("2026-07-20T10:15:00.000Z");
  });

  it("begint na het tijdvenster opnieuw bij één", () => {
    const state = calculateNextThrottleState(
      {
        failureCount: 4,
        windowStartedAt: new Date("2026-07-20T09:44:59.999Z"),
      },
      now,
    );

    expect(state.failureCount).toBe(1);
    expect(state.blockedUntil).toBeNull();
    expect(state.windowStartedAt).toBe(now);
  });
});
