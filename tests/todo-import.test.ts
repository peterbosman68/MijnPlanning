import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  createTask: vi.fn(),
  findMicrosoftToken: vi.fn(),
  createBatch: vi.fn(),
  updateBatch: vi.fn(),
  createImportItem: vi.fn(),
  findImportItems: vi.fn(),
  transaction: vi.fn(),
  getValidAccessToken: vi.fn(),
  createTaskAttachment: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  prisma: {
    task: {
      findMany: mocks.findMany,
    },
    microsoftToken: {
      findUnique: mocks.findMicrosoftToken,
    },
    todoImportBatch: {
      create: mocks.createBatch,
      update: mocks.updateBatch,
    },
    todoImportItem: {
      findMany: mocks.findImportItems,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/attachments/blob-storage", () => ({
  deleteUploadedBlobs: vi.fn(),
  uploadPrivateAttachment: vi.fn(),
}));

vi.mock("@/lib/attachments/service", () => ({
  createTaskAttachment: mocks.createTaskAttachment,
}));

vi.mock("@/lib/microsoft/token-service", () => ({
  getValidAccessToken: mocks.getValidAccessToken,
}));

import { executeTodoImport, mapTodoDeadline, previewTodoImport } from "@/lib/microsoft/todo-import";

describe("eenmalige Microsoft To Do-import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getValidAccessToken.mockResolvedValue("access-token");
    mocks.findMicrosoftToken.mockResolvedValue({ microsoftAccountId: "microsoft-account-1" });
    mocks.createBatch.mockResolvedValue({ id: "batch-1" });
    mocks.updateBatch.mockResolvedValue({ id: "batch-1" });
    mocks.transaction.mockImplementation(async (callback) => callback({
      task: { create: mocks.createTask },
      todoImportItem: { create: mocks.createImportItem },
      todoImportBatch: { update: mocks.updateBatch },
    }));
    mocks.createTask.mockResolvedValue({ id: "created-task" });
    mocks.createImportItem.mockResolvedValue({ id: "item-1" });
    mocks.findImportItems.mockResolvedValue([]);
  });

  it("behoudt bestaande taken en importeert alleen geselecteerde onbekende To Do-items", async () => {
    const graphResponses = [
      {
        value: [
          { id: "list-1", displayName: "Taken", wellknownListName: "defaultList" },
          { id: "groceries", displayName: "Boodschappen", wellknownListName: "none" },
          { id: "flagged", displayName: "Flagged Emails", wellknownListName: "flaggedEmails" },
        ],
      },
      {
        value: [
          { id: "existing", title: "Bestaat al", body: { content: "Oud" } },
          {
            id: "new",
            title: "  Nieuwe taak  ",
            hasAttachments: true,
            status: "completed",
            body: { content: "Exacte\r\n\r\n* notitie  " },
            dueDateTime: { dateTime: "2026-08-10T17:00:00.0000000", timeZone: "W. Europe Standard Time" },
            linkedResources: [{
              id: "link-1",
              displayName: "Bronbestand",
              webUrl: "https://example.com/document",
            }],
          },
          { id: "excluded", title: "Bewust uitgesloten", body: { content: "Niet importeren" } },
        ],
      },
    ];
    const fetchMock = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => graphResponses.shift(),
    }));
    vi.stubGlobal("fetch", fetchMock);
    mocks.findMany.mockResolvedValue([{ sourceExternalId: "todo:list-1:existing" }]);

    const result = await executeTodoImport("user-1", ["todo:list-1:new"]);

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        sourceExternalId: { in: ["todo:list-1:existing", "todo:list-1:new", "todo:list-1:excluded"] },
      },
      select: { sourceExternalId: true },
    });
    expect(mocks.createTask).toHaveBeenCalledTimes(1);
    expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "user-1",
        title: "  Nieuwe taak  ",
        descriptionOriginal: "Exacte\r\n\r\n* notitie  ",
        status: "COMPLETED",
        deadline: new Date("2026-08-10T15:00:00.000Z"),
        sourceExternalId: "todo:list-1:new",
      }),
    }));
    expect(mocks.createTaskAttachment).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: "user-1",
        target: { taskId: "created-task" },
        source: "MICROSOFT_TODO",
        sourceUrl: "https://example.com/document",
        blobPath: null,
      }),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/attachments"),
      expect.any(Object),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/groceries/tasks"),
      expect.any(Object),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/flagged/tasks"),
      expect.any(Object),
    );
    expect(result).toEqual({
      batchId: "batch-1",
      listsCount: 1,
      fetchedCount: 3,
      importedCount: 1,
      skippedCount: 2,
    });
    expect(mocks.createImportItem).toHaveBeenCalledWith({
      data: expect.objectContaining({
        importBatchId: "batch-1",
        externalListId: "list-1",
        externalTaskId: "new",
        targetTaskId: "created-task",
        status: "IMPORTED",
      }),
    });
    expect(mocks.updateBatch).toHaveBeenCalledWith({
      where: { id: "batch-1" },
      data: expect.objectContaining({
        status: "COMPLETED",
        importedCount: 1,
        skippedCount: 2,
      }),
    });
    expect(mocks.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { maxWait: 10_000, timeout: 60_000 },
    );
  });

  it("converteert Microsoft-deadlines veilig naar UTC", () => {
    expect(mapTodoDeadline({ dateTime: "2026-01-10T17:00:00", timeZone: "Europe/Amsterdam" })?.toISOString())
      .toBe("2026-01-10T16:00:00.000Z");
    expect(mapTodoDeadline({ dateTime: "2026-08-10T17:00:00", timeZone: "W. Europe Standard Time" })?.toISOString())
      .toBe("2026-08-10T15:00:00.000Z");
    expect(mapTodoDeadline({ dateTime: "2026-08-10T17:00:00+02:00", timeZone: "UTC" })?.toISOString())
      .toBe("2026-08-10T15:00:00.000Z");
  });

  it("weigert een onbekende tijdzone in plaats van de deadline stil te verschuiven", () => {
    expect(() => mapTodoDeadline({ dateTime: "2026-08-10T17:00:00", timeZone: "Unknown Zone" }))
      .toThrow("Niet-ondersteunde To Do-tijdzone");
  });

  it("weigert een verouderde selectie voordat een importbatch wordt gemaakt", async () => {
    const graphResponses = [
      { value: [{ id: "list-1", displayName: "Taken", wellknownListName: "defaultList" }] },
      { value: [{ id: "current", title: "Actuele taak", body: { content: "" } }] },
    ];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => graphResponses.shift(),
    })));

    await expect(executeTodoImport("user-1", ["todo:list-1:removed"]))
      .rejects.toThrow("selectie is verouderd");
    expect(mocks.createBatch).not.toHaveBeenCalled();
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("importeert taken met documenten zonder de geweigerde attachments-endpoint aan te roepen", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const payload = url.endsWith("/me/todo/lists")
        ? { value: [{ id: "list-1", displayName: "Taken", wellknownListName: "defaultList" }] }
        : url.includes("/tasks")
              ? {
                  value: [{
                    id: "task-1",
                    title: "Taak met bestand",
                    hasAttachments: true,
                    body: { content: "" },
                  }],
                }
              : { value: [] };

      return { ok: true, json: async () => payload } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    mocks.findMany.mockResolvedValue([]);

    const preview = await previewTodoImport("user-1");

    expect(preview.attachmentCount).toBe(0);
    expect(preview.manualFileTaskCount).toBe(1);
    expect(preview.manualFileTaskTitles).toEqual(["Taak met bestand"]);
    expect(preview.importableItems).toEqual([{
      sourceExternalId: "todo:list-1:task-1",
      title: "Taak met bestand",
      listDisplayName: "Taken",
      status: "OPEN",
      requiresManualFileTransfer: true,
    }]);
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/attachments"),
      expect.any(Object),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("hasAttachments"),
      expect.any(Object),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("$select"),
      expect.any(Object),
    );
  });
});