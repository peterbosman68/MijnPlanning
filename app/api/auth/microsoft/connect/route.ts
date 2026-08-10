import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";

const SCOPES = ["openid", "profile", "offline_access", "Calendars.Read", "Tasks.Read"].join(" ");
const STATE_COOKIE = "ms_oauth_state";

export async function GET() {
  await requireUser();

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    redirect("/vandaag?fout=outlook-niet-geconfigureerd");
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://mijnplanning.vercel.app"
    : "http://localhost:3000";

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: `${baseUrl}/api/auth/microsoft/callback`,
    scope: SCOPES,
    state,
    response_mode: "query",
  });

  redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`);
}
