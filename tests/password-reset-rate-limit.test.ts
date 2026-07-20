import { describe, expect, it } from "vitest";

import {
  PASSWORD_RESET_REQUEST_TTL_MS,
  PASSWORD_RESET_REQUEST_WINDOW_MS,
} from "@/lib/auth/constants";
import { calculatePasswordResetThrottleState } from "@/lib/security/password-reset-rate-limit";

describe("rate limiting voor wachtwoordherstel", () => {
  const startedAt = new Date("2026-07-20T12:00:00.000Z");

  it("blokkeert vanaf het ingestelde maximum tot het einde van het uurvenster", () => {
    const next = calculatePasswordResetThrottleState(
      { failureCount: 2, windowStartedAt: startedAt },
      3,
      new Date("2026-07-20T12:10:00.000Z"),
    );

    expect(next.failureCount).toBe(3);
    expect(next.windowStartedAt).toEqual(startedAt);
    expect(next.blockedUntil).toEqual(
      new Date(startedAt.getTime() + PASSWORD_RESET_REQUEST_WINDOW_MS),
    );
  });

  it("begint na een verlopen uurvenster opnieuw", () => {
    const now = new Date(startedAt.getTime() + PASSWORD_RESET_REQUEST_WINDOW_MS);
    const next = calculatePasswordResetThrottleState(
      { failureCount: 10, windowStartedAt: startedAt },
      3,
      now,
    );

    expect(next).toEqual({
      failureCount: 1,
      windowStartedAt: now,
      blockedUntil: null,
      expiresAt: new Date(now.getTime() + PASSWORD_RESET_REQUEST_TTL_MS),
    });
  });
});
