"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { logger } from "@/lib/logging/logger";
import { assertTrustedRequestOrigin } from "@/lib/security/origin";
import { TaskDeadlineConflictError, TaskDependencyCycleError, TaskDomainError, TaskNotFoundError } from "@/lib/tasks/errors";
import { parseDependencyFormData, parseSubtaskFormData, parseTaskFormData } from "@/lib/tasks/domain/validation";
import {
  archiveSubtask,
  archiveTask,
  createDependency,
  createSubtask,
  createTask,
  removeDependency,
  updateSubtask,
  updateTask,
} from "@/lib/tasks/service";

export type TaskActionState = Readonly<{
  error: string | null;
  conflicts?: Array<Readonly<{ subtaskId: string; title: string; deadline: string | null }>>;
}>;

async function verifyMutationOrigin(): Promise<void> {
  assertTrustedRequestOrigin(await headers());
}

function mapError(error: unknown): TaskActionState {
  if (error instanceof TaskDeadlineConflictError) {
    return {
      error: "De taakdeadline botst met bestaande subtaken.",
      conflicts: Array.isArray(error.details) ? error.details as TaskActionState["conflicts"] : undefined,
    };
  }

  if (error instanceof TaskDependencyCycleError) {
    return { error: "Deze afhankelijkheid maakt een cyclus." };
  }

  if (error instanceof TaskNotFoundError) {
    return { error: "Het geselecteerde item is niet meer beschikbaar." };
  }

  if (error instanceof TaskDomainError) {
    if (error.code === "VALIDATION_ERROR") {
      return { error: "Controleer de ingevulde velden." };
    }

    if (error.code === "DEPENDENCY_NOT_ALLOWED") {
      return { error: "Deze afhankelijkheid is niet toegestaan." };
    }
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "AMSTERDAM_DATETIME_CONVERSION_FAILED":
      case "INVALID_TIME_VALUE":
      case "INVALID_INTEGER_VALUE":
      case "INVALID_POSITIVE_INTEGER_VALUE":
      case "INVALID_NONNEGATIVE_INTEGER_VALUE":
      case "INVALID_ENUM_VALUE":
      case "MISSING_DEADLINE":
      case "INVALID_MINIMUM_BLOCK_MINUTES":
      case "INVALID_PRIORITY":
      case "INVALID_ESTIMATED_MINUTES":
      case "INVALID_REMAINING_MINUTES":
      case "INVALID_SOURCE_TYPE":
        return { error: "Controleer de ingevulde velden." };
      default:
        break;
    }
  }

  return { error: "Opslaan mislukt." };
}

function redirectToTask(taskId: string, subtaskId?: string | null): never {
  if (subtaskId) {
    redirect(`/taken?taskId=${encodeURIComponent(taskId)}&subtaskId=${encodeURIComponent(subtaskId)}`);
  }

  redirect(`/taken?taskId=${encodeURIComponent(taskId)}`);
}

export async function saveTaskAction(_: TaskActionState, formData: FormData): Promise<TaskActionState> {
  await verifyMutationOrigin();
  const session = await requireUser();
  let result: { taskId: string } | null = null;

  try {
    const input = parseTaskFormData(formData);
    result = input.taskId ? await updateTask(session.user.id, input) : await createTask(session.user.id, input);

    revalidatePath("/taken");
    logger.info({ code: input.taskId ? "TASK_UPDATED" : "TASK_CREATED", route: "/taken", status: "ok" });
  } catch (error) {
    logger.error({ code: "TASK_SAVE_FAILED", route: "/taken", status: "error" });
    return mapError(error);
  }

  redirectToTask(result!.taskId);
}

export async function archiveTaskAction(_: TaskActionState, formData: FormData): Promise<TaskActionState> {
  await verifyMutationOrigin();
  const session = await requireUser();
  let result: { taskId: string } | null = null;

  try {
    const taskId = String(formData.get("taskId") ?? "").trim();
    if (!taskId) {
      throw new TaskNotFoundError();
    }

    result = await archiveTask(session.user.id, taskId);

    revalidatePath("/taken");
    logger.info({ code: "TASK_ARCHIVED", route: "/taken", status: "ok" });
  } catch (error) {
    logger.error({ code: "TASK_ARCHIVE_FAILED", route: "/taken", status: "error" });
    return mapError(error);
  }

  redirectToTask(result!.taskId);
}

export async function saveSubtaskAction(_: TaskActionState, formData: FormData): Promise<TaskActionState> {
  await verifyMutationOrigin();
  const session = await requireUser();
  let result: { taskId: string; subtaskId?: string } | null = null;

  try {
    const input = parseSubtaskFormData(formData);
    result = input.subtaskId ? await updateSubtask(session.user.id, input) : await createSubtask(session.user.id, input);

    revalidatePath("/taken");
    logger.info({ code: input.subtaskId ? "SUBTASK_UPDATED" : "SUBTASK_CREATED", route: "/taken", status: "ok" });
  } catch (error) {
    logger.error({ code: "SUBTASK_SAVE_FAILED", route: "/taken", status: "error" });
    return mapError(error);
  }

  redirectToTask(result!.taskId, result!.subtaskId);
}

export async function archiveSubtaskAction(_: TaskActionState, formData: FormData): Promise<TaskActionState> {
  await verifyMutationOrigin();
  const session = await requireUser();
  let result: { taskId: string } | null = null;

  try {
    const subtaskId = String(formData.get("subtaskId") ?? "").trim();
    if (!subtaskId) {
      throw new TaskNotFoundError();
    }

    result = await archiveSubtask(session.user.id, subtaskId);

    revalidatePath("/taken");
    logger.info({ code: "SUBTASK_ARCHIVED", route: "/taken", status: "ok" });
  } catch (error) {
    logger.error({ code: "SUBTASK_ARCHIVE_FAILED", route: "/taken", status: "error" });
    return mapError(error);
  }

  redirectToTask(result!.taskId);
}

export async function saveDependencyAction(_: TaskActionState, formData: FormData): Promise<TaskActionState> {
  await verifyMutationOrigin();
  const session = await requireUser();
  let result: { taskId: string } | null = null;

  try {
    const input = parseDependencyFormData(formData);
    result = await createDependency(session.user.id, input);

    revalidatePath("/taken");
    logger.info({ code: "DEPENDENCY_CREATED", route: "/taken", status: "ok" });
  } catch (error) {
    logger.error({ code: "DEPENDENCY_CREATE_FAILED", route: "/taken", status: "error" });
    return mapError(error);
  }

  redirectToTask(result!.taskId);
}

export async function removeDependencyAction(_: TaskActionState, formData: FormData): Promise<TaskActionState> {
  await verifyMutationOrigin();
  const session = await requireUser();
  let result: { taskId: string } | null = null;

  try {
    const dependencyId = String(formData.get("dependencyId") ?? "").trim();
    if (!dependencyId) {
      throw new TaskNotFoundError();
    }

    result = await removeDependency(session.user.id, dependencyId);

    revalidatePath("/taken");
    logger.info({ code: "DEPENDENCY_REMOVED", route: "/taken", status: "ok" });
  } catch (error) {
    logger.error({ code: "DEPENDENCY_REMOVE_FAILED", route: "/taken", status: "error" });
    return mapError(error);
  }

  redirectToTask(result!.taskId);
}
