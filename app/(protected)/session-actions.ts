"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import {
  revokeAllUserSessions,
  revokeCurrentSession,
} from "@/lib/auth/session";
import { logger } from "@/lib/logging/logger";
import { assertTrustedRequestOrigin } from "@/lib/security/origin";

async function verifyMutationOrigin(): Promise<void> {
  assertTrustedRequestOrigin(await headers());
}

export async function logoutAction(): Promise<void> {
  await verifyMutationOrigin();

  try {
    await revokeCurrentSession();
    logger.info({ code: "AUTH_LOGOUT_SUCCEEDED", route: "/vandaag", status: "ok" });
  } catch {
    logger.error({ code: "AUTH_LOGOUT_FAILED", route: "/vandaag", status: "error" });
    throw new Error("LOGOUT_FAILED");
  }

  redirect("/login");
}

export async function revokeAllSessionsAction(): Promise<void> {
  await verifyMutationOrigin();
  const session = await requireUser();

  try {
    await revokeAllUserSessions(session.user.id);
    logger.info({
      code: "AUTH_ALL_SESSIONS_REVOKED",
      route: "/vandaag",
      status: "ok",
    });
  } catch {
    logger.error({
      code: "AUTH_ALL_SESSIONS_REVOKE_FAILED",
      route: "/vandaag",
      status: "error",
    });
    throw new Error("REVOKE_ALL_SESSIONS_FAILED");
  }

  redirect("/login");
}
