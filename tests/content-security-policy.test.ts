import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy } from "../next.config";

describe("Content Security Policy", () => {
  it("staat React debugging uitsluitend in development toe", () => {
    expect(createContentSecurityPolicy(false)).toContain("'unsafe-eval'");
    expect(createContentSecurityPolicy(true)).not.toContain("'unsafe-eval'");
  });

  it("staat directe private uploads uitsluitend naar Vercel Blob toe", () => {
    const policy = createContentSecurityPolicy(true);

    expect(policy).toContain("connect-src 'self' https://*.blob.vercel-storage.com");
    expect(policy).not.toContain("connect-src *");
  });
});
