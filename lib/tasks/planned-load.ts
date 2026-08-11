export type PlannedSubtaskState = "active" | "blocked" | "waiting" | "done" | "planned" | "archived";

export type PlannedSubtaskLike = {
  deadlineValue?: string;
  remaining: string;
  state?: PlannedSubtaskState;
};

export type PlannedTaskLike = {
  deadlineValue?: string;
  remaining: string;
  status?: string;
  subtasks: PlannedSubtaskLike[];
};

export type AppointmentLike = {
  dateValue: string;
  durationMinutes: number;
};

function parseMinutesFromLabelToTotal(label: string) {
  const trimmed = label.trim().toLowerCase();
  if (!trimmed || trimmed === "-" || trimmed === "nog te schatten") return 0;

  const hourMatch = trimmed.match(/(\d+)u/);
  const minuteMatch = trimmed.match(/(\d+)m/);
  const hours = hourMatch ? Number.parseInt(hourMatch[1], 10) : 0;
  const minutes = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0;
  const total = hours * 60 + minutes;

  return total > 0 ? total : 0;
}

export function extractDateFromDeadlineValue(deadlineValue?: string) {
  if (!deadlineValue) return null;
  if (deadlineValue.includes("T")) return deadlineValue.split("T")[0];
  return deadlineValue;
}

function isClosedTaskStatus(status?: string) {
  return status === "waiting" || status === "completed" || status === "archived";
}

function isClosedSubtaskState(state?: PlannedSubtaskState) {
  return state === "done" || state === "archived";
}

export function earliestOpenSubtaskDeadlineValue(subtasks: PlannedSubtaskLike[]) {
  return subtasks
    .filter((subtask) => !isClosedSubtaskState(subtask.state) && extractDateFromDeadlineValue(subtask.deadlineValue))
    .map((subtask) => subtask.deadlineValue!)
    .sort((left, right) => left.localeCompare(right))[0] ?? null;
}

export function taskHasPlannedWorkInDateRange(task: PlannedTaskLike, startDate: string, endDate: string) {
  if (isClosedTaskStatus(task.status)) return false;

  if (task.subtasks.length > 0) {
    return task.subtasks.some((subtask) => subtaskHasPlannedWorkInDateRange(subtask, startDate, endDate));
  }

  const date = extractDateFromDeadlineValue(task.deadlineValue);
  return Boolean(date && date >= startDate && date <= endDate);
}

export function taskHasPlannedWorkOnDate(task: PlannedTaskLike, dateValue: string) {
  return taskHasPlannedWorkInDateRange(task, dateValue, dateValue);
}

export function weekDateRangeContaining(dateValue: string) {
  const parsed = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  const dayFromMonday = (parsed.getUTCDay() + 6) % 7;
  const start = new Date(parsed);
  start.setUTCDate(start.getUTCDate() - dayFromMonday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function taskOwnPlannedMinutesOnDate(task: PlannedTaskLike, dateValue: string) {
  if (isClosedTaskStatus(task.status)) return 0;
  if (task.subtasks.length > 0) return 0;
  if (extractDateFromDeadlineValue(task.deadlineValue) !== dateValue) return 0;
  return parseMinutesFromLabelToTotal(task.remaining);
}

export function subtaskPlannedMinutesOnDate(subtask: PlannedSubtaskLike, dateValue: string) {
  if (isClosedSubtaskState(subtask.state)) return 0;
  if (extractDateFromDeadlineValue(subtask.deadlineValue) !== dateValue) return 0;
  return parseMinutesFromLabelToTotal(subtask.remaining);
}

export function taskPlannedMinutesOnDate(task: PlannedTaskLike, dateValue: string) {
  if (isClosedTaskStatus(task.status)) return 0;
  if (task.subtasks.length === 0) return taskOwnPlannedMinutesOnDate(task, dateValue);

  return task.subtasks.reduce(
    (sum, subtask) => sum + subtaskPlannedMinutesOnDate(subtask, dateValue),
    0,
  );
}

export function totalPlannedWorkMinutesForDate(tasks: PlannedTaskLike[], dateValue: string) {
  return tasks.reduce((sum, task) => sum + taskPlannedMinutesOnDate(task, dateValue), 0);
}

export function totalBookedMinutesForDate(appointments: AppointmentLike[], dateValue: string) {
  return appointments
    .filter((appointment) => appointment.dateValue === dateValue)
    .reduce((sum, appointment) => sum + appointment.durationMinutes, 0);
}

export function totalDailyLoadMinutesForDate(
  tasks: PlannedTaskLike[],
  appointments: AppointmentLike[],
  dateValue: string,
) {
  return totalBookedMinutesForDate(appointments, dateValue) + totalPlannedWorkMinutesForDate(tasks, dateValue);
}

export function subtaskHasPlannedWorkInDateRange(
  subtask: PlannedSubtaskLike,
  startDate: string,
  endDate: string,
) {
  if (isClosedSubtaskState(subtask.state)) return false;
  const date = extractDateFromDeadlineValue(subtask.deadlineValue);
  return Boolean(date && date >= startDate && date <= endDate);
}

export function subtaskHasPlannedWorkOnDate(subtask: PlannedSubtaskLike, dateValue: string) {
  return subtaskHasPlannedWorkInDateRange(subtask, dateValue, dateValue);
}
