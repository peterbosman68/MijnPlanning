import { requireUser } from "@/lib/auth/require-user";
import { getAttachmentBoardData } from "@/lib/attachments/service";
import { getTaskBoardData } from "@/lib/tasks/service";

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
  selectedTaskId,
  selectedSubtaskId,
}: Readonly<{
  initialView: PlanningViewKey;
  selectedTaskId?: string;
  selectedSubtaskId?: string;
}>) {
  const session = await requireUser();
  const [taskBoard, attachmentBoard] = await Promise.all([
    getTaskBoardData(session.user.id, selectedTaskId, selectedSubtaskId),
    getAttachmentBoardData(session.user.id),
  ]);

  return (
    <TakenVisualPrototype
      initialView={initialView}
      initialTaskBoard={taskBoard}
      initialAttachmentBoard={attachmentBoard}
      userEmail={session.user.email}
      logoutAction={logoutAction}
      revokeAllSessionsAction={revokeAllSessionsAction}
    />
  );
}
