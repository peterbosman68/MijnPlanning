import { describe, expect, it } from "vitest";

import {
  AttachmentUploadValidationError,
  ensureUploadAllowed,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments/blob-storage";

describe("bijlage-uploadvalidatie", () => {
  it("accepteert een normaal document binnen de limiet", () => {
    expect(() => ensureUploadAllowed("planning.pdf", 1024)).not.toThrow();
  });

  it("weigert lege bestanden en bestanden boven 25 MB", () => {
    expect(() => ensureUploadAllowed("leeg.pdf", 0)).toThrow(AttachmentUploadValidationError);
    expect(() => ensureUploadAllowed("groot.pdf", MAX_ATTACHMENT_BYTES + 1)).toThrow(
      AttachmentUploadValidationError,
    );
  });

  it.each(["script.js", "installer.exe", "opdracht.ps1", "macro.vbs"])(
    "weigert het risicovolle bestandstype %s",
    (fileName) => {
      expect(() => ensureUploadAllowed(fileName, 1024)).toThrow(AttachmentUploadValidationError);
    },
  );
});