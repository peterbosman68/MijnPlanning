import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deletePrivateAttachment: vi.fn(),
  deleteSubtaskRelatedRecords: vi.fn(),
  deleteSubtaskRecord: vi.fn(),
  deleteTaskRelatedRecords: vi.fn(),
  deleteTaskRecord: vi.fn(),
  findSubtaskForDeletion: vi.fn(),
  findTaskForDeletion: vi.fn(),
  lockTaskUserScope: vi.fn(),
  subtaskFindMany: vi.fn(),
  taskUpdate: vi.fn(),
}));

const transaction = {
  subtask: { findMany: mocks.subtaskFindMany },
  task: { update: mocks.taskUpdate },
};

vi.mock("@/lib/attachments/blob-storage", () => ({
  deletePrivateAttachment: mocks.deletePrivateAttachment,
}));

vi.mock("@/lib/tasks/repository", () => ({
  createDependencyRecord: vi.fn(),
  createSubtaskRecord: vi.fn(),
  createTaskRecord: vi.fn(),
  deleteDependencyRecord: vi.fn(),
  deleteSubtaskRelatedRecords: mocks.deleteSubtaskRelatedRecords,
  deleteSubtaskRecord: mocks.deleteSubtaskRecord,
  deleteTaskRelatedRecords: mocks.deleteTaskRelatedRecords,
  deleteTaskRecord: mocks.deleteTaskRecord,
  findDependencyForUser: vi.fn(),
  findSubtaskForDeletion: mocks.findSubtaskForDeletion,
  findSubtaskForUser: vi.fn(),
  findTaskForDeletion: mocks.findTaskForDeletion,
  findTaskForUser: vi.fn(),
  listDependenciesForUser: vi.fn(),
  listSubtasksForTask: vi.fn(),
  listSubtasksForUser: vi.fn(),
  listTasksForUser: vi.fn(),
  lockTaskUserScope: mocks.lockTaskUserScope,
  prismaDatabase: () => ({
    $transaction: (handler: (tx: typeof transaction) => unknown) => handler(transaction),
  }),
  updateSubtaskRecord: vi.fn(),
  updateTaskRecord: vi.fn(),
}));

import { deleteSubtask, deleteTask } from "@/lib/tasks/service";

describe("taken definitief verwijderen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lockTaskUserScope.mockResolvedValue(0);
    mocks.deletePrivateAttachment.mockResolvedValue(undefined);
    mocks.deleteTaskRelatedRecords.mockResolvedValue([]);
    mocks.deleteSubtaskRelatedRecords.mockResolvedValue([]);
    mocks.deleteTaskRecord.mockResolvedValue({ count: 1 });
    mocks.deleteSubtaskRecord.mockResolvedValue({ count: 1 });
    mocks.subtaskFindMany.mockResolvedValue([]);
    mocks.taskUpdate.mockResolvedValue({ id: "task-1" });
  });

  it("verwijdert een schone hoofdtaak binnen de user-scope", async () => {
    mocks.findTaskForDeletion.mockResolvedValue({
      id: "task-1",
      attachments: [],
      subtasks: [],
    });

    await expect(deleteTask("user-1", "task-1")).resolves.toEqual({ taskId: "task-1" });

    expect(mocks.findTaskForDeletion).toHaveBeenCalledWith(transaction, "user-1", "task-1");
    expect(mocks.deleteTaskRelatedRecords).toHaveBeenCalledWith(transaction, "user-1", "task-1");
    expect(mocks.deleteTaskRecord).toHaveBeenCalledWith(transaction, "user-1", "task-1");
  });

  it("verwijdert een hoofdtaak met bijlagen, tijdregistraties en afhankelijkheden", async () => {
    mocks.findTaskForDeletion.mockResolvedValue({
      id: "task-1",
      attachments: [{ blobPath: "manual/task/task-1/document.pdf" }],
      subtasks: [{
        attachments: [{ blobPath: "manual/subtask/subtask-1/image.png" }],
      }],
    });

    await expect(deleteTask("user-1", "task-1")).resolves.toEqual({ taskId: "task-1" });

    expect(mocks.deletePrivateAttachment).toHaveBeenNthCalledWith(1, "manual/task/task-1/document.pdf");
    expect(mocks.deletePrivateAttachment).toHaveBeenNthCalledWith(2, "manual/subtask/subtask-1/image.png");
    expect(mocks.deleteTaskRelatedRecords).toHaveBeenCalledWith(transaction, "user-1", "task-1");
    expect(mocks.deletePrivateAttachment.mock.invocationCallOrder[1]).toBeLessThan(
      mocks.deleteTaskRelatedRecords.mock.invocationCallOrder[0],
    );
    expect(mocks.deleteTaskRelatedRecords.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteTaskRecord.mock.invocationCallOrder[0],
    );
  });

  it("begint niet aan databasecleanup wanneer een private bijlage niet kan worden verwijderd", async () => {
    mocks.findTaskForDeletion.mockResolvedValue({
      id: "task-1",
      attachments: [{ blobPath: "manual/task/task-1/document.pdf" }],
      subtasks: [],
    });
    mocks.deletePrivateAttachment.mockRejectedValue(new Error("Blob niet bereikbaar"));

    await expect(deleteTask("user-1", "task-1")).rejects.toThrow("Blob niet bereikbaar");

    expect(mocks.deleteTaskRelatedRecords).not.toHaveBeenCalled();
    expect(mocks.deleteTaskRecord).not.toHaveBeenCalled();
  });

  it("verwijdert een subtaak met bijlagen, tijdregistraties en afhankelijkheden", async () => {
    mocks.findSubtaskForDeletion.mockResolvedValue({
      id: "subtask-1",
      taskId: "task-1",
      attachments: [{ blobPath: "manual/subtask/subtask-1/image.png" }],
    });

    await expect(deleteSubtask("user-1", "subtask-1")).resolves.toEqual({
      taskId: "task-1",
      subtaskId: "subtask-1",
    });

    expect(mocks.deletePrivateAttachment).toHaveBeenCalledWith("manual/subtask/subtask-1/image.png");
    expect(mocks.deleteSubtaskRelatedRecords).toHaveBeenCalledWith(transaction, "user-1", "subtask-1");
    expect(mocks.deleteSubtaskRecord).toHaveBeenCalledWith(transaction, "user-1", "subtask-1");
  });

  it("verwijdert een schone subtaak en herberekent de hoofdtaakprojectie", async () => {
    mocks.findSubtaskForDeletion.mockResolvedValue({
      id: "subtask-1",
      taskId: "task-1",
      attachments: [],
    });

    await expect(deleteSubtask("user-1", "subtask-1")).resolves.toEqual({
      taskId: "task-1",
      subtaskId: "subtask-1",
    });

    expect(mocks.deleteSubtaskRecord).toHaveBeenCalledWith(transaction, "user-1", "subtask-1");
    expect(mocks.taskUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "task-1" } }));
  });
});
