import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import { deleteStoredAttachment } from "@/lib/attachments/service";
import { assertTrustedRequestOrigin, InvalidRequestOriginError } from "@/lib/security/origin";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const session = await requireUser();

  try {
    assertTrustedRequestOrigin(request.headers);
    const { attachmentId } = await context.params;
    const deleted = await deleteStoredAttachment(session.user.id, attachmentId);

    if (!deleted) {
      return NextResponse.json({ error: "Bijlage niet gevonden." }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof InvalidRequestOriginError) {
      return NextResponse.json({ error: "Ongeldige request-origin." }, { status: 403 });
    }

    return NextResponse.json({ error: "Bijlage verwijderen is mislukt." }, { status: 500 });
  }
}