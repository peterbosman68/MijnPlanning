import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy } from "../next.config";

describe("Content Security Policy", () => {
  it("staat React debugging uitsluitend in development toe", () => {
    expect(createContentSecurityPolicy(false)).toContain("'unsafe-eval'");
    expect(createContentSecurityPolicy(true)).not.toContain("'unsafe-eval'");
  });
});
