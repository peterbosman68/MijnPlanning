import { AuthenticatedPlanningShell } from "@/app/authenticated-planning-shell";

export default function VandaagPage() {
  return <AuthenticatedPlanningShell initialView="today" />;
}
