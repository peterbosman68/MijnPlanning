import { z } from "zod";

import { parseAmsterdamDateTimeInput } from "./date";
import {
  TASK_DEPENDENCY_TYPES,
  TASK_SOURCE_TYPES,
  TASK_STATUSES,
  SUBTASK_STATUSES,
  type DependencyFormInput,
  type SubtaskFormInput,
  type TaskFormInput,
} from "./types";

function rawString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalInteger(value: FormDataEntryValue | null): number | null {
  const raw = rawString(value);

  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isInteger(parsed)) {
    throw new Error("INVALID_INTEGER_VALUE");
  }

  return parsed;
}

function requiredPositiveInteger(value: FormDataEntryValue | null): number {
  const parsed = optionalInteger(value);

  if (parsed === null || parsed <= 0) {
    throw new Error("INVALID_POSITIVE_INTEGER_VALUE");
  }

  return parsed;
}

function requiredNonNegativeInteger(value: FormDataEntryValue | null): number {
  const parsed = optionalInteger(value);

  if (parsed === null || parsed < 0) {
    throw new Error("INVALID_NONNEGATIVE_INTEGER_VALUE");
  }

  return parsed;
}

function optionalEnum<T extends string>(
  values: readonly T[],
  value: FormDataEntryValue | null,
  fallback: T,
): T {
  const raw = rawString(value);

  if (!raw) {
    return fallback;
  }

  if (!values.includes(raw as T)) {
    throw new Error("INVALID_ENUM_VALUE");
  }

  return raw as T;
}

export function parseTaskFormData(formData: FormData): TaskFormInput {
  const title = z.string().trim().min(1).max(180).parse(formData.get("title"));
  const descriptionOriginal = z.string().max(10_000).catch("").parse(formData.get("descriptionOriginal"));
  const status = optionalEnum(TASK_STATUSES, formData.get("status"), "OPEN");
  const deadlineDate = rawString(formData.get("deadlineDate"));
  const deadlineTime = rawString(formData.get("deadlineTime"));

  if (!deadlineDate && deadlineTime) {
    throw new Error("INVALID_TIME_WITHOUT_DATE");
  }

  const deadline = parseAmsterdamDateTimeInput(
    deadlineDate,
    deadlineTime,
  );
  const estimatedMinutes = optionalInteger(formData.get("estimatedMinutes"));
  const remainingMinutes = optionalInteger(formData.get("remainingMinutes"));
  const taskId = rawString(formData.get("taskId")) || null;

  if (estimatedMinutes !== null && estimatedMinutes <= 0) {
    throw new Error("INVALID_ESTIMATED_MINUTES");
  }

  if (remainingMinutes !== null && remainingMinutes < 0) {
    throw new Error("INVALID_REMAINING_MINUTES");
  }

  const sourceType = optionalEnum(TASK_SOURCE_TYPES, formData.get("sourceType"), "MANUAL");
  if (sourceType !== "MANUAL") {
    throw new Error("INVALID_SOURCE_TYPE");
  }

  return {
    taskId,
    title,
    descriptionOriginal,
    deadline,
    estimatedMinutes,
    remainingMinutes,
    status,
  };
}

export function parseSubtaskFormData(formData: FormData): SubtaskFormInput {
  const title = z.string().trim().min(1).max(180).parse(formData.get("title"));
  const descriptionOriginal = z.string().max(10_000).catch("").parse(formData.get("descriptionOriginal"));
  const taskId = z.string().trim().min(1).parse(formData.get("taskId"));
  const subtaskId = rawString(formData.get("subtaskId")) || null;
  const deadlineDate = rawString(formData.get("deadlineDate"));
  const deadlineTime = rawString(formData.get("deadlineTime"));

  if (!deadlineDate && deadlineTime) {
    throw new Error("INVALID_TIME_WITHOUT_DATE");
  }

  const deadline = parseAmsterdamDateTimeInput(
    deadlineDate,
    deadlineTime,
    "17:00",
  );
  const earliestStart = parseAmsterdamDateTimeInput(
    rawString(formData.get("earliestStartDate")),
    formData.get("earliestStartTime") as string | null,
    "00:00",
  );
  const estimatedMinutes = requiredPositiveInteger(formData.get("estimatedMinutes"));
  const remainingMinutes = requiredNonNegativeInteger(formData.get("remainingMinutes"));
  const minimumBlockMinutes = optionalInteger(formData.get("minimumBlockMinutes")) ?? 15;
  const splittable = rawString(formData.get("splittable")) === "on";
  const priority = optionalInteger(formData.get("priority"));
  const context = rawString(formData.get("context"));
  const status = optionalEnum(SUBTASK_STATUSES, formData.get("status"), "OPEN");

  if (minimumBlockMinutes <= 0) {
    throw new Error("INVALID_MINIMUM_BLOCK_MINUTES");
  }

  if (priority !== null && priority < 0) {
    throw new Error("INVALID_PRIORITY");
  }

  return {
    subtaskId,
    taskId,
    title,
    descriptionOriginal,
    deadline,
    earliestStart,
    estimatedMinutes,
    remainingMinutes,
    minimumBlockMinutes,
    splittable,
    priority,
    context,
    status,
  };
}

export function parseDependencyFormData(formData: FormData): DependencyFormInput {
  const dependencyId = rawString(formData.get("dependencyId")) || null;
  const subtaskId = z.string().trim().min(1).parse(formData.get("subtaskId"));
  const dependsOnSubtaskId = z.string().trim().min(1).parse(formData.get("dependsOnSubtaskId"));
  const dependencyType = optionalEnum(TASK_DEPENDENCY_TYPES, formData.get("dependencyType"), "FINISH_TO_START");

  return {
    dependencyId,
    subtaskId,
    dependsOnSubtaskId,
    dependencyType,
  };
}
