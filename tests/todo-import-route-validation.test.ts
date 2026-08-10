import { describe, expect, it } from "vitest";

import { executeTodoImportPayloadSchema } from "@/app/api/todo/import/execute/route";

describe("To Do-importselectie-validatie", () => {
  it("accepteert alleen een bevestigde, niet-lege en unieke selectie", () => {
    expect(executeTodoImportPayloadSchema.safeParse({
      confirmOneTimeImport: true,
      selectedSourceExternalIds: ["todo:list-1:task-1"],
    }).success).toBe(true);

    expect(executeTodoImportPayloadSchema.safeParse({
      confirmOneTimeImport: true,
      selectedSourceExternalIds: [],
    }).success).toBe(false);

    expect(executeTodoImportPayloadSchema.safeParse({
      confirmOneTimeImport: true,
      selectedSourceExternalIds: ["todo:list-1:task-1", "todo:list-1:task-1"],
    }).success).toBe(false);

    expect(executeTodoImportPayloadSchema.safeParse({
      confirmOneTimeImport: false,
      selectedSourceExternalIds: ["todo:list-1:task-1"],
    }).success).toBe(false);
  });
});