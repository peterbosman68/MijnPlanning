import { describe, expect, it } from "vitest";

import {
  createPasswordResetToken,
  hashPasswordResetToken,
} from "@/lib/auth/password-reset-token";

describe("wachtwoordresettokens", () => {
  it("maakt willekeurige tokens en bewaart een contextgescheiden hash", () => {
    const first = createPasswordResetToken();
    const second = createPasswordResetToken();
    const secret = "test-secret-met-minimaal-32-tekens";

    expect(first).toHaveLength(43);
    expect(second).toHaveLength(43);
    expect(first).not.toBe(second);
    expect(hashPasswordResetToken(first, secret)).toHaveLength(64);
    expect(hashPasswordResetToken(first, secret)).not.toContain(first);
    expect(hashPasswordResetToken(first, secret)).not.toBe(
      hashPasswordResetToken(second, secret),
    );
  });
});
