import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import { deleteMicrosoftTokens, hasMicrosoftToken } from "@/lib/microsoft/token-service";

export async function GET() {
  const user = await requireUser();
  const connected = await hasMicrosoftToken(user.user.id);
  return NextResponse.json({ connected });
}

export async function DELETE() {
  const user = await requireUser();
  await deleteMicrosoftTokens(user.user.id);
  return NextResponse.json({ ok: true });
}
