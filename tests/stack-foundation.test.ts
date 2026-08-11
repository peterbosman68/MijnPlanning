import { Prisma } from "@prisma/client";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("technische projectbasis", () => {
  it("draait op de afgesproken Node.js-major", () => {
    expect(process.versions.node.split(".")[0]).toBe("24");
  });

  it("bevat het afgesproken kern-datamodel", () => {
    expect(Prisma.dmmf.datamodel.models.map((model) => model.name).sort()).toEqual([
      "AuthThrottle",
      "MicrosoftToken",
      "PasswordResetToken",
      "Session",
      "Subtask",
      "Task",
      "TaskAttachment",
      "TaskDependency",
      "TimeSession",
      "TodoImportBatch",
      "TodoImportItem",
      "User",
    ]);
  });

  it("exporteert geen runtimewaarden uit het taakactie-module", () => {
    const source = readFileSync(new URL("../app/taken/actions.ts", import.meta.url), "utf8");

    expect(source).toContain('"use server"');
    expect(source).not.toMatch(/export\s+(?:const|let|var|class)\s/);
  });

  it("draait Vercel-functies naast de Neon-database in Frankfurt", () => {
    const config = JSON.parse(
      readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
    ) as { regions?: string[] };

    expect(config.regions).toEqual(["fra1"]);
  });
});
