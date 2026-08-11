import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { ensureUploadAllowed, MAX_ATTACHMENT_BYTES } from "@/lib/attachments/blob-storage";
import { authorizeAttachmentTarget, finalizeManualAttachment } from "@/lib/attachments/service";
import { prisma } from "@/lib/db/client";
import { assertTrustedRequestOrigin, InvalidRequestOriginError } from "@/lib/security/origin";

const payloadSchema = z.object({
  target: z.union([
    z.object({ taskId: z.string().min(1), subtaskId: z.undefined().optional() }).strict(),
    z.object({ taskId: z.undefined().optional(), subtaskId: z.string().min(1) }).strict(),
  ]),
  blobPath: z.string().min(1).max(1_000),
  originalFileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
}).strict();

function expectedPathPrefix(target: z.infer<typeof payloadSchema>["target"]) {
  return target.taskId
    ? `manual/task/${target.taskId}/`
    : `manual/subtask/${target.subtaskId}/`;
}

export async function POST(request: Request) {
  const session = await requireUser();

  try {
    assertTrustedRequestOrigin(request.headers);
    const payload = payloadSchema.parse(await request.json());
    ensureUploadAllowed(payload.originalFileName, payload.sizeBytes);

    if (!payload.blobPath.startsWith(expectedPathPrefix(payload.target))) {
      return NextResponse.json({ error: "Ongeldig opslagpad." }, { status: 400 });
    }

    await authorizeAttachmentTarget(session.user.id, payload.target);
    const attachment = await finalizeManualAttachment(prisma, {
      ...payload,
      userId: session.user.id,
    });

    return NextResponse.json({
      attachment: {
        id: attachment.id,
        name: attachment.originalFileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      },
    });
  } catch (error) {
    const status = error instanceof InvalidRequestOriginError ? 403 : 400;
    return NextResponse.json({ error: "Document bevestigen is mislukt." }, { status });
  }
}