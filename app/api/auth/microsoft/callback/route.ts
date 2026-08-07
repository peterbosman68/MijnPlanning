import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { saveMicrosoftTokens } from "@/lib/microsoft/token-service";

const STATE_COOKIE = "ms_oauth_state";
const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

export async function GET(request: Request) {
  const user = await requireUser();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    redirect("/vandaag?fout=outlook-geweigerd");
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!state || !savedState || state !== savedState) {
    redirect("/vandaag?fout=outlook-ongeldige-state");
  }

  if (!code) {
    redirect("/vandaag?fout=outlook-geen-code");
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    redirect("/vandaag?fout=outlook-niet-geconfigureerd");
  }

  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://mijnplanning.vercel.app"
    : "http://localhost:3000";

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: `${baseUrl}/api/auth/microsoft/callback`,
    scope: ["openid", "profile", "offline_access", "Calendars.Read"].join(" "),
  });

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    redirect("/vandaag?fout=outlook-token-mislukt");
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    id_token?: string;
  };

  if (!tokenData.refresh_token) {
    redirect("/vandaag?fout=outlook-geen-refresh-token");
  }

  // Haal Microsoft account-id op via id_token of /me
  let microsoftAccountId = "unknown";
  try {
    const meResponse = await fetch("https://graph.microsoft.com/v1.0/me?$select=id", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    });
    if (meResponse.ok) {
      const me = (await meResponse.json()) as { id?: string };
      microsoftAccountId = me.id ?? "unknown";
    }
  } catch {
    // niet fataal
  }

  await saveMicrosoftTokens(
    user.id,
    tokenData.access_token,
    tokenData.refresh_token,
    tokenData.expires_in,
    tokenData.scope,
    microsoftAccountId,
  );

  redirect("/vandaag?outlook=gekoppeld");
}
