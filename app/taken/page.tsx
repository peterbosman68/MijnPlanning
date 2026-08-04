import type { Metadata } from "next";

import { AuthenticatedPlanningShell } from "@/app/authenticated-planning-shell";

export const metadata: Metadata = {
  title: "Taken | MijnPlanning",
};

export default function TakenPage() {
  return <AuthenticatedPlanningShell initialView="tasks" />;
}
