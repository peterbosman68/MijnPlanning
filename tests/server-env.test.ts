import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/config/env-schema";

describe("serveromgevingsvariabelen", () => {
  it("accepteert uitsluitend een PostgreSQL-URL en sterk sessiesecret", () => {
    expect(
      parseServerEnv({
        DATABASE_URL: "postgresql://user:password@example.invalid/database",
        SESSION_SECRET: "een-testsecret-met-minimaal-32-tekens",
      }),
    ).toBeDefined();

    expect(() =>
      parseServerEnv({
        DATABASE_URL: "https://example.invalid",
        SESSION_SECRET: "kort",
      }),
    ).toThrow();
  });
});
