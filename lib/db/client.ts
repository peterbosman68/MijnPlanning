import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  mijnPlanningPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.mijnPlanningPrisma ??
  new PrismaClient({
    log: [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.mijnPlanningPrisma = prisma;
}
