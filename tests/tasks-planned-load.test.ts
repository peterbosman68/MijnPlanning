import { describe, expect, it } from "vitest";

import {
  subtaskPlannedMinutesOnDate,
  taskOwnPlannedMinutesOnDate,
  totalDailyLoadMinutesForDate,
  totalPlannedWorkMinutesForDate,
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
});