import "server-only";

import { prisma } from "@/lib/db/client";
import { decryptToken, encryptToken } from "./token-encryption";

const GRAPH_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const REFRESH_MARGIN_SECONDS = 300;

function getClientCredentials() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("MICROSOFT_CLIENT_ID of MICROSOFT_CLIENT_SECRET ontbreekt.");
  }
  return { clientId, clientSecret };
}

export async function getValidAccessToken(userId: string): Promise<string> {
  // Probeer eerst legacy env-token (voor lokale tests)
  const legacyToken = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN;

  const record = await prisma.microsoftToken.findUnique({ where: { userId } });

  if (!record) {
    if (legacyToken) return legacyToken;
    throw new Error("Outlook-agenda is niet gekoppeld.");
  }

  const expiresAt = record.accessTokenExpiresAt.getTime();
  const now = Date.now();

  if (expiresAt - now > REFRESH_MARGIN_SECONDS * 1000) {
    return decryptToken(record.encryptedAccessToken);
  }

  // Token bijna verlopen: vernieuwen via refresh token
  const { clientId, clientSecret } = getClientCredentials();
  const refreshToken = decryptToken(record.encryptedRefreshToken);

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: record.scope,
  });

  const response = await fetch(GRAPH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token vernieuwen mislukt: ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.microsoftToken.update({
    where: { userId },
    data: {
      encryptedAccessToken: encryptToken(data.access_token),
      ...(data.refresh_token ? { encryptedRefreshToken: encryptToken(data.refresh_token) } : {}),
      accessTokenExpiresAt: newExpiresAt,
    },
  });

  return data.access_token;
}

export async function saveMicrosoftTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  scope: string,
  microsoftAccountId: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  await prisma.microsoftToken.upsert({
    where: { userId },
    create: {
      userId,
      encryptedAccessToken: encryptToken(accessToken),
      encryptedRefreshToken: encryptToken(refreshToken),
      accessTokenExpiresAt: expiresAt,
      scope,
      microsoftAccountId,
    },
    update: {
      encryptedAccessToken: encryptToken(accessToken),
      encryptedRefreshToken: encryptToken(refreshToken),
      accessTokenExpiresAt: expiresAt,
      scope,
      microsoftAccountId,
    },
  });
}

export async function deleteMicrosoftTokens(userId: string): Promise<void> {
  await prisma.microsoftToken.deleteMany({ where: { userId } });
}

export async function hasMicrosoftToken(userId: string): Promise<boolean> {
  const count = await prisma.microsoftToken.count({ where: { userId } });
  return count > 0;
}

