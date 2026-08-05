export const TASK_STATUSES = ["OPEN", "WAITING", "ACTIVE", "PAUSED", "WAITING_EXTERNAL", "COMPLETED", "ARCHIVED", "CANCELLED"] as const;
export const SUBTASK_STATUSES = ["OPEN", "WAITING", "ACTIVE", "PAUSED", "WAITING_EXTERNAL", "COMPLETED", "ARCHIVED", "CANCELLED"] as const;
export const TASK_SOURCE_TYPES = ["MANUAL", "IMPORTED"] as const;
export const TASK_DEPENDENCY_TYPES = ["FINISH_TO_START"] as const;
export const TIME_SESSION_TYPES = ["ACTIVE", "PAUSED", "INTERRUPTED", "WAITING_EXTERNAL"] as const;
export const INTERRUPTION_REASONS = ["CONTEXT_SWITCH", "MEETING", "BREAK", "DISTRACTION", "TECHNICAL_ISSUE", "OTHER"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type SubtaskStatus = (typeof SUBTASK_STATUSES)[number];
export type TaskSourceType = (typeof TASK_SOURCE_TYPES)[number];
export type TaskDependencyType = (typeof TASK_DEPENDENCY_TYPES)[number];
export type TimeSessionType = (typeof TIME_SESSION_TYPES)[number];
export type InterruptionReason = (typeof INTERRUPTION_REASONS)[number];

export const AMSTERDAM_TIME_ZONE = "Europe/Amsterdam" as const;

export type TaskFormInput = Readonly<{
  taskId: string | null;
  title: string;
  descriptionOriginal: string;
  deadline: Date | null;
  estimatedMinutes: number | null;
  remainingMinutes: number | null;
  status: TaskStatus;
}>;

export type SubtaskFormInput = Readonly<{
  subtaskId: string | null;
  taskId: string;
  title: string;
  descriptionOriginal: string;
  deadline: Date;
  earliestStart: Date | null;
  estimatedMinutes: number;
  remainingMinutes: number;
  minimumBlockMinutes: number;
  splittable: boolean;
  priority: number | null;
  context: string;
  status: SubtaskStatus;
}>;

export type DependencyFormInput = Readonly<{
  dependencyId: string | null;
  subtaskId: string;
  dependsOnSubtaskId: string;
  dependencyType: TaskDependencyType;
}>;
