import { requireUser } from "@/lib/auth/require-user";

import {
  logoutAction,
  revokeAllSessionsAction,
} from "./(protected)/session-actions";
import {
  TakenVisualPrototype,
  type PlanningViewKey,
} from "./taken/taken-visual-prototype";

export async function AuthenticatedPlanningShell({
  initialView,
}: Readonly<{ initialView: PlanningViewKey }>) {
  const session = await requireUser();

  return (
    <TakenVisualPrototype
      initialView={initialView}
      userEmail={session.user.email}
      logoutAction={logoutAction}
      revokeAllSessionsAction={revokeAllSessionsAction}
    />
  );
}
