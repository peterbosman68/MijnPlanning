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

export function deleteAttachmentRecord(database: DatabaseClient, userId: string, attachmentId: string) {
  return database.taskAttachment.deleteMany({
    where: { id: attachmentId, userId },
  });
}
