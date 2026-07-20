import "server-only";

import { randomUUID } from "node:crypto";

type LogLevel = "info" | "warn" | "error";

type SafeLogEntry = Readonly<{
  code: string;
  correlationId?: string;
  route?: string;
  status?: string;
  retryCount?: number;
}>;

function write(level: LogLevel, entry: SafeLogEntry): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    correlationId: entry.correlationId ?? randomUUID(),
    code: entry.code,
    route: entry.route,
    status: entry.status,
    retryCount: entry.retryCount,
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export const logger = {
  info: (entry: SafeLogEntry) => write("info", entry),
  warn: (entry: SafeLogEntry) => write("warn", entry),
  error: (entry: SafeLogEntry) => write("error", entry),
};
