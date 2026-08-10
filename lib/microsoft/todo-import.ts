import "server-only";

import { createHash } from "node:crypto";

import { Prisma, type TaskStatus } from "@prisma/client";

import { createTaskAttachment } from "@/lib/attachments/service";
import { prisma } from "@/lib/db/client";

import { getValidAccessToken } from "./token-service";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

class MicrosoftTodoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MicrosoftTodoConfigError";
  }
}

class MicrosoftTodoRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MicrosoftTodoRequestError";
  }
}

class MicrosoftTodoImportConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MicrosoftTodoImportConflictError";
  }
}

type GraphTodoList = {
  id?: string;
  displayName?: string;
};

type GraphTodoTask = {
  id?: string;
  title?: string;
  status?: string;
  body?: {
    content?: string;
  };
  dueDateTime?: {
    dateTime?: string;
    timeZone?: string;
  };
  hasAttachments?: boolean;
  linkedResources?: GraphTodoLinkedResource[];
};

type PreparedAttachmentRecord = Readonly<{
  sourceExternalId: string;
  kind: "LINK";
  displayName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  sourceUrl: string | null;
  blobPath: string | null;
}>;

type GraphTodoLinkedResource = {
  id?: string;
  applicationName?: string;
  displayName?: string;
  externalId?: string;
  webUrl?: string;
};

type GraphPagedResponse<TItem> = {
  value?: TItem[];
  "@odata.nextLink"?: string;
};

export type TodoImportCandidate = Readonly<{
  externalListId: string;
  externalTaskId: string;
  listDisplayName: string;
  sourceExternalId: string;
  sourceHash: string;
  title: string;
  descriptionOriginal: string;
  descriptionPlain: string;
  deadline: Date | null;
  status: TaskStatus;
  requiresManualFileTransfer: boolean;
  attachments: TodoImportAttachmentCandidate[];
}>;

export type TodoImportAttachmentCandidate = Readonly<{
  sourceExternalId: string;
  kind: "LINK";
  displayName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  sourceUrl: string | null;
}>;

export type TodoImportPreview = Readonly<{
  listsCount: number;
  tasksCount: number;
  importableCount: number;
  attachmentCount: number;
  linkCount: number;
  manualFileTaskCount: number;
  manualFileTaskTitles: string[];
  importableItems: TodoImportPreviewItem[];
}>;

export type TodoImportPreviewItem = Readonly<{
  sourceExternalId: string;
  title: string;
  listDisplayName: string;
  status: TaskStatus;
  requiresManualFileTransfer: boolean;
}>;

export type TodoImportResult = Readonly<{
  batchId: string;
  listsCount: number;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
}>;

function normalizeDescription(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function mapStatus(status: string | undefined): TaskStatus {
  return status?.toLowerCase() === "completed" ? "COMPLETED" : "OPEN";
}

function hasExplicitOffset(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
}

function amsterdamLocalDateTimeToUtc(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value);
  if (!match) throw new MicrosoftTodoRequestError("To Do-deadline heeft een ongeldig datumformaat.");

  const expected = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let utcMillis = Date.UTC(expected.year, expected.month - 1, expected.day, expected.hour, expected.minute, expected.second);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const parts = formatter.formatToParts(new Date(utcMillis));
    const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
    const actualMillis = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
    const expectedMillis = Date.UTC(expected.year, expected.month - 1, expected.day, expected.hour, expected.minute, expected.second);
    if (actualMillis === expectedMillis) return new Date(utcMillis);
    utcMillis -= actualMillis - expectedMillis;
  }

  throw new MicrosoftTodoRequestError("To Do-deadline kon niet veilig naar Europe/Amsterdam worden omgerekend.");
}

