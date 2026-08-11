import { describe, expect, it } from "vitest";

import {
  earliestOpenSubtaskDeadlineValue,
  subtaskHasPlannedWorkInDateRange,
  subtaskHasPlannedWorkOnDate,
  subtaskPlannedMinutesOnDate,
  taskHasPlannedWorkInDateRange,
  taskHasPlannedWorkOnDate,
  taskOwnPlannedMinutesOnDate,
  taskPlannedMinutesOnDate,
  totalDailyLoadMinutesForDate,
  totalPlannedWorkMinutesForDate,
  weekDateRangeContaining,
  type AppointmentLike,
  type PlannedTaskLike,
} from "@/lib/tasks/planned-load";

describe("planned load per dag", () => {
  it("telt afspraken + hoofdtaakminuten op dezelfde dag mee", () => {
    const tasks: PlannedTaskLike[] = [
      {
        deadlineValue: "2026-08-07T17:00",
        remaining: "11u",
        status: "normal",
        subtasks: [],
      },
      {
        deadlineValue: "2026-08-07T17:00",
        remaining: "7u 20m",
        status: "normal",
        subtasks: [],
      },
    ];
    const appointments: AppointmentLike[] = [{ dateValue: "2026-08-07", durationMinutes: 0 }];

    const total = totalDailyLoadMinutesForDate(tasks, appointments, "2026-08-07");

    expect(total).toBe(1100);
    expect(total).toBeGreaterThan(480);
  });

  it("telt bij open subtaken alleen subtaakminuten en niet de hoofdtaak apart", () => {
    const tasks: PlannedTaskLike[] = [
      {
        deadlineValue: "2026-08-08T17:00",
        remaining: "9u",
        status: "normal",
        subtasks: [
          {
            deadlineValue: "2026-08-08T11:00",
            remaining: "2u",
            state: "planned",
          },
          {
            deadlineValue: "2026-08-08T14:00",
            remaining: "1u 30m",
            state: "blocked",
          },
        ],
      },
    ];

    expect(taskOwnPlannedMinutesOnDate(tasks[0], "2026-08-08")).toBe(0);
    expect(totalPlannedWorkMinutesForDate(tasks, "2026-08-08")).toBe(210);
  });

  it("negeert afgeronde of gearchiveerde subtaken", () => {
    expect(
      subtaskPlannedMinutesOnDate(
        {
          deadlineValue: "2026-08-09T10:00",
          remaining: "3u",
          state: "done",
        },
        "2026-08-09",
      ),
    ).toBe(0);

    expect(
      subtaskPlannedMinutesOnDate(
        {
          deadlineValue: "2026-08-09T10:00",
          remaining: "3u",
          state: "archived",
        },
        "2026-08-09",
      ),
    ).toBe(0);
  });

  it("telt een subtaak zonder deadline niet bij een specifieke dag op", () => {
    const tasks: PlannedTaskLike[] = [
      {
        deadlineValue: "2026-08-10T17:00",
        remaining: "2u",
        status: "normal",
        subtasks: [
          {
            remaining: "45m",
            state: "planned",
          },
        ],
      },
    ];

    expect(subtaskPlannedMinutesOnDate(tasks[0].subtasks[0], "2026-08-10")).toBe(0);
    expect(totalPlannedWorkMinutesForDate(tasks, "2026-08-10")).toBe(0);
  });

  it("selecteert een hoofdtaak voor Vandaag op basis van een open subtaakdatum", () => {
    const task: PlannedTaskLike = {
      remaining: "1u",
      status: "normal",
      subtasks: [
        { deadlineValue: "2026-08-11T17:00", remaining: "30m", state: "planned" },
        { deadlineValue: "2026-08-12T17:00", remaining: "30m", state: "done" },
      ],
    };

    expect(taskHasPlannedWorkOnDate(task, "2026-08-11")).toBe(true);
    expect(taskHasPlannedWorkOnDate(task, "2026-08-12")).toBe(false);
    expect(subtaskHasPlannedWorkOnDate(task.subtasks[0], "2026-08-11")).toBe(true);
    expect(subtaskHasPlannedWorkOnDate(task.subtasks[1], "2026-08-12")).toBe(false);
  });

  it("selecteert een hoofdtaak voor Week wanneer een open subtaak binnen het datumbereik valt", () => {
    const task: PlannedTaskLike = {
      remaining: "1u",
      status: "normal",
      subtasks: [
        { deadlineValue: "2026-08-13T17:00", remaining: "1u", state: "planned" },
      ],
    };

    expect(taskHasPlannedWorkInDateRange(task, "2026-08-10", "2026-08-16")).toBe(true);
    expect(taskHasPlannedWorkInDateRange(task, "2026-08-03", "2026-08-09")).toBe(false);
    expect(subtaskHasPlannedWorkInDateRange(task.subtasks[0], "2026-08-10", "2026-08-16")).toBe(true);
    expect(weekDateRangeContaining("2026-08-13")).toEqual({
      startDate: "2026-08-10",
      endDate: "2026-08-16",
    });
  });

  it("leidt de eerstvolgende hoofdtaakdatum af uit alleen open subtaken", () => {
    expect(earliestOpenSubtaskDeadlineValue([
      { deadlineValue: "2026-08-14T17:00", remaining: "30m", state: "planned" },
      { deadlineValue: "2026-08-12T09:00", remaining: "30m", state: "blocked" },
      { deadlineValue: "2026-08-11T17:00", remaining: "30m", state: "done" },
      { remaining: "30m", state: "planned" },
    ])).toBe("2026-08-12T09:00");
  });

  it("toont per datum alleen de GiveWally-tijd die op die datum gepland staat", () => {
    const giveWallyTask: PlannedTaskLike = {
      remaining: "5u 30m",
      status: "normal",
      subtasks: [
        { deadlineValue: "2026-08-11T17:00", remaining: "1u 30m", state: "planned" },
        { deadlineValue: "2026-08-19T17:00", remaining: "4u", state: "planned" },
      ],
    };

    expect(taskPlannedMinutesOnDate(giveWallyTask, "2026-08-11")).toBe(90);
    expect(taskPlannedMinutesOnDate(giveWallyTask, "2026-08-19")).toBe(240);
  });

  it("plant een hoofdtaak met alleen gesloten subtaken niet opnieuw als zelfstandig werk", () => {
    const task: PlannedTaskLike = {
      deadlineValue: "2026-08-11T17:00",
      remaining: "2u",
      status: "normal",
      subtasks: [{ deadlineValue: "2026-08-10T17:00", remaining: "0m", state: "done" }],
    };

    expect(taskOwnPlannedMinutesOnDate(task, "2026-08-11")).toBe(0);
    expect(taskHasPlannedWorkOnDate(task, "2026-08-11")).toBe(false);
  });
});
