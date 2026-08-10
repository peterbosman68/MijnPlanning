import "server-only";

import type { Prisma, TaskStatus } from "@prisma/client";

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
};

type GraphPagedResponse<TItem> = {
  value?: TItem[];
  "@odata.nextLink"?: string;
};

export type TodoImportCandidate = Readonly<{
  sourceExternalId: string;
  title: string;
  descriptionOriginal: string;
  descriptionPlain: string;
  deadline: Date | null;
  status: TaskStatus;
}>;

export type TodoImportPreview = Readonly<{
  listsCount: number;
  tasksCount: number;
  importableCount: number;
  sampleTitles: string[];
}>;

export type TodoImportResult = Readonly<{
  listsCount: number;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
  deletedExistingTasksCount: number;
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

function mapDeadline(dueDateTime: GraphTodoTask["dueDateTime"]): Date | null {
  const iso = dueDateTime?.dateTime;
  if (!iso) return null;

  const parsed = new Date(iso);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
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
    const text = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new MicrosoftTodoConfigError(
        "To Do-toegang ontbreekt. Koppel Outlook opnieuw zodat Tasks.Read wordt toegekend.",
      );
    }
    throw new MicrosoftTodoRequestError(`To Do-verzoek mislukt (${response.status}) op ${url}: ${text}`);
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

  return result;
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
      `${GRAPH_BASE}/me/todo/lists/${encodeURIComponent(list.id)}/tasks`,
      accessToken,
    );

    for (const task of tasks) {
      if (!task.id) continue;
      const title = task.title?.trim() || "(Zonder titel)";
      const descriptionOriginal = task.body?.content ?? "";
      const sourceExternalId = `todo:${list.id}:${task.id}`;

      candidates.push({
        sourceExternalId,
        title,
        descriptionOriginal,
        descriptionPlain: normalizeDescription(descriptionOriginal),
        deadline: mapDeadline(task.dueDateTime),
        status: mapStatus(task.status),
      });
    }
  }

  return { lists, candidates };
}

export async function previewTodoImport(userId: string): Promise<TodoImportPreview> {
  const { lists, candidates } = await fetchTodoListsAndTasks(userId);

  return {
    listsCount: lists.length,
    tasksCount: candidates.length,
    importableCount: candidates.length,
    sampleTitles: candidates.slice(0, 10).map((item) => item.title),
  };
}

export async function executeTodoImport(userId: string, replaceExistingTasks: boolean): Promise<TodoImportResult> {
  const { lists, candidates } = await fetchTodoListsAndTasks(userId);

  let importedCount = 0;
  let skippedCount = 0;
  let deletedExistingTasksCount = 0;

  await prisma.$transaction(async (tx) => {
    if (replaceExistingTasks) {
      const deleted = await tx.task.deleteMany({ where: { userId } });
      deletedExistingTasksCount = deleted.count;
    }

    const existing = await tx.task.findMany({
      where: { userId, sourceExternalId: { in: candidates.map((candidate) => candidate.sourceExternalId) } },
      select: { sourceExternalId: true },
    });

    const existingIds = new Set(existing.map((item) => item.sourceExternalId).filter((id): id is string => Boolean(id)));

    const createData: Prisma.TaskCreateManyInput[] = [];

    for (const candidate of candidates) {
      if (existingIds.has(candidate.sourceExternalId)) {
        skippedCount += 1;
        continue;
      }

      createData.push({
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
      });
    }

    if (createData.length > 0) {
      const created = await tx.task.createMany({ data: createData });
      importedCount = created.count;
    }
  });

  return {
    listsCount: lists.length,
    fetchedCount: candidates.length,
    importedCount,
    skippedCount,
    deletedExistingTasksCount,
  };
}

export { MicrosoftTodoConfigError, MicrosoftTodoRequestError };
