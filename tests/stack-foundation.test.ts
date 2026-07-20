import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

describe("technische projectbasis", () => {
  it("draait op de afgesproken Node.js-major", () => {
    expect(process.versions.node.split(".")[0]).toBe("24");
  });

  it("bevat uitsluitend het fase-0-authdatamodel", () => {
    expect(Prisma.dmmf.datamodel.models.map((model) => model.name).sort()).toEqual([
      "AuthThrottle",
      "Session",
      "User",
    ]);
  });
});
