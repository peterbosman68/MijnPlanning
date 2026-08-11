import "server-only";

import { del, get, put } from "@vercel/blob";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { getServerEnv } from "@/lib/config/server-env";

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const LOCAL_ATTACHMENT_ROOT = path.join(process.cwd(), ".mijnplanning-attachments");
const BLOCKED_EXTENSIONS = new Set([
  ".ade",
  ".adp",
  ".apk",
  ".app",
  ".bat",
  ".chm",
  ".cmd",
  ".com",
  ".cpl",
  ".dll",
  ".dmg",
  ".exe",
  ".hta",
  ".ins",
  ".isp",
  ".jar",
  ".js",
  ".jse",
  ".lib",
  ".lnk",
  ".mde",
  ".msc",
  ".msi",
  ".msp",
  ".mst",
  ".ps1",
  ".reg",
  ".scr",
  ".sct",
  ".shb",
  ".sys",
  ".vb",
  ".vbe",
  ".vbs",
  ".vxd",
  ".wsc",
  ".wsf",
  ".wsh",
]);

export class AttachmentStorageConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentStorageConfigError";
  }
}

export class AttachmentUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentUploadValidationError";
  }
}

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120) || "bijlage";
}

function detectExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return "";
  return fileName.slice(dotIndex).toLowerCase();
}

export function ensureUploadAllowed(fileName: string, sizeBytes: number) {
  if (sizeBytes <= 0) {
    throw new AttachmentUploadValidationError("Lege bestanden kunnen niet worden geupload.");
  }

  if (sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentUploadValidationError("Bijlage is te groot. Maximum is 25 MB per bestand.");
  }

  const extension = detectExtension(fileName);
  if (extension && BLOCKED_EXTENSIONS.has(extension)) {
    throw new AttachmentUploadValidationError("Dit bestandstype is geblokkeerd om veiligheidsredenen.");
  }
}

export async function downloadPrivateAttachment(blobPath: string) {
  const token = assertBlobTokenConfigured();
  return get(blobPath, { access: "private", token });
}

export async function deletePrivateAttachment(blobPath: string) {
  if (canUseLocalAttachmentStorage()) {
    await rm(buildLocalAttachmentPath(blobPath), { force: true });
    return;
  }

  const token = assertBlobTokenConfigured();
  await del(blobPath, { token });
}

function assertBlobTokenConfigured() {
  const env = getServerEnv();
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new AttachmentStorageConfigError("BLOB_READ_WRITE_TOKEN ontbreekt. Configureer private blob-upload voor productiegebruik.");
  }

  return env.BLOB_READ_WRITE_TOKEN;
}

function canUseLocalAttachmentStorage() {
  return process.env.NODE_ENV !== "production";
}

function buildLocalAttachmentPath(blobPath: string) {
  return path.join(LOCAL_ATTACHMENT_ROOT, ...blobPath.split("/").filter(Boolean));
}

function localBlobUrl(blobPath: string) {
  return `local://${blobPath}`;
}

function isLocalBlobUrl(blobUrl: string) {
  return blobUrl.startsWith("local://");
}

function localBlobPathFromUrl(blobUrl: string) {
  return blobUrl.slice("local://".length);
}

export async function uploadPrivateAttachment(input: {
  userId: string;
  sourceFolder: string;
  fileName: string;
  contentType: string | null;
  bytes: Buffer;
}) {
  const fileName = sanitizePathSegment(input.fileName);
  ensureUploadAllowed(fileName, input.bytes.byteLength);

  const blobPath = `users/${sanitizePathSegment(input.userId)}/${sanitizePathSegment(input.sourceFolder)}/${Date.now()}-${fileName}`;

  if (canUseLocalAttachmentStorage()) {
    const localPath = buildLocalAttachmentPath(blobPath);
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, input.bytes);

    return {
      blobPath,
      blobUrl: localBlobUrl(blobPath),
      sizeBytes: input.bytes.byteLength,
    };
  }

  const token = assertBlobTokenConfigured();
  const upload = await put(blobPath, input.bytes, {
    access: "private",
    addRandomSuffix: true,
    contentType: input.contentType ?? undefined,
    token,
  });

  return {
    blobPath: upload.pathname,
    blobUrl: upload.url,
    sizeBytes: input.bytes.byteLength,
  };
}

export async function deleteUploadedBlobs(blobUrls: string[]) {
  const uniqueUrls = [...new Set(blobUrls.filter((value) => value.trim().length > 0))];
  if (uniqueUrls.length === 0) return;

  const localPaths = uniqueUrls.filter(isLocalBlobUrl).map((blobUrl) => buildLocalAttachmentPath(localBlobPathFromUrl(blobUrl)));
  const remoteUrls = uniqueUrls.filter((blobUrl) => !isLocalBlobUrl(blobUrl));

  await Promise.all(
    localPaths.map(async (localPath) => {
      await rm(localPath, { force: true });
    }),
  );

  if (remoteUrls.length > 0) {
    const token = assertBlobTokenConfigured();
    await del(remoteUrls, { token });
  }
}
