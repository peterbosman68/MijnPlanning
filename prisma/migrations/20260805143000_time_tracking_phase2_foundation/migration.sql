ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'WAITING_EXTERNAL';

ALTER TYPE "SubtaskStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "SubtaskStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "SubtaskStatus" ADD VALUE IF NOT EXISTS 'WAITING_EXTERNAL';

CREATE TYPE "TimeSessionType" AS ENUM ('ACTIVE', 'PAUSED', 'INTERRUPTED', 'WAITING_EXTERNAL');
CREATE TYPE "InterruptionReason" AS ENUM ('CONTEXT_SWITCH', 'MEETING', 'BREAK', 'DISTRACTION', 'TECHNICAL_ISSUE', 'OTHER');

CREATE TABLE "time_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "subtaskId" TEXT,
    "sessionType" "TimeSessionType" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "activeSeconds" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "interruptionReason" "InterruptionReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "time_sessions_activeSeconds_nonnegative" CHECK ("activeSeconds" >= 0),
    CONSTRAINT "time_sessions_time_order" CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt"),
    CONSTRAINT "time_sessions_scope_xor" CHECK (
      (("taskId" IS NOT NULL)::int + ("subtaskId" IS NOT NULL)::int) = 1
    )
);

CREATE INDEX "time_sessions_userId_startedAt_idx" ON "time_sessions"("userId", "startedAt");
CREATE INDEX "time_sessions_taskId_startedAt_idx" ON "time_sessions"("taskId", "startedAt");
CREATE INDEX "time_sessions_subtaskId_startedAt_idx" ON "time_sessions"("subtaskId", "startedAt");

CREATE UNIQUE INDEX "time_sessions_single_open_session_per_user_idx"
    ON "time_sessions"("userId")
    WHERE "endedAt" IS NULL;

ALTER TABLE "time_sessions"
ADD CONSTRAINT "time_sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "time_sessions"
ADD CONSTRAINT "time_sessions_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "tasks"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "time_sessions"
ADD CONSTRAINT "time_sessions_subtaskId_fkey"
FOREIGN KEY ("subtaskId") REFERENCES "subtasks"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
