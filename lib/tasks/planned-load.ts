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
  return status === "completed" || status === "archived";
}

function isClosedSubtaskState(state?: PlannedSubtaskState) {
  return state === "done" || state === "archived";
}

export function taskOwnPlannedMinutesOnDate(task: PlannedTaskLike, dateValue: string) {
  if (isClosedTaskStatus(task.status)) return 0;
  const openSubtasks = task.subtasks.filter((subtask) => !isClosedSubtaskState(subtask.state));
  if (openSubtasks.length > 0) return 0;
  if (extractDateFromDeadlineValue(task.deadlineValue) !== dateValue) return 0;
  return parseMinutesFromLabelToTotal(task.remaining);
}

export function subtaskPlannedMinutesOnDate(subtask: PlannedSubtaskLike, dateValue: string) {
  if (isClosedSubtaskState(subtask.state)) return 0;
  if (extractDateFromDeadlineValue(subtask.deadlineValue) !== dateValue) return 0;
  return parseMinutesFromLabelToTotal(subtask.remaining);
}

export function totalPlannedWorkMinutesForDate(tasks: PlannedTaskLike[], dateValue: string) {
  return tasks.reduce((sum, task) => {
    if (isClosedTaskStatus(task.status)) return sum;

    const openSubtasks = task.subtasks.filter((subtask) => !isClosedSubtaskState(subtask.state));

    if (openSubtasks.length > 0) {
      return sum + openSubtasks.reduce((subSum, subtask) => subSum + subtaskPlannedMinutesOnDate(subtask, dateValue), 0);
    }

    return sum + taskOwnPlannedMinutesOnDate(task, dateValue);
  }, 0);
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