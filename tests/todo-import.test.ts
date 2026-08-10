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
  createTaskAttachment: vi.fn(),
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

  it("behoudt bestaande taken en importeert alleen onbekende To Do-items", async () => {
    const graphResponses = [
      { value: [{ id: "list-1", displayName: "Taken" }] },
      {
        value: [
          { id: "existing", title: "Bestaat al", body: { content: "Oud" } },
          {
            id: "new",
            title: "  Nieuwe taak  ",
            status: "completed",
            body: { content: "Exacte\r\n\r\n* notitie  " },
            dueDateTime: { dateTime: "2026-08-10T17:00:00.0000000", timeZone: "W. Europe Standard Time" },
          },
        ],
      },
      { value: [] },
      { value: [] },
    ];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => graphResponses.shift(),
    })));
    mocks.findMany.mockResolvedValue([{ sourceExternalId: "todo:list-1:existing" }]);

    const result = await executeTodoImport("user-1");

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        sourceExternalId: { in: ["todo:list-1:existing", "todo:list-1:new"] },
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
    expect(result).toEqual({
      batchId: "batch-1",
      listsCount: 1,
      fetchedCount: 2,
      importedCount: 1,
      skippedCount: 1,
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
        skippedCount: 1,
      }),
    });
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

  it("lijst To Do-bijlagen apart en haalt ieder bestand afzonderlijk op", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const payload = url.endsWith("/me/todo/lists")
        ? { value: [{ id: "list-1", displayName: "Taken" }] }
        : url.includes("/tasks/task-1/attachments/attachment-1")
          ? {
              id: "attachment-1",
              name: "bewijs.pdf",
              contentType: "application/pdf",
              size: 4,
              contentBytes: "dGVzdA==",
            }
          : url.includes("/tasks/task-1/attachments")
            ? {
                value: [{
                  id: "attachment-1",
                  name: "bewijs.pdf",
                  contentType: "application/pdf",
                  size: 4,
                }],
              }
            : url.includes("/tasks")
              ? {
                  value: [{
                    id: "task-1",
                    title: "Taak met bestand",
                    body: { content: "" },
                  }],
                }
              : { value: [] };

      return { ok: true, json: async () => payload } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    mocks.findMany.mockResolvedValue([]);

    const preview = await previewTodoImport("user-1");

    expect(preview.attachmentCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/tasks/task-1/attachments"),
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/tasks/task-1/attachments/attachment-1"),
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