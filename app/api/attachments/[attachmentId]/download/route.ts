import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import { downloadPrivateAttachment } from "@/lib/attachments/blob-storage";
import { getAttachmentForDownload } from "@/lib/attachments/service";

export async function GET(
  request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const session = await requireUser();
  const { attachmentId } = await context.params;
  const attachment = await getAttachmentForDownload(session.user.id, attachmentId);

  if (!attachment?.blobPath) {
    return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });
  }

  const download = await downloadPrivateAttachment(attachment.blobPath);
  if (!download?.stream) {
    return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });
  }

  const fileName = attachment.originalFileName ?? "document";
  const inline = new URL(request.url).searchParams.get("inline") === "1"
    && Boolean(attachment.mimeType?.startsWith("image/"));
  return new Response(download.stream, {
    headers: {
      "Content-Type": attachment.mimeType ?? download.blob.contentType ?? "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}