-- CreateTable
CREATE TABLE "task_attachments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "subtaskId" TEXT,
    "blobPath" TEXT,
    "sourceUrl" TEXT,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "sourceExternalId" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_import_batches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "microsoftConnectionId" TEXT NOT NULL,
    "sourceLists" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todo_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_import_items" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "externalListId" TEXT NOT NULL,
    "externalTaskId" TEXT NOT NULL,
    "targetTaskId" TEXT,
    "sourceHash" TEXT NOT NULL,
    "importedAttachmentCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todo_import_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tasks_userId_sourceExternalId_key" ON "tasks"("userId", "sourceExternalId");
CREATE UNIQUE INDEX "task_attachments_userId_sourceExternalId_key" ON "task_attachments"("userId", "sourceExternalId");
CREATE INDEX "task_attachments_userId_taskId_idx" ON "task_attachments"("userId", "taskId");
CREATE INDEX "task_attachments_userId_subtaskId_idx" ON "task_attachments"("userId", "subtaskId");
CREATE INDEX "task_attachments_taskId_idx" ON "task_attachments"("taskId");
CREATE INDEX "task_attachments_subtaskId_idx" ON "task_attachments"("subtaskId");
CREATE INDEX "todo_import_batches_userId_startedAt_idx" ON "todo_import_batches"("userId", "startedAt");
CREATE INDEX "todo_import_batches_microsoftConnectionId_idx" ON "todo_import_batches"("microsoftConnectionId");
CREATE UNIQUE INDEX "todo_import_batches_one_running_per_user_key" ON "todo_import_batches"("userId") WHERE "status" = 'RUNNING';
CREATE UNIQUE INDEX "todo_import_items_externalListId_externalTaskId_key" ON "todo_import_items"("externalListId", "externalTaskId");
CREATE INDEX "todo_import_items_importBatchId_idx" ON "todo_import_items"("importBatchId");
CREATE INDEX "todo_import_items_targetTaskId_idx" ON "todo_import_items"("targetTaskId");
CREATE INDEX "todo_import_items_sourceHash_idx" ON "todo_import_items"("sourceHash");

-- AddCheckConstraint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_exactly_one_target_check"
CHECK (("taskId" IS NOT NULL)::integer + ("subtaskId" IS NOT NULL)::integer = 1);
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_exactly_one_location_check"
CHECK (("blobPath" IS NOT NULL)::integer + ("sourceUrl" IS NOT NULL)::integer = 1);
ALTER TABLE "todo_import_batches" ADD CONSTRAINT "todo_import_batches_status_check"
CHECK ("status" IN ('RUNNING', 'COMPLETED', 'FAILED'));
ALTER TABLE "todo_import_items" ADD CONSTRAINT "todo_import_items_status_check"
CHECK ("status" IN ('IMPORTED', 'SKIPPED'));

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "subtasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "todo_import_batches" ADD CONSTRAINT "todo_import_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "todo_import_items" ADD CONSTRAINT "todo_import_items_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "todo_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "todo_import_items" ADD CONSTRAINT "todo_import_items_targetTaskId_fkey" FOREIGN KEY ("targetTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;