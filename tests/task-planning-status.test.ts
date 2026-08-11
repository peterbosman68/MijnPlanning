import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findTaskForUser: vi.fn(),
  listSubtasksForTask: vi.fn(),
  lockTaskUserScope: vi.fn(),
  updateTaskRecord: vi.fn(),
}));

const transaction = {};

vi.mock("@/lib/attachments/blob-storage", () => ({
  deletePrivateAttachment: vi.fn(),
}));

vi.mock("@/lib/tasks/repository", () => ({
  createDependencyRecord: vi.fn(),
  createSubtaskRecord: vi.fn(),
  createTaskRecord: vi.fn(),
  deleteDependencyRecord: vi.fn(),
  deleteSubtaskRelatedRecords: vi.fn(),
  deleteSubtaskRecord: vi.fn(),
  deleteTaskRelatedRecords: vi.fn(),
  deleteTaskRecord: vi.fn(),
  findDependencyForUser: vi.fn(),
  findSubtaskForDeletion: vi.fn(),
  findSubtaskForUser: vi.fn(),
  findTaskForDeletion: vi.fn(),
  findTaskForUser: mocks.findTaskForUser,
  listDependenciesForUser: vi.fn(),
  listSubtasksForTask: mocks.listSubtasksForTask,
  listSubtasksForUser: vi.fn(),
  listTasksForUser: vi.fn(),
  lockTaskUserScope: mocks.lockTaskUserScope,
  prismaDatabase: () => ({
    $transaction: (handler: (tx: typeof transaction) => unknown) => handler(transaction),
  }),
  updateSubtaskRecord: vi.fn(),
  updateTaskRecord: mocks.updateTaskRecord,
}));

import { setTaskPlanningStatus } from "@/lib/tasks/service";

const storedTask = {
  id: "task-1",
  title: "Later beoordelen",
  descriptionOriginal: "",
  descriptionPlain: "",
  deadline: null,
  estimatedMinutes: 60,
  remainingMinutes: 60,
  sourceType: "MANUAL",
  sourceExternalId: null,
  completedAt: null,
};

describe("taak verplaatsen tussen planning en Taken Mogelijk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lockTaskUserScope.mockResolvedValue(0);
    mocks.findTaskForUser.mockResolvedValue(storedTask);
    mocks.listSubtasksForTask.mockResolvedValue([]);
    mocks.updateTaskRecord.mockResolvedValue({ count: 1 });
  });

  it("verplaatst alleen de eigen taak naar Taken Mogelijk", async () => {
    await expect(setTaskPlanningStatus("user-1", "task-1", "WAITING")).resolves.toEqual({
      taskId: "task-1",
      status: "WAITING",
    });

    expect(mocks.findTaskForUser).toHaveBeenCalledWith(transaction, "user-1", "task-1");
    expect(mocks.updateTaskRecord).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({ taskId: "task-1", userId: "user-1", status: "WAITING" }),
    );
  });

  it("zet een mogelijke taak terug in de planning", async () => {
    await expect(setTaskPlanningStatus("user-1", "task-1", "OPEN")).resolves.toMatchObject({ status: "OPEN" });
    expect(mocks.updateTaskRecord).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({ userId: "user-1", status: "OPEN" }),
    );
  });
});
