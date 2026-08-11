import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseAmsterdamDateTimeInput } from "@/lib/tasks/domain/date";

const runDatabaseTests = process.env.MIJNPLANNING_RUN_DB_TESTS === "1";
const describeDatabase = runDatabaseTests ? describe : describe.skip;

function loadDatabaseUrlWithoutLogging(): string {
  const raw = readFileSync(".env", "utf8");
  const match = raw.match(/^\s*DATABASE_URL\s*=\s*["']?([^\r\n"']+)/m);

  if (!match?.[1]) {
    throw new Error("TEST_DATABASE_URL_MISSING");
  }

  return match[1];
}

describeDatabase("taken-service-integratie", () => {
  it("dwingt deadlinehiërarchie, projectie en dependencycylci af", async () => {
    process.env.DATABASE_URL = loadDatabaseUrlWithoutLogging();

    const [{ prisma }, { createTask, createSubtask, updateTask, updateSubtask, createDependency, getTaskBoardData }] = await Promise.all([
      import("@/lib/db/client"),
      import("@/lib/tasks/service"),
    ]);

    const email = `taken.integratie.${Date.now()}@example.invalid`;

    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: "integration-only-hash",
        },
      });

      const taskDeadline = parseAmsterdamDateTimeInput("2026-07-24", "17:00");
      const subtaskDeadline = parseAmsterdamDateTimeInput("2026-07-24", "16:00");

      expect(taskDeadline).not.toBeNull();
      expect(subtaskDeadline).not.toBeNull();

      const task = await createTask(user.id, {
        taskId: null,
        title: "Hoofdtaak",
        descriptionOriginal: "",
        deadline: taskDeadline,
        estimatedMinutes: 120,
        remainingMinutes: 120,
        status: "OPEN",
      });

      const subtask = await createSubtask(user.id, {
        subtaskId: null,
        taskId: task.taskId,
        title: "Eerste subtaak",
        descriptionOriginal: "",
        deadline: subtaskDeadline!,
        earliestStart: null,
        estimatedMinutes: 30,
        remainingMinutes: 30,
        minimumBlockMinutes: 15,
        splittable: false,
        priority: null,
        context: "",
        status: "OPEN",
      });

      const boardAfterCreate = await getTaskBoardData(user.id, task.taskId);
      expect(boardAfterCreate.selectedTask?.remainingMinutes).toBe(30);
      expect(boardAfterCreate.selectedTask?.subtasks).toHaveLength(1);

      await updateSubtask(user.id, {
        subtaskId: subtask.subtaskId,
        taskId: task.taskId,
        title: "Eerste subtaak",
        descriptionOriginal: "",
        deadline: subtaskDeadline!,
        earliestStart: null,
        estimatedMinutes: 45,
        remainingMinutes: 45,
        minimumBlockMinutes: 15,
        splittable: false,
        priority: null,
        context: "",
        status: "OPEN",
      });

      const boardAfterTimeUpdate = await getTaskBoardData(user.id, task.taskId, subtask.subtaskId);
      expect(boardAfterTimeUpdate.selectedTask?.remainingMinutes).toBe(45);
      expect(boardAfterTimeUpdate.selectedSubtask?.estimatedMinutes).toBe(45);
      expect(boardAfterTimeUpdate.selectedSubtask?.remainingMinutes).toBe(45);

      const deadlineLessSubtask = await createSubtask(user.id, {
        subtaskId: null,
        taskId: task.taskId,
        title: "Subtaak zonder deadline",
        descriptionOriginal: "",
        deadline: null,
        earliestStart: null,
        estimatedMinutes: 25,
        remainingMinutes: 25,
        minimumBlockMinutes: 15,
        splittable: false,
        priority: null,
        context: "",
        status: "OPEN",
      });

      const boardWithDeadlineLessSubtask = await getTaskBoardData(user.id, task.taskId, deadlineLessSubtask.subtaskId);
      expect(boardWithDeadlineLessSubtask.selectedTask?.remainingMinutes).toBe(70);
      expect(boardWithDeadlineLessSubtask.selectedSubtask?.deadline).toBe("Geen deadline");
      expect(boardWithDeadlineLessSubtask.selectedSubtask?.deadlineDate).toBe("");

      await updateSubtask(user.id, {
        subtaskId: deadlineLessSubtask.subtaskId,
        taskId: task.taskId,
        title: "Subtaak zonder deadline",
        descriptionOriginal: "",
        deadline: null,
        earliestStart: null,
        estimatedMinutes: 35,
        remainingMinutes: 35,
        minimumBlockMinutes: 15,
        splittable: false,
        priority: null,
        context: "",
        status: "OPEN",
      });

      const boardAfterDeadlineLessUpdate = await getTaskBoardData(user.id, task.taskId, deadlineLessSubtask.subtaskId);
      expect(boardAfterDeadlineLessUpdate.selectedTask?.remainingMinutes).toBe(80);
      expect(boardAfterDeadlineLessUpdate.selectedSubtask?.remainingMinutes).toBe(35);

      await expect(
        updateTask(user.id, {
          taskId: task.taskId,
          title: "Hoofdtaak",
          descriptionOriginal: "",
          deadline: parseAmsterdamDateTimeInput("2026-07-24", "15:30"),
          estimatedMinutes: 120,
          remainingMinutes: 120,
          status: "OPEN",
        }),
      ).rejects.toMatchObject({ code: "DEADLINE_CONFLICT" });

      const secondTask = await createTask(user.id, {
        taskId: null,
        title: "Tweede hoofdtaak",
        descriptionOriginal: "",
        deadline: parseAmsterdamDateTimeInput("2026-07-25", "17:00"),
        estimatedMinutes: 60,
        remainingMinutes: 60,
        status: "OPEN",
      });

      const secondSubtask = await createSubtask(user.id, {
        subtaskId: null,
        taskId: secondTask.taskId,
        title: "Tweede subtaak",
        descriptionOriginal: "",
        deadline: parseAmsterdamDateTimeInput("2026-07-25", "16:00")!,
        earliestStart: null,
        estimatedMinutes: 20,
        remainingMinutes: 20,
        minimumBlockMinutes: 15,
        splittable: false,
        priority: null,
        context: "",
        status: "OPEN",
      });

      await createDependency(user.id, {
        dependencyId: null,
        subtaskId: secondSubtask.subtaskId,
        dependsOnSubtaskId: subtask.subtaskId,
        dependencyType: "FINISH_TO_START",
      });

      await expect(
        createDependency(user.id, {
          dependencyId: null,
          subtaskId: subtask.subtaskId,
          dependsOnSubtaskId: secondSubtask.subtaskId,
          dependencyType: "FINISH_TO_START",
        }),
      ).rejects.toMatchObject({ code: "DEPENDENCY_CYCLE" });

      const boardAfterDependency = await getTaskBoardData(user.id, secondTask.taskId);
      expect(boardAfterDependency.dependencies).toHaveLength(1);
      expect(boardAfterDependency.selectedTask?.subtasks[0].blocked).toBe(true);
    } finally {
      await prisma.taskDependency.deleteMany();
      await prisma.subtask.deleteMany();
      await prisma.task.deleteMany();
      await prisma.user.deleteMany({ where: { email } });
      await prisma.$disconnect();
    }
  }, 30_000);
});
