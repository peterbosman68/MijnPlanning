import { describe, expect, it } from "vitest";

import { hasDependencyPath } from "@/lib/tasks/domain/dependency-graph";
import {
  formatAmsterdamDateTimeLabel,
  parseAmsterdamDateTimeInput,
} from "@/lib/tasks/domain/date";
import {
  parseDependencyFormData,
  parseSubtaskFormData,
  parseTaskFormData,
} from "@/lib/tasks/domain/validation";

describe("taken-domein", () => {
  it("zet een Amsterdamse datum/tijd om naar UTC en terug", () => {
    const date = parseAmsterdamDateTimeInput("2026-07-24", "17:00");

    expect(date).not.toBeNull();
    expect(date?.toISOString()).toBe("2026-07-24T15:00:00.000Z");
    expect(formatAmsterdamDateTimeLabel(date!)).toContain("24 jul 2026");
  });

  it("geeft een voorstel van 17.00 uur bij een lege tijd voor taken", () => {
    const date = parseAmsterdamDateTimeInput("2026-07-24", null);

    expect(date).not.toBeNull();
    expect(date?.toISOString()).toBe("2026-07-24T15:00:00.000Z");
  });

  it("accepteert een taakformulier met lege omschrijving en optionele deadline", () => {
    const formData = new FormData();
    formData.set("title", "Nieuwe hoofdtaak");
    formData.set("descriptionOriginal", "");
    formData.set("deadlineDate", "");
    formData.set("estimatedMinutes", "");
    formData.set("remainingMinutes", "");
    formData.set("status", "OPEN");

    const parsed = parseTaskFormData(formData);

    expect(parsed.title).toBe("Nieuwe hoofdtaak");
    expect(parsed.descriptionOriginal).toBe("");
    expect(parsed.deadline).toBeNull();
  });

  it("vereist een subtaakdeadline en numerieke duurvelden", () => {
    const formData = new FormData();
    formData.set("taskId", "task-1");
    formData.set("title", "Subtaak");
    formData.set("descriptionOriginal", "");
    formData.set("deadlineDate", "2026-07-24");
    formData.set("deadlineTime", "17:00");
    formData.set("estimatedMinutes", "30");
    formData.set("remainingMinutes", "20");
    formData.set("minimumBlockMinutes", "15");
    formData.set("status", "OPEN");

    const parsed = parseSubtaskFormData(formData);

    expect(parsed.taskId).toBe("task-1");
    expect(parsed.deadline.toISOString()).toBe("2026-07-24T15:00:00.000Z");
    expect(parsed.estimatedMinutes).toBe(30);
    expect(parsed.remainingMinutes).toBe(20);
  });

  it("levert een dependencyvorm met finish-to-start op", () => {
    const formData = new FormData();
    formData.set("subtaskId", "subtask-2");
    formData.set("dependsOnSubtaskId", "subtask-1");

    expect(parseDependencyFormData(formData)).toMatchObject({
      subtaskId: "subtask-2",
      dependsOnSubtaskId: "subtask-1",
      dependencyType: "FINISH_TO_START",
    });
  });

  it("detecteert dependencycirkels in de domeinlaag", () => {
    const edges = [
      { prerequisiteSubtaskId: "a", blockedSubtaskId: "b" },
      { prerequisiteSubtaskId: "b", blockedSubtaskId: "c" },
    ] as const;

    expect(hasDependencyPath(edges, "a", "c")).toBe(true);
    expect(hasDependencyPath(edges, "c", "a")).toBe(false);
    expect(hasDependencyPath(edges, "b", "a")).toBe(false);
  });
});
