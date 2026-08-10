import type { Metadata } from "next";

import { AuthenticatedPlanningShell } from "@/app/authenticated-planning-shell";

export const metadata: Metadata = {
  title: "Taken | MijnPlanning",
};

export default async function TakenPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ taskId?: string; subtaskId?: string }>;
}>) {
  const { taskId, subtaskId } = await searchParams;

  return (
    <AuthenticatedPlanningShell
      initialView="tasks"
      selectedTaskId={taskId}
      selectedSubtaskId={subtaskId}
    />
  );
}
