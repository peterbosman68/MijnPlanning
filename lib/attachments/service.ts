import "server-only";

import { prisma } from "@/lib/db/client";

import {
  createAttachmentRecord,
  deleteAttachmentRecord,
  findAttachmentForUser,
  listAttachmentsForUser,
  listAttachmentsForSubtask,
  listAttachmentsForTask,
  upsertAttachmentRecord,
  type DatabaseClient,
  type TaskAttachmentSource,
} from "./repository";
import { findSubtaskForUser, findTaskForUser } from "@/lib/tasks/repository";

export type AttachmentTarget = Readonly<{
  taskId?: string;
  subtaskId?: string;
}>;

export type AttachmentInput = Readonly<{
  userId: string;
  target: AttachmentTarget;
  source: TaskAttachmentSource;
  blobPath?: string | null;
  sourceUrl?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  sourceExternalId?: string | null;
}>;

function sanitizeFileName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-");
}

function ensureTarget(target: AttachmentTarget) {
  const hasTask = Boolean(target.taskId);
  const hasSubtask = Boolean(target.subtaskId);

  if (hasTask === hasSubtask) {
    throw new Error("Een bijlage moet precies aan een taak of een subtaak worden gekoppeld.");
  }
}

export async function getAttachmentBoardData(userId: string) {
  const attachments = await listAttachmentsForUser(prisma, userId);

  return attachments.map((attachment) => ({
    id: attachment.id,
    taskId: attachment.taskId,
    subtaskId: attachment.subtaskId,
    name: attachment.originalFileName ?? "Bijlage",
    mimeType: attachment.mimeType ?? "application/octet-stream",
    sizeBytes: attachment.sizeBytes,
    sourceUrl: attachment.sourceUrl,
    hasStoredFile: Boolean(attachment.blobPath),
    source: attachment.source,
  }));
}

export type AttachmentBoardData = Awaited<ReturnType<typeof getAttachmentBoardData>>;

export function listTaskAttachments(database: DatabaseClient, userId: string, taskId: string) {
  return listAttachmentsForTask(database, userId, taskId);
}

export function listSubtaskAttachments(database: DatabaseClient, userId: string, subtaskId: string) {
  return listAttachmentsForSubtask(database, userId, subtaskId);
}

export function createTaskAttachment(database: DatabaseClient, input: AttachmentInput) {
  ensureTarget(input.target);

  return createAttachmentRecord(database, {
    userId: input.userId,
    taskId: input.target.taskId ?? null,
    subtaskId: input.target.subtaskId ?? null,
    blobPath: input.blobPath ?? null,
    sourceUrl: input.sourceUrl ?? null,
    originalFileName: input.originalFileName ? sanitizeFileName(input.originalFileName) : null,
    mimeType: input.mimeType ?? null,
    sizeBytes: input.sizeBytes ?? null,
    sourceExternalId: input.sourceExternalId ?? null,
    source: input.source,
  });
}

export async function authorizeAttachmentTarget(userId: string, target: AttachmentTarget) {
  ensureTarget(target);

  if (target.taskId) {
    if (!await findTaskForUser(prisma, userId, target.taskId)) {
      throw new Error("Hoofdtaak niet gevonden.");
    }
    return;
  }

  if (!await findSubtaskForUser(prisma, userId, target.subtaskId!)) {
    throw new Error("Subtaak niet gevonden.");
  }
}

export function finalizeManualAttachment(database: DatabaseClient, input: {
  userId: string;
  target: AttachmentTarget;
  blobPath: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  ensureTarget(input.target);

  return upsertAttachmentRecord(database, {
    userId: input.userId,
    taskId: input.target.taskId ?? null,
    subtaskId: input.target.subtaskId ?? null,
    blobPath: input.blobPath,
    originalFileName: sanitizeFileName(input.originalFileName),
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    sourceExternalId: input.blobPath,
    source: "MANUAL_UPLOAD",
  });
}

export function getAttachmentForDownload(userId: string, attachmentId: string) {
  return findAttachmentForUser(prisma, userId, attachmentId);
}

export function deleteTaskAttachment(database: DatabaseClient, userId: string, attachmentId: string) {
  return deleteAttachmentRecord(database, userId, attachmentId);
}