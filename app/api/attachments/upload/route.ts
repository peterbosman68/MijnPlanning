import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { ensureUploadAllowed, MAX_ATTACHMENT_BYTES } from "@/lib/attachments/blob-storage";
import { authorizeAttachmentTarget, finalizeManualAttachment } from "@/lib/attachments/service";
import { getServerEnv } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/client";
import { assertTrustedRequestOrigin } from "@/lib/security/origin";

const targetSchema = z.union([
  z.object({ taskId: z.string().min(1), subtaskId: z.undefined().optional() }).strict(),
  z.object({ taskId: z.undefined().optional(), subtaskId: z.string().min(1) }).strict(),
]);

const uploadPayloadSchema = z.object({
  target: targetSchema,
  originalFileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
}).strict();

const tokenPayloadSchema = uploadPayloadSchema.extend({
  userId: z.string().min(1),
});

function expectedPathPrefix(target: z.infer<typeof targetSchema>) {
  return target.taskId
    ? `manual/task/${target.taskId}/`
    : `manual/subtask/${target.subtaskId}/`;
}

export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = await request.json() as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Ongeldige uploadaanvraag." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      request,
      body,
      token: getServerEnv().BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        assertTrustedRequestOrigin(request.headers);
        const session = await requireUser();
        const payload = uploadPayloadSchema.parse(JSON.parse(clientPayload ?? ""));
        ensureUploadAllowed(payload.originalFileName, payload.sizeBytes);

        if (!pathname.startsWith(expectedPathPrefix(payload.target))) {
          throw new Error("Ongeldig opslagpad.");
        }

        await authorizeAttachmentTarget(session.user.id, payload.target);

        return {
          allowedContentTypes: [payload.mimeType],
          maximumSizeInBytes: MAX_ATTACHMENT_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ...payload, userId: session.user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = tokenPayloadSchema.parse(JSON.parse(tokenPayload ?? ""));
        if (!blob.pathname.startsWith(expectedPathPrefix(payload.target))) {
          throw new Error("Ongeldig opslagpad.");
        }

        await finalizeManualAttachment(prisma, {
          ...payload,
          blobPath: blob.pathname,
        });
      },
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Document uploaden is mislukt." }, { status: 400 });
  }
}