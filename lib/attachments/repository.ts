import "server-only";

import type { Prisma, PrismaClient, TaskAttachment as PrismaTaskAttachment } from "@prisma/client";

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export type TaskAttachmentSource =
  | "MANUAL_UPLOAD"
  | "MICROSOFT_TODO"
  | "EMAIL"
  | "SCREENSHOT"
  | "PHOTO";

export type TaskAttachmentRecord = PrismaTaskAttachment;

export function listAttachmentsForUser(database: DatabaseClient, userId: string) {
  return database.taskAttachment.findMany({
    where: { userId },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      taskId: true,
      subtaskId: true,
      blobPath: true,
      sourceUrl: true,
      originalFileName: true,
      mimeType: true,
      sizeBytes: true,
      source: true,
    },
  });
}

export function listAttachmentsForTask(database: DatabaseClient, userId: string, taskId: string) {
  return database.taskAttachment.findMany({
    where: { userId, taskId },
    orderBy: [{ createdAt: "asc" }],
  });
}

export function listAttachmentsForSubtask(database: DatabaseClient, userId: string, subtaskId: string) {
  return database.taskAttachment.findMany({
    where: { userId, subtaskId },
    orderBy: [{ createdAt: "asc" }],
  });
}

export function createAttachmentRecord(
  database: DatabaseClient,
  input: {
    userId: string;
    taskId?: string | null;
    subtaskId?: string | null;
    blobPath?: string | null;
    sourceUrl?: string | null;
    originalFileName?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
    sourceExternalId?: string | null;
    source: TaskAttachmentSource;
  },
) {
  return database.taskAttachment.create({
    data: input,
  });
}

export function upsertAttachmentRecord(
  database: DatabaseClient,
  input: {
    userId: string;
    taskId?: string | null;
    subtaskId?: string | null;
    blobPath: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    sourceExternalId: string;
    source: TaskAttachmentSource;
  },
) {
  return database.taskAttachment.upsert({
    where: {
      userId_sourceExternalId: {
        userId: input.userId,
        sourceExternalId: input.sourceExternalId,
      },
    },
    create: input,
    update: {
      taskId: input.taskId ?? null,
      subtaskId: input.subtaskId ?? null,
      blobPath: input.blobPath,
      sourceUrl: null,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      source: input.source,
    },
  });
}

export function findAttachmentForUser(database: DatabaseClient, userId: string, attachmentId: string) {
  return database.taskAttachment.findFirst({
    where: { id: attachmentId, userId },
  });
}

export function deleteAttachmentRecord(database: DatabaseClient, userId: string, attachmentId: string) {
  return database.taskAttachment.deleteMany({
    where: { id: attachmentId, userId },
  });
}
