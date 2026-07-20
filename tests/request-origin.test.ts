import { describe, expect, it } from "vitest";

import {
  assertTrustedRequestOrigin,
  InvalidRequestOriginError,
} from "@/lib/security/origin";

describe("Origin-validatie", () => {
  it("accepteert een gelijk origin en host", () => {
    const headers = new Headers({
      origin: "https://mijnplanning.example",
      host: "mijnplanning.example",
    });

    expect(() => assertTrustedRequestOrigin(headers)).not.toThrow();
  });

  it("weigert een ontbrekend of afwijkend origin", () => {
    expect(() =>
      assertTrustedRequestOrigin(new Headers({ host: "mijnplanning.example" })),
    ).toThrow(InvalidRequestOriginError);
    expect(() =>
      assertTrustedRequestOrigin(
        new Headers({
          origin: "https://aanvaller.example",
          host: "mijnplanning.example",
        }),
      ),
    ).toThrow(InvalidRequestOriginError);
  });
});
