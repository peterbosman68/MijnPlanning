import "server-only";

import type { PrismaClient } from "@prisma/client";

import {
  formatAmsterdamDateInput,
  formatAmsterdamDateTimeLabel,
  formatAmsterdamTimeInput,
} from "./domain/date";
import { hasDependencyPath, type DependencyEdge } from "./domain/dependency-graph";
import { TaskDeadlineConflictError, TaskDependencyCycleError, TaskDomainError, TaskNotFoundError } from "./errors";
import type {
  DependencyFormInput,
  SubtaskFormInput,
  SubtaskStatus,
  TaskFormInput,
  TaskSourceType,
  TaskStatus,
} from "./domain/types";
import {
  createDependencyRecord,
  createSubtaskRecord,
  createTaskRecord,
  deleteDependencyRecord,
  findDependencyForUser,
  findSubtaskForUser,
  findTaskForUser,
  listDependenciesForUser,
  listSubtasksForUser,
  listTasksForUser,
  lockTaskUserScope,
  prismaDatabase,
  updateSubtaskRecord,
  updateTaskRecord,
} from "./repository";

type PrismaTx = Parameters<PrismaClient["$transaction"]>[0] extends (
  transaction: infer Transaction,
) => unknown
  ? Transaction
  : never;

type TaskRow = Awaited<ReturnType<typeof listTasksForUser>>[number];
type SubtaskRow = Awaited<ReturnType<typeof listSubtasksForUser>>[number];
type DependencyRow = Awaited<ReturnType<typeof listDependenciesForUser>>[number];

function normalizeDescription(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function formatMinutesLabel(minutes: number | null): string {
  if (minutes === null) {
    return "Nog te schatten";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }

  if (remainder === 0) {
    return `${hours}u`;
  }

  return `${hours}u ${remainder}m`;
}

function statusLabel(status: TaskStatus | SubtaskStatus): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "WAITING":
      return "Wachten";
    case "COMPLETED":
      return "Afgerond";
    case "ARCHIVED":
      return "Gearchiveerd";
    case "CANCELLED":
      return "Geannuleerd";
    default:
      return status;
  }
}

function statusRank(status: TaskStatus | SubtaskStatus): number {
  switch (status) {
    case "OPEN":
      return 0;
    case "WAITING":
      return 1;
    case "COMPLETED":
      return 2;
    case "ARCHIVED":
      return 3;
    case "CANCELLED":
      return 4;
    default:
      return 99;
  }
}

function toDateTimeInputParts(date: Date | null): Readonly<{ date: string; time: string }> {
  if (!date) {
    return { date: "", time: "" };
  }

  return {
    date: formatAmsterdamDateInput(date),
    time: formatAmsterdamTimeInput(date),
  };
}

function toDisplayDateTime(date: Date | null): string | null {
  return date ? formatAmsterdamDateTimeLabel(date) : null;
}

function buildDependencyEdges(dependencies: DependencyRow[]): DependencyEdge[] {
  return dependencies.map((dependency) => ({
    prerequisiteSubtaskId: dependency.dependsOnSubtaskId,
    blockedSubtaskId: dependency.subtaskId,
  }));
}

function getBlockedSubtaskIds(subtasks: SubtaskRow[], dependencies: DependencyRow[]): Set<string> {
  const statusBySubtaskId = new Map(subtasks.map((subtask) => [subtask.id, subtask.status]));
  const blockedSubtaskIds = new Set<string>();

  for (const dependency of dependencies) {
    if ((statusBySubtaskId.get(dependency.dependsOnSubtaskId) ?? "OPEN") !== "COMPLETED") {
      blockedSubtaskIds.add(dependency.subtaskId);
    }
  }

  return blockedSubtaskIds;
}

function taskRemainingMinutes(task: TaskRow, subtasks: SubtaskRow[]): number | null {
  if (subtasks.length === 0) {
    return task.remainingMinutes ?? task.estimatedMinutes ?? null;
  }

  const sum = subtasks.reduce((total, subtask) => {
    if (subtask.status === "COMPLETED" || subtask.status === "ARCHIVED" || subtask.status === "CANCELLED") {
      return total;
    }

    return total + subtask.remainingMinutes;
  }, 0);

  return sum;
}

function recalculateTaskProjectionTx(tx: PrismaTx, taskId: string) {
  return tx.subtask.findMany({
    where: { taskId },
    select: { id: true, remainingMinutes: true, status: true },
  }).then((subtasks) =>
    tx.task.update({
      where: { id: taskId },
      data: {
        remainingMinutes: subtasks.length === 0
          ? null
          : subtasks.reduce((total, subtask) => {
              if (subtask.status === "COMPLETED" || subtask.status === "ARCHIVED" || subtask.status === "CANCELLED") {
                return total;
              }

              return total + subtask.remainingMinutes;
            }, 0),
      },
    }),
  );
}

async function withUserLock<T>(
  userId: string,
  handler: (tx: PrismaTx) => Promise<T>,
): Promise<T> {
  const database = prismaDatabase();

  return database.$transaction(async (tx) => {
    await lockTaskUserScope(tx, userId);
    return handler(tx);
  });
}

function ensureDeadlineWithinTask(taskDeadline: Date | null, subtaskDeadline: Date | null) {
  if (taskDeadline && subtaskDeadline && subtaskDeadline > taskDeadline) {
    throw new TaskDomainError("VALIDATION_ERROR", "DEADLINE_CONFLICT");
  }
}

function ensureNoTaskDeadlineConflicts(taskDeadline: Date | null, subtasks: SubtaskRow[]) {
  if (!taskDeadline) {
    return;
  }

  const conflicts = subtasks.filter((subtask) => subtask.deadline && subtask.deadline > taskDeadline);

  if (conflicts.length > 0) {
    throw new TaskDeadlineConflictError(
      conflicts.map((subtask) => ({
        subtaskId: subtask.id,
        title: subtask.title,
        deadline: toDisplayDateTime(subtask.deadline),
      })),
    );
  }
}

function toTaskBoardTask(task: TaskRow, subtasks: SubtaskRow[], dependencies: DependencyRow[], blockedSubtaskIds: Set<string>) {
  const taskSubtasks = subtasks
    .filter((subtask) => subtask.taskId === task.id)
    .sort((left, right) =>
      statusRank(left.status) - statusRank(right.status)
      || (left.deadline?.getTime() ?? Number.POSITIVE_INFINITY)
        - (right.deadline?.getTime() ?? Number.POSITIVE_INFINITY),
    );

  const remainingMinutes = taskRemainingMinutes(task, taskSubtasks);
  const deadlineParts = toDateTimeInputParts(task.deadline);
  const openSubtaskCount = taskSubtasks.filter((subtask) => subtask.status === "OPEN" || subtask.status === "WAITING").length;
  const blockedSubtaskCount = taskSubtasks.filter((subtask) => blockedSubtaskIds.has(subtask.id)).length;

  return {
    id: task.id,
    title: task.title,
    descriptionOriginal: task.descriptionOriginal,
    descriptionPlain: task.descriptionPlain,
    status: task.status,
    statusLabel: statusLabel(task.status),
    deadline: toDisplayDateTime(task.deadline),
    deadlineDate: deadlineParts.date,
    deadlineTime: deadlineParts.time,
    estimatedMinutes: task.estimatedMinutes,
    remainingMinutes,
    remainingLabel: formatMinutesLabel(remainingMinutes),
    sourceType: task.sourceType,
    sourceExternalId: task.sourceExternalId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    openSubtaskCount,
    blockedSubtaskCount,
    subtasks: taskSubtasks.map((subtask) => {
      const deadlineParts = toDateTimeInputParts(subtask.deadline);
      const dependencyParts = toDateTimeInputParts(subtask.earliestStart);

      return {
        id: subtask.id,
        taskId: subtask.taskId,
        title: subtask.title,
        descriptionOriginal: subtask.descriptionOriginal,
        descriptionPlain: subtask.descriptionPlain,
        status: subtask.status,
        statusLabel: statusLabel(subtask.status),
        deadline: toDisplayDateTime(subtask.deadline),
        deadlineDate: deadlineParts.date,
        deadlineTime: deadlineParts.time,
        earliestStart: toDisplayDateTime(subtask.earliestStart),
        earliestStartDate: dependencyParts.date,
        earliestStartTime: dependencyParts.time,
        estimatedMinutes: subtask.estimatedMinutes,
        remainingMinutes: subtask.remainingMinutes,
        remainingLabel: formatMinutesLabel(subtask.remainingMinutes),
        minimumBlockMinutes: subtask.minimumBlockMinutes,
        splittable: subtask.splittable,
        priority: subtask.priority,
        context: subtask.context,
        completedAt: subtask.completedAt ? subtask.completedAt.toISOString() : null,
        blocked: blockedSubtaskIds.has(subtask.id),
      };
    }),
  };
}

export async function getTaskBoardData(userId: string, selectedTaskId?: string, selectedSubtaskId?: string) {
  const database = prismaDatabase();
  const [tasks, subtasks, dependencies] = await Promise.all([
    listTasksForUser(database, userId),
    listSubtasksForUser(database, userId),
    listDependenciesForUser(database, userId),
  ]);

  const blockedSubtaskIds = getBlockedSubtaskIds(subtasks, dependencies);
  const tasksBoard = tasks.map((task) => toTaskBoardTask(task, subtasks, dependencies, blockedSubtaskIds)).sort(
    (left, right) => statusRank(left.status) - statusRank(right.status) || (left.deadline ? left.deadline.localeCompare(right.deadline ?? left.deadline) : -1),
  );
  const selectedTask = tasksBoard.find((task) => task.id === selectedTaskId) ?? tasksBoard[0] ?? null;
  const selectedSubtask = selectedTask?.subtasks.find((subtask) => subtask.id === selectedSubtaskId) ?? selectedTask?.subtasks[0] ?? null;

  const dependencyOptions = subtasks
    .map((subtask) => ({
      id: subtask.id,
      label: `${subtask.task.title} · ${subtask.title}`,
      taskId: subtask.taskId,
      taskTitle: subtask.task.title,
      blocked: blockedSubtaskIds.has(subtask.id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "nl-NL"));

  const dependencyItems = dependencies.map((dependency) => ({
    id: dependency.id,
    subtaskId: dependency.subtaskId,
    blockedTaskId: dependency.subtask.task.id,
    blockedSubtaskTitle: dependency.subtask.title,
    blockedTaskTitle: dependency.subtask.task.title,
    dependsOnSubtaskId: dependency.dependsOnSubtaskId,
    prerequisiteTaskId: dependency.dependsOnSubtask.task.id,
    prerequisiteSubtaskTitle: dependency.dependsOnSubtask.title,
    prerequisiteTaskTitle: dependency.dependsOnSubtask.task.title,
    dependencyType: dependency.dependencyType,
  }));

  return {
    tasks: tasksBoard,
    selectedTask,
    selectedSubtask,
    dependencies: dependencyItems,
    dependencyOptions,
    taskCount: tasksBoard.length,
    subtaskCount: subtasks.length,
    dependencyCount: dependencies.length,
  };
}

export async function createTask(userId: string, input: TaskFormInput) {
  return withUserLock(userId, async (tx) => {
    const now = new Date();
    const descriptionPlain = normalizeDescription(input.descriptionOriginal);
    const storedStatus: TaskStatus = input.status;
    const completedAt = storedStatus === "COMPLETED" ? now : null;
    const created = await createTaskRecord(tx, {
      userId,
      title: input.title,
      descriptionOriginal: input.descriptionOriginal,
      descriptionPlain,
      deadline: input.deadline,
      estimatedMinutes: input.estimatedMinutes,
      remainingMinutes: input.remainingMinutes ?? input.estimatedMinutes,
      sourceType: "MANUAL" satisfies TaskSourceType,
      sourceExternalId: null,
      status: storedStatus,
      completedAt,
    });

    return { taskId: created.id };
  });
}

export async function updateTask(userId: string, input: TaskFormInput) {
  const taskId = input.taskId;

  if (!taskId) {
    throw new TaskNotFoundError();
  }

  return withUserLock(userId, async (tx) => {
    const current = await findTaskForUser(tx, userId, taskId);

    if (!current) {
      throw new TaskNotFoundError();
    }

    const subtasks = await listSubtasksForUser(tx, userId).then((rows) => rows.filter((row) => row.taskId === current.id));
    ensureNoTaskDeadlineConflicts(input.deadline, subtasks);

    const descriptionPlain = normalizeDescription(input.descriptionOriginal);
    const completedAt = input.status === "COMPLETED" ? current.completedAt ?? new Date() : input.status === "ARCHIVED" ? current.completedAt : null;

    const updatedCount = await updateTaskRecord(tx, {
      taskId: current.id,
      userId,
      title: input.title,
      descriptionOriginal: input.descriptionOriginal,
      descriptionPlain,
      deadline: input.deadline,
      estimatedMinutes: input.estimatedMinutes,
      remainingMinutes: subtasks.length > 0 ? taskRemainingMinutes(current, subtasks) : input.remainingMinutes ?? input.estimatedMinutes,
      sourceType: current.sourceType as TaskSourceType,
      sourceExternalId: current.sourceExternalId,
      status: input.status,
      completedAt,
    });

    if (updatedCount.count === 0) {
      throw new TaskNotFoundError();
    }

    if (subtasks.length > 0) {
      await recalculateTaskProjectionTx(tx, current.id);
    }

    return { taskId: current.id };
  });
}

export async function archiveTask(userId: string, taskId: string) {
  return withUserLock(userId, async (tx) => {
    const current = await findTaskForUser(tx, userId, taskId);

    if (!current) {
      throw new TaskNotFoundError();
    }

    const subtasks = await listSubtasksForUser(tx, userId).then((rows) => rows.filter((row) => row.taskId === current.id));

    const updatedCount = await updateTaskRecord(tx, {
      taskId: current.id,
      userId,
      title: current.title,
      descriptionOriginal: current.descriptionOriginal,
      descriptionPlain: current.descriptionPlain,
      deadline: current.deadline,
      estimatedMinutes: current.estimatedMinutes,
      remainingMinutes: subtasks.length > 0 ? taskRemainingMinutes(current, subtasks) : current.remainingMinutes,
      sourceType: current.sourceType as TaskSourceType,
      sourceExternalId: current.sourceExternalId,
      status: "ARCHIVED",
      completedAt: current.completedAt,
    });

    if (updatedCount.count === 0) {
      throw new TaskNotFoundError();
    }

    if (subtasks.length > 0) {
      await recalculateTaskProjectionTx(tx, current.id);
    }

    return { taskId: current.id };
  });
}

export async function createSubtask(userId: string, input: SubtaskFormInput) {
  return withUserLock(userId, async (tx) => {
    const currentTask = await findTaskForUser(tx, userId, input.taskId);

    if (!currentTask) {
      throw new TaskNotFoundError();
    }

    ensureDeadlineWithinTask(currentTask.deadline, input.deadline);

    const descriptionPlain = normalizeDescription(input.descriptionOriginal);
    const created = await createSubtaskRecord(tx, {
      taskId: currentTask.id,
      title: input.title,
      descriptionOriginal: input.descriptionOriginal,
      descriptionPlain,
      deadline: input.deadline,
      earliestStart: input.earliestStart,
      estimatedMinutes: input.estimatedMinutes,
      remainingMinutes: input.remainingMinutes,
      minimumBlockMinutes: input.minimumBlockMinutes,
      splittable: input.splittable,
      priority: input.priority,
      context: input.context,
      status: input.status,
      completedAt: input.status === "COMPLETED" ? new Date() : null,
    });

    await recalculateTaskProjectionTx(tx, currentTask.id);

    return { taskId: currentTask.id, subtaskId: created.id };
  });
}

export async function updateSubtask(userId: string, input: SubtaskFormInput) {
  const subtaskId = input.subtaskId;

  if (!subtaskId) {
    throw new TaskNotFoundError();
  }

  return withUserLock(userId, async (tx) => {
    const current = await findSubtaskForUser(tx, userId, subtaskId);

    if (!current) {
      throw new TaskNotFoundError();
    }

    ensureDeadlineWithinTask(current.task.deadline, input.deadline);

    const descriptionPlain = normalizeDescription(input.descriptionOriginal);
    const completedAt = input.status === "COMPLETED" ? current.completedAt ?? new Date() : input.status === "ARCHIVED" ? current.completedAt : null;

    const updatedCount = await updateSubtaskRecord(tx, {
      subtaskId: current.id,
      taskId: current.taskId,
      title: input.title,
      descriptionOriginal: input.descriptionOriginal,
      descriptionPlain,
      deadline: input.deadline,
      earliestStart: input.earliestStart,
      estimatedMinutes: input.estimatedMinutes,
      remainingMinutes: input.remainingMinutes,
      minimumBlockMinutes: input.minimumBlockMinutes,
      splittable: input.splittable,
      priority: input.priority,
      context: input.context,
      status: input.status,
      completedAt,
    });

    if (updatedCount.count === 0) {
      throw new TaskNotFoundError();
    }

    await recalculateTaskProjectionTx(tx, current.taskId);

    return { taskId: current.taskId, subtaskId: current.id };
  });
}

export async function archiveSubtask(userId: string, subtaskId: string) {
  const current = await findSubtaskForUser(prismaDatabase(), userId, subtaskId);

  if (!current) {
    throw new TaskNotFoundError();
  }

  return updateSubtask(userId, {
    subtaskId: current.id,
    taskId: current.taskId,
    title: current.title,
    descriptionOriginal: current.descriptionOriginal,
    deadline: current.deadline,
    earliestStart: current.earliestStart,
    estimatedMinutes: current.estimatedMinutes,
    remainingMinutes: current.remainingMinutes,
    minimumBlockMinutes: current.minimumBlockMinutes,
    splittable: current.splittable,
    priority: current.priority,
    context: current.context ?? "",
    status: "ARCHIVED",
  });
}

export async function createDependency(userId: string, input: DependencyFormInput) {
  return withUserLock(userId, async (tx) => {
    const [blockedSubtask, prerequisiteSubtask] = await Promise.all([
      findSubtaskForUser(tx, userId, input.subtaskId),
      findSubtaskForUser(tx, userId, input.dependsOnSubtaskId),
    ]);

    if (!blockedSubtask || !prerequisiteSubtask) {
      throw new TaskNotFoundError();
    }

    if (blockedSubtask.id === prerequisiteSubtask.id) {
      throw new TaskDependencyCycleError({ reason: "SELF_DEPENDENCY" });
    }

    const dependencies = await listDependenciesForUser(tx, userId);
    const edges = buildDependencyEdges(dependencies);

    if (hasDependencyPath(edges, blockedSubtask.id, prerequisiteSubtask.id)) {
      throw new TaskDependencyCycleError({ reason: "CYCLE" });
    }

    const created = await createDependencyRecord(tx, {
      subtaskId: blockedSubtask.id,
      dependsOnSubtaskId: prerequisiteSubtask.id,
      dependencyType: input.dependencyType,
    });

    return { taskId: blockedSubtask.taskId, dependencyId: created.id };
  });
}

export async function removeDependency(userId: string, dependencyId: string) {
  return withUserLock(userId, async (tx) => {
    const current = await findDependencyForUser(tx, userId, dependencyId);

    if (!current) {
      throw new TaskNotFoundError();
    }

    const deleted = await deleteDependencyRecord(tx, current.id, userId);

    if (deleted.count === 0) {
      throw new TaskNotFoundError();
    }

    const subtask = await findSubtaskForUser(tx, userId, current.subtaskId);

    if (!subtask) {
      throw new TaskNotFoundError();
    }

    return { taskId: subtask.taskId };
  });
}
