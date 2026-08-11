import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  deletePrivateAttachment,
  findAttachmentForUser,
  deleteAttachmentRecord,
} = vi.hoisted(() => ({
  deletePrivateAttachment: vi.fn(),
  findAttachmentForUser: vi.fn(),
  deleteAttachmentRecord: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({ prisma: { name: "test-database" } }));
vi.mock("@/lib/attachments/blob-storage", () => ({ deletePrivateAttachment }));
vi.mock("@/lib/tasks/repository", () => ({
  findSubtaskForUser: vi.fn(),
  findTaskForUser: vi.fn(),
}));
vi.mock("@/lib/attachments/repository", () => ({
  createAttachmentRecord: vi.fn(),
  deleteAttachmentRecord,
  findAttachmentForUser,
  listAttachmentsForSubtask: vi.fn(),
  listAttachmentsForTask: vi.fn(),
  listAttachmentsForUser: vi.fn(),
  upsertAttachmentRecord: vi.fn(),
}));

import { deleteStoredAttachment } from "@/lib/attachments/service";

describe("bijlage verwijderen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteAttachmentRecord.mockResolvedValue({ count: 1 });
  });

  it("verwijdert eerst de private Blob en daarna de user-scoped metadata", async () => {
    findAttachmentForUser.mockResolvedValue({ id: "attachment-1", blobPath: "manual/task/task-1/image.png" });

    await expect(deleteStoredAttachment("user-1", "attachment-1")).resolves.toBe(true);

    expect(findAttachmentForUser).toHaveBeenCalledWith(expect.anything(), "user-1", "attachment-1");
    expect(deletePrivateAttachment).toHaveBeenCalledWith("manual/task/task-1/image.png");
    expect(deleteAttachmentRecord).toHaveBeenCalledWith(expect.anything(), "user-1", "attachment-1");
    expect(deletePrivateAttachment.mock.invocationCallOrder[0]).toBeLessThan(
      deleteAttachmentRecord.mock.invocationCallOrder[0],
    );
  });

  it("laat metadata staan wanneer Blob-verwijdering mislukt", async () => {
    findAttachmentForUser.mockResolvedValue({ id: "attachment-1", blobPath: "manual/task/task-1/image.png" });
    deletePrivateAttachment.mockRejectedValue(new Error("Blob niet bereikbaar"));

    await expect(deleteStoredAttachment("user-1", "attachment-1")).rejects.toThrow("Blob niet bereikbaar");
    expect(deleteAttachmentRecord).not.toHaveBeenCalled();
  });

  it("verwijdert bij een externe link alleen de metadata", async () => {
    findAttachmentForUser.mockResolvedValue({ id: "attachment-2", blobPath: null, sourceUrl: "https://example.test/file" });

    await expect(deleteStoredAttachment("user-1", "attachment-2")).resolves.toBe(true);

    expect(deletePrivateAttachment).not.toHaveBeenCalled();
    expect(deleteAttachmentRecord).toHaveBeenCalledWith(expect.anything(), "user-1", "attachment-2");
  });

  it("doet niets wanneer de bijlage niet van de gebruiker is", async () => {
    findAttachmentForUser.mockResolvedValue(null);

    await expect(deleteStoredAttachment("user-1", "attachment-other-user")).resolves.toBe(false);

    expect(deletePrivateAttachment).not.toHaveBeenCalled();
    expect(deleteAttachmentRecord).not.toHaveBeenCalled();
  });
});
