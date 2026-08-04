export type TaskErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DEADLINE_CONFLICT"
  | "DEPENDENCY_CYCLE"
  | "DEPENDENCY_NOT_ALLOWED"
  | "ARCHIVE_BLOCKED";

export class TaskDomainError extends Error {
  constructor(
    public readonly code: TaskErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "TaskDomainError";
  }
}

export class TaskDeadlineConflictError extends TaskDomainError {
  constructor(details: unknown) {
    super("DEADLINE_CONFLICT", "DEADLINE_CONFLICT", details);
  }
}

export class TaskDependencyCycleError extends TaskDomainError {
  constructor(details: unknown) {
    super("DEPENDENCY_CYCLE", "DEPENDENCY_CYCLE", details);
  }
}

export class TaskNotFoundError extends TaskDomainError {
  constructor() {
    super("NOT_FOUND", "NOT_FOUND");
  }
}