export function mapTodoDeadline(dueDateTime: GraphTodoTask["dueDateTime"]): Date | null {
  const dateTime = dueDateTime?.dateTime;
  if (!dateTime) return null;

  if (hasExplicitOffset(dateTime)) {
    const parsed = new Date(dateTime);
    if (!Number.isFinite(parsed.getTime())) throw new MicrosoftTodoRequestError("To Do-deadline is ongeldig.");
    return parsed;
  }

  const timeZone = dueDateTime.timeZone?.trim();
  if (!timeZone || ["UTC", "Etc/UTC"].includes(timeZone)) {
    const parsed = new Date(`${dateTime}Z`);
    if (!Number.isFinite(parsed.getTime())) throw new MicrosoftTodoRequestError("To Do-deadline is ongeldig.");
    return parsed;
  }

  if (["Europe/Amsterdam", "W. Europe Standard Time"].includes(timeZone)) {
    return amsterdamLocalDateTimeToUtc(dateTime);
  }

  throw new MicrosoftTodoRequestError(`Niet-ondersteunde To Do-tijdzone: ${timeZone}.`);
}

function normalizeDisplayName(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function safeHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function createAttachmentSourceExternalId(
  listId: string,
  taskId: string,
  kind: "FILE" | "LINK",
  value: string | undefined,
  index: number,
) {
  const stableValue = value?.trim() || `item-${index}`;
  return `todo:${listId}:${taskId}:${kind.toLowerCase()}:${stableValue}`;
}

function mapTodoAttachments(listId: string, taskId: string, task: GraphTodoTask): TodoImportAttachmentCandidate[] {
  const linkedResources = Array.isArray(task.linkedResources) ? task.linkedResources : [];

  const linkCandidates = linkedResources.map((linkedResource, index) => ({
    sourceExternalId: createAttachmentSourceExternalId(
      listId,
      taskId,
      "LINK",
      linkedResource.id ?? linkedResource.externalId ?? linkedResource.webUrl ?? linkedResource.displayName,
      index,
    ),
    kind: "LINK" as const,
    displayName: normalizeDisplayName(linkedResource.displayName, `Link ${index + 1}`),
    mimeType: null,
    sizeBytes: null,
    sourceUrl: safeHttpUrl(linkedResource.webUrl),
  }));

  return linkCandidates;
}

function createSourceHash(input: {
  title: string;
  descriptionOriginal: string;
  deadline: Date | null;
  status: TaskStatus;
  requiresManualFileTransfer: boolean;
  attachments: TodoImportAttachmentCandidate[];
}) {
  const attachments = input.attachments.map((attachment) => ({
    sourceExternalId: attachment.sourceExternalId,
    kind: attachment.kind,
    displayName: attachment.displayName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    sourceUrl: attachment.sourceUrl,
  }));

  return createHash("sha256").update(JSON.stringify({ ...input, deadline: input.deadline?.toISOString() ?? null, attachments })).digest("hex");
}

async function graphFetch<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new MicrosoftTodoConfigError(
        "To Do-toegang ontbreekt. Koppel Outlook opnieuw zodat Tasks.Read wordt toegekend.",
      );
    }
    throw new MicrosoftTodoRequestError(`To Do-verzoek mislukt met status ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function fetchPaged<T>(url: string, accessToken: string): Promise<T[]> {
  const result: T[] = [];
  let nextUrl: string | undefined = url;
  let pageCount = 0;

  while (nextUrl && pageCount < 20 && result.length < 5000) {
    const payload: GraphPagedResponse<T> = await graphFetch<GraphPagedResponse<T>>(nextUrl, accessToken);
    if (Array.isArray(payload.value)) {
      result.push(...payload.value);
    }
    nextUrl = payload["@odata.nextLink"];
    pageCount += 1;
  }

  if (nextUrl) {
    throw new MicrosoftTodoRequestError("To Do bevat meer gegevens dan veilig in één import kunnen worden verwerkt.");
  }

  return result;
}

async function getPreviouslyImportedSourceIds(userId: string, candidates: TodoImportCandidate[]) {
  const [existingTasks, existingItems] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        sourceExternalId: { in: candidates.map((candidate) => candidate.sourceExternalId) },
      },
      select: { sourceExternalId: true },
    }),
    prisma.todoImportItem.findMany({
      where: {
        importBatch: { userId },
        OR: candidates.map((candidate) => ({
          externalListId: candidate.externalListId,
          externalTaskId: candidate.externalTaskId,
        })),
      },
      select: { externalListId: true, externalTaskId: true },
    }),
  ]);

  return new Set([
    ...existingTasks.map((item) => item.sourceExternalId).filter((id): id is string => Boolean(id)),
    ...existingItems.map((item) => `todo:${item.externalListId}:${item.externalTaskId}`),
  ]);
}

async function getAccessToken(userId: string) {
  try {
    return await getValidAccessToken(userId);
  } catch {
    throw new MicrosoftTodoConfigError("Outlook/To Do is niet gekoppeld of geconfigureerd.");
  }
}

async function fetchTodoListsAndTasks(userId: string): Promise<Readonly<{ lists: GraphTodoList[]; candidates: TodoImportCandidate[] }>> {
  const accessToken = await getAccessToken(userId);
  const lists = await fetchPaged<GraphTodoList>(`${GRAPH_BASE}/me/todo/lists`, accessToken);

  const candidates: TodoImportCandidate[] = [];

  for (const list of lists) {
    if (!list.id) continue;
    const tasks = await fetchPaged<GraphTodoTask>(
      `${GRAPH_BASE}/me/todo/lists/${encodeURIComponent(list.id)}/tasks?$expand=linkedResources`,
      accessToken,
    );

    for (const task of tasks) {
      if (!task.id) continue;
      const title = task.title ?? "(Zonder titel)";
      const descriptionOriginal = task.body?.content ?? "";
      const sourceExternalId = `todo:${list.id}:${task.id}`;
      const attachments = mapTodoAttachments(list.id, task.id, task);
      const deadline = mapTodoDeadline(task.dueDateTime);
      const status = mapStatus(task.status);
      const requiresManualFileTransfer = task.hasAttachments === true;

      candidates.push({
        externalListId: list.id,
        externalTaskId: task.id,
        listDisplayName: list.displayName ?? "(Zonder lijstnaam)",
        sourceExternalId,
        sourceHash: createSourceHash({ title, descriptionOriginal, deadline, status, requiresManualFileTransfer, attachments }),
        title,
        descriptionOriginal,
        descriptionPlain: normalizeDescription(descriptionOriginal),
        deadline,
        status,
        requiresManualFileTransfer,
        attachments,
      });
    }
  }

  return { lists, candidates };
}

export async function previewTodoImport(userId: string): Promise<TodoImportPreview> {
  const { lists, candidates } = await fetchTodoListsAndTasks(userId);
  const attachments = candidates.flatMap((candidate) => candidate.attachments);
  const existingIds = await getPreviouslyImportedSourceIds(userId, candidates);
  const importableCandidates = candidates.filter((candidate) => !existingIds.has(candidate.sourceExternalId));

  return {
    listsCount: lists.length,
    tasksCount: candidates.length,
    importableCount: importableCandidates.length,
    attachmentCount: 0,
    linkCount: attachments.filter((attachment) => attachment.kind === "LINK").length,
    manualFileTaskCount: candidates.filter((candidate) => candidate.requiresManualFileTransfer).length,
    manualFileTaskTitles: candidates.filter((candidate) => candidate.requiresManualFileTransfer).map((candidate) => candidate.title),
    importableItems: importableCandidates.map((candidate) => ({
      sourceExternalId: candidate.sourceExternalId,
      title: candidate.title,
      listDisplayName: candidate.listDisplayName,
      status: candidate.status,
      requiresManualFileTransfer: candidate.requiresManualFileTransfer,
    })),
  };
}

export async function executeTodoImport(
  userId: string,
  selectedSourceExternalIds: readonly string[],
): Promise<TodoImportResult> {
  const { lists, candidates } = await fetchTodoListsAndTasks(userId);
  const candidateIds = new Set(candidates.map((candidate) => candidate.sourceExternalId));
  const selectedIds = new Set(selectedSourceExternalIds);

  if (selectedSourceExternalIds.some((sourceExternalId) => !candidateIds.has(sourceExternalId))) {
    throw new MicrosoftTodoRequestError("De To Do-selectie is verouderd. Vernieuw de preview en controleer de selectie opnieuw.");
  }

  const microsoftToken = await prisma.microsoftToken.findUnique({
    where: { userId },
    select: { microsoftAccountId: true },
  });
  if (!microsoftToken) throw new MicrosoftTodoConfigError("Microsoft-accountkoppeling ontbreekt.");

  let batch: { id: string };
  try {
    batch = await prisma.todoImportBatch.create({
      data: {
        userId,
        microsoftConnectionId: microsoftToken.microsoftAccountId,
        sourceLists: lists.filter((list): list is GraphTodoList & { id: string } => Boolean(list.id)).map((list) => ({
          id: list.id,
          displayName: list.displayName ?? "(Zonder lijstnaam)",
        })),
        status: "RUNNING",
        startedAt: new Date(),
        sourceCount: candidates.length,
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new MicrosoftTodoImportConflictError("Er wordt al een To Do-import uitgevoerd.");
    }
    throw error;
  }

  let importedCount = 0;
  let skippedCount = 0;

  const existingIds = await getPreviouslyImportedSourceIds(userId, candidates);

  const importCandidates = candidates.filter(
    (candidate) => selectedIds.has(candidate.sourceExternalId) && !existingIds.has(candidate.sourceExternalId),
  );
  skippedCount = candidates.length - importCandidates.length;

  const preparedAttachmentsByTask = new Map<string, PreparedAttachmentRecord[]>();

  try {
    for (const candidate of importCandidates) {
      const preparedForTask: PreparedAttachmentRecord[] = [];

      for (const attachment of candidate.attachments) {
        if (!attachment.sourceUrl) {
          throw new MicrosoftTodoRequestError(`To Do-link zonder veilige URL ontvangen voor taak "${candidate.title}".`);
        }
        preparedForTask.push({
          sourceExternalId: attachment.sourceExternalId,
          kind: attachment.kind,
          displayName: attachment.displayName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          sourceUrl: attachment.sourceUrl,
          blobPath: null,
        });
      }

      preparedAttachmentsByTask.set(candidate.sourceExternalId, preparedForTask);
    }

    await prisma.$transaction(async (tx) => {
      for (const candidate of importCandidates) {
        const createdTask = await tx.task.create({
          data: {
            userId,
            title: candidate.title,
            descriptionOriginal: candidate.descriptionOriginal,
            descriptionPlain: candidate.descriptionPlain,
            status: candidate.status,
            deadline: candidate.deadline,
            estimatedMinutes: null,
            remainingMinutes: null,
            sourceType: "IMPORTED",
            sourceExternalId: candidate.sourceExternalId,
            completedAt: candidate.status === "COMPLETED" ? new Date() : null,
          },
          select: {
            id: true,
          },
        });

        importedCount += 1;

        const preparedAttachments = preparedAttachmentsByTask.get(candidate.sourceExternalId) ?? [];
        for (const attachment of preparedAttachments) {
          await createTaskAttachment(tx, {
            userId,
            target: { taskId: createdTask.id },
            source: "MICROSOFT_TODO",
            blobPath: attachment.blobPath,
            sourceUrl: attachment.sourceUrl,
            originalFileName: attachment.displayName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            sourceExternalId: attachment.sourceExternalId,
          });
        }

        await tx.todoImportItem.create({
          data: {
            importBatchId: batch.id,
            externalListId: candidate.externalListId,
            externalTaskId: candidate.externalTaskId,
            targetTaskId: createdTask.id,
            sourceHash: candidate.sourceHash,
            importedAttachmentCount: preparedAttachments.length,
            status: "IMPORTED",
          },
        });
      }

      await tx.todoImportBatch.update({
        where: { id: batch.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          importedCount,
          skippedCount,
        },
      });
    });
  } catch (error) {
    await prisma.todoImportBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        importedCount: 0,
        skippedCount,
        errorCount: 1,
      },
    }).catch(() => undefined);
    throw error;
  }

  return {
    batchId: batch.id,
    listsCount: lists.length,
    fetchedCount: candidates.length,
    importedCount,
    skippedCount,
  };
}

export { MicrosoftTodoConfigError, MicrosoftTodoImportConflictError, MicrosoftTodoRequestError };
