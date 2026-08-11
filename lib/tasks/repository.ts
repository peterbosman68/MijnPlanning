import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { SubtaskStatus, TaskStatus } from "@/lib/tasks/domain/types";

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export function lockTaskUserScope(database: DatabaseClient, userId: string) {
  return database.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
}

export function listTasksForUser(database: DatabaseClient, userId: string) {
  return database.task.findMany({
    where: { userId },
    orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      userId: true,
      title: true,
      descriptionOriginal: true,
      descriptionPlain: true,
      status: true,
      deadline: true,
      estimatedMinutes: true,
      remainingMinutes: true,
      sourceType: true,
      sourceExternalId: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
    },
  });
}

export function listSubtasksForUser(database: DatabaseClient, userId: string) {
  return database.subtask.findMany({
    where: { task: { userId } },
    orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      taskId: true,
      title: true,
      descriptionOriginal: true,
      descriptionPlain: true,
      deadline: true,
      earliestStart: true,
      estimatedMinutes: true,
      remainingMinutes: true,
      minimumBlockMinutes: true,
      splittable: true,
      priority: true,
      context: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          deadline: true,
        },
      },
    },
  });
}

export function listSubtasksForTask(database: DatabaseClient, userId: string, taskId: string) {
  return database.subtask.findMany({
    where: { taskId, task: { userId } },
    orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      taskId: true,
      title: true,
      descriptionOriginal: true,
      descriptionPlain: true,
      deadline: true,
      earliestStart: true,
      estimatedMinutes: true,
      remainingMinutes: true,
      minimumBlockMinutes: true,
      splittable: true,
      priority: true,
      context: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          deadline: true,
        },
      },
    },
  });
}

export function listDependenciesForUser(database: DatabaseClient, userId: string) {
  return database.taskDependency.findMany({
    where: {
      subtask: { task: { userId } },
      dependsOnSubtask: { task: { userId } },
    },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      subtaskId: true,
      dependsOnSubtaskId: true,
      dependencyType: true,
      createdAt: true,
      subtask: {
        select: {
          id: true,
          title: true,
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      dependsOnSubtask: {
        select: {
          id: true,
          title: true,
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });
}

export function findTaskForUser(database: DatabaseClient, userId: string, taskId: string) {
  return database.task.findFirst({
    where: { id: taskId, userId },
    select: {
      id: true,
      userId: true,
      title: true,
      descriptionOriginal: true,
      descriptionPlain: true,
      status: true,
      deadline: true,
      estimatedMinutes: true,
      remainingMinutes: true,
      sourceType: true,
      sourceExternalId: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
    },
  });
}

export function findSubtaskForUser(database: DatabaseClient, userId: string, subtaskId: string) {
  return database.subtask.findFirst({
    where: { id: subtaskId, task: { userId } },
    select: {
      id: true,
      taskId: true,
      title: true,
      descriptionOriginal: true,
      descriptionPlain: true,
      deadline: true,
      earliestStart: true,
      estimatedMinutes: true,
      remainingMinutes: true,
      minimumBlockMinutes: true,
      splittable: true,
      priority: true,
      context: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      task: {
        select: {
          id: true,
          userId: true,
          title: true,
          status: true,
          deadline: true,
        },
      },
    },
  });
}

export function findDependencyForUser(database: DatabaseClient, userId: string, dependencyId: string) {
  return database.taskDependency.findFirst({
    where: {
      id: dependencyId,
      subtask: { task: { userId } },
      dependsOnSubtask: { task: { userId } },
    },
    select: {
      id: true,
      subtaskId: true,
      dependsOnSubtaskId: true,
      dependencyType: true,
      createdAt: true,
    },
  });
}

export function createTaskRecord(database: DatabaseClient, input: {
  userId: string;
  title: string;
  descriptionOriginal: string;
  descriptionPlain: string;
  deadline: Date | null;
  estimatedMinutes: number | null;
  remainingMinutes: number | null;
  sourceType: "MANUAL" | "IMPORTED";
  sourceExternalId: string | null;
  status: TaskStatus;
  completedAt: Date | null;
}) {
  return database.task.create({
    data: input,
    select: {
      id: true,
      userId: true,
      title: true,
      descriptionOriginal: true,
      descriptionPlain: true,
      status: true,
      deadline: true,
      estimatedMinutes: true,
      remainingMinutes: true,
      sourceType: true,
      sourceExternalId: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
    },
  });
}

export function updateTaskRecord(database: DatabaseClient, input: {
  taskId: string;
  userId: string;
  title: string;
  descriptionOriginal: string;
  descriptionPlain: string;
  deadline: Date | null;
  estimatedMinutes: number | null;
  remainingMinutes: number | null;
  sourceType: "MANUAL" | "IMPORTED";
  sourceExternalId: string | null;
  status: TaskStatus;
  completedAt: Date | null;
}) {
  return database.task.updateMany({
    where: { id: input.taskId, userId: input.userId },
    data: {
      title: input.title,
      descriptionOriginal: input.descriptionOriginal,
      descriptionPlain: input.descriptionPlain,
      deadline: input.deadline,
      estimatedMinutes: input.estimatedMinutes,
      remainingMinutes: input.remainingMinutes,
      sourceType: input.sourceType,
      sourceExternalId: input.sourceExternalId,
      status: input.status,
      completedAt: input.completedAt,
    },
  });
}

export function createSubtaskRecord(database: DatabaseClient, input: {
  taskId: string;
  title: string;
  descriptionOriginal: string;
  descriptionPlain: string;
  deadline: Date | null;
  earliestStart: Date | null;
  estimatedMinutes: number;
  remainingMinutes: number;
  minimumBlockMinutes: number;
  splittable: boolean;
  priority: number | null;
  context: string;
  status: SubtaskStatus;
  completedAt: Date | null;
}) {
  return database.subtask.create({
    data: input,
    select: {
      id: true,
      taskId: true,
      title: true,
      descriptionOriginal: true,
      descriptionPlain: true,
      deadline: true,
      earliestStart: true,
      estimatedMinutes: true,
      remainingMinutes: true,
      minimumBlockMinutes: true,
      splittable: true,
      priority: true,
      context: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
    },
  });
}

export function updateSubtaskRecord(database: DatabaseClient, input: {
  subtaskId: string;
  taskId: string;
  title: string;
  descriptionOriginal: string;
  descriptionPlain: string;
  deadline: Date | null;
  earliestStart: Date | null;
  estimatedMinutes: number;
  remainingMinutes: number;
  minimumBlockMinutes: number;
  splittable: boolean;
  priority: number | null;
  context: string;
  status: SubtaskStatus;
  completedAt: Date | null;
}) {
  return database.subtask.updateMany({
    where: { id: input.subtaskId, taskId: input.taskId },
    data: {
      title: input.title,
      descriptionOriginal: input.descriptionOriginal,
      descriptionPlain: input.descriptionPlain,
      deadline: input.deadline,
      earliestStart: input.earliestStart,
      estimatedMinutes: input.estimatedMinutes,
      remainingMinutes: input.remainingMinutes,
      minimumBlockMinutes: input.minimumBlockMinutes,
      splittable: input.splittable,
      priority: input.priority,
      context: input.context,
      status: input.status,
      completedAt: input.completedAt,
    },
  });
}

export function createDependencyRecord(database: DatabaseClient, input: {
  subtaskId: string;
  dependsOnSubtaskId: string;
  dependencyType: "FINISH_TO_START";
}) {
  return database.taskDependency.create({
    data: input,
    select: {
      id: true,
      subtaskId: true,
      dependsOnSubtaskId: true,
      dependencyType: true,
      createdAt: true,
    },
  });
}

export function deleteDependencyRecord(database: DatabaseClient, dependencyId: string, userId: string) {
  return database.taskDependency.deleteMany({
    where: {
      id: dependencyId,
      subtask: { task: { userId } },
      dependsOnSubtask: { task: { userId } },
    },
  });
}

export function prismaDatabase(): PrismaClient {
  return prisma;
}
