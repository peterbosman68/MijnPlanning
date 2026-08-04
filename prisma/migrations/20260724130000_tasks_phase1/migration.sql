CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'WAITING', 'COMPLETED', 'ARCHIVED', 'CANCELLED');
CREATE TYPE "SubtaskStatus" AS ENUM ('OPEN', 'WAITING', 'COMPLETED', 'ARCHIVED', 'CANCELLED');
CREATE TYPE "TaskSourceType" AS ENUM ('MANUAL', 'IMPORTED');
CREATE TYPE "DependencyType" AS ENUM ('FINISH_TO_START');

CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionOriginal" TEXT NOT NULL DEFAULT '',
    "descriptionPlain" TEXT NOT NULL DEFAULT '',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "deadline" TIMESTAMP(3),
    "estimatedMinutes" INTEGER,
    "remainingMinutes" INTEGER,
    "sourceType" "TaskSourceType" NOT NULL DEFAULT 'MANUAL',
    "sourceExternalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tasks_estimatedMinutes_positive" CHECK ("estimatedMinutes" IS NULL OR "estimatedMinutes" > 0),
    CONSTRAINT "tasks_remainingMinutes_nonnegative" CHECK ("remainingMinutes" IS NULL OR "remainingMinutes" >= 0)
);

CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionOriginal" TEXT NOT NULL DEFAULT '',
    "descriptionPlain" TEXT NOT NULL DEFAULT '',
    "deadline" TIMESTAMP(3) NOT NULL,
    "earliestStart" TIMESTAMP(3),
    "estimatedMinutes" INTEGER NOT NULL,
    "remainingMinutes" INTEGER NOT NULL,
    "minimumBlockMinutes" INTEGER NOT NULL DEFAULT 15,
    "splittable" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER,
    "context" TEXT,
    "status" "SubtaskStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subtasks_estimatedMinutes_positive" CHECK ("estimatedMinutes" > 0),
    CONSTRAINT "subtasks_remainingMinutes_nonnegative" CHECK ("remainingMinutes" >= 0),
    CONSTRAINT "subtasks_minimumBlockMinutes_positive" CHECK ("minimumBlockMinutes" > 0)
);

CREATE TABLE "task_dependencies" (
    "id" TEXT NOT NULL,
    "subtaskId" TEXT NOT NULL,
    "dependsOnSubtaskId" TEXT NOT NULL,
    "dependencyType" "DependencyType" NOT NULL DEFAULT 'FINISH_TO_START',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "task_dependencies_no_self_dependency" CHECK ("subtaskId" <> "dependsOnSubtaskId")
);

CREATE INDEX "tasks_userId_status_idx" ON "tasks"("userId", "status");
CREATE INDEX "tasks_userId_deadline_idx" ON "tasks"("userId", "deadline");
CREATE INDEX "tasks_updatedAt_idx" ON "tasks"("updatedAt");
CREATE INDEX "subtasks_taskId_status_idx" ON "subtasks"("taskId", "status");
CREATE INDEX "subtasks_deadline_idx" ON "subtasks"("deadline");
CREATE INDEX "subtasks_status_deadline_idx" ON "subtasks"("status", "deadline");
CREATE INDEX "task_dependencies_dependsOnSubtaskId_idx" ON "task_dependencies"("dependsOnSubtaskId");
CREATE UNIQUE INDEX "task_dependencies_subtaskId_dependsOnSubtaskId_key"
    ON "task_dependencies"("subtaskId", "dependsOnSubtaskId");

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subtasks"
ADD CONSTRAINT "subtasks_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "tasks"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_dependencies"
ADD CONSTRAINT "task_dependencies_subtaskId_fkey"
FOREIGN KEY ("subtaskId") REFERENCES "subtasks"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_dependencies"
ADD CONSTRAINT "task_dependencies_dependsOnSubtaskId_fkey"
FOREIGN KEY ("dependsOnSubtaskId") REFERENCES "subtasks"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION "tasks_enforce_deadline_hierarchy"()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'subtasks' THEN
    IF NEW."deadline" IS NOT NULL AND EXISTS (
      SELECT 1
      FROM "tasks" t
      WHERE t."id" = NEW."taskId"
        AND t."deadline" IS NOT NULL
        AND NEW."deadline" > t."deadline"
    ) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'SUBTASK_DEADLINE_AFTER_TASK_DEADLINE';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'tasks' THEN
    IF NEW."deadline" IS NOT NULL AND EXISTS (
      SELECT 1
      FROM "subtasks" s
      WHERE s."taskId" = NEW."id"
        AND s."deadline" > NEW."deadline"
    ) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'TASK_DEADLINE_CONFLICT';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "tasks_deadline_hierarchy_trigger"
BEFORE INSERT OR UPDATE OF "deadline" ON "tasks"
FOR EACH ROW EXECUTE FUNCTION "tasks_enforce_deadline_hierarchy"();

CREATE TRIGGER "subtasks_deadline_hierarchy_trigger"
BEFORE INSERT OR UPDATE OF "deadline", "taskId" ON "subtasks"
FOR EACH ROW EXECUTE FUNCTION "tasks_enforce_deadline_hierarchy"();
