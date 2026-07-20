import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: [] });

try {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log("Databaseverbinding: geslaagd");

  if (process.argv.includes("--assert-clean-foundation")) {
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;

    const tableNames = Array.isArray(tables)
      ? tables.map((table) => table.table_name)
      : [];
    const unexpectedTables = tableNames.filter(
      (tableName) => tableName !== "_prisma_migrations",
    );
    if (unexpectedTables.length !== 0) {
      throw Object.assign(new Error(), { code: "DATABASE_HAS_TEMPORARY_TABLES" });
    }

    if (tableNames.includes("_prisma_migrations")) {
      const migrationRows = await prisma.$queryRaw`
        SELECT COUNT(*)::integer AS count
        FROM "_prisma_migrations"
      `;
      if (migrationRows[0]?.count !== 0) {
        throw Object.assign(new Error(), { code: "MIGRATION_HISTORY_NOT_EMPTY" });
      }
    }

    console.log("Schone Prisma-databasebasis: bevestigd");
  }

  if (process.argv.includes("--assert-auth-foundation")) {
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;
    const expectedTables = [
      "_prisma_migrations",
      "auth_throttles",
      "sessions",
      "users",
    ];
    const tableNames = Array.isArray(tables)
      ? tables.map((table) => table.table_name).sort()
      : [];

    if (JSON.stringify(tableNames) !== JSON.stringify(expectedTables)) {
      throw Object.assign(new Error(), { code: "UNEXPECTED_AUTH_FOUNDATION_TABLES" });
    }

    const migrationRows = await prisma.$queryRaw`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
        AND rolled_back_at IS NULL
    `;
    if (
      migrationRows.length !== 1 ||
      migrationRows[0]?.migration_name !== "20260720120000_auth_foundation"
    ) {
      throw Object.assign(new Error(), { code: "UNEXPECTED_MIGRATION_HISTORY" });
    }

    const [users, sessions, throttles] = await Promise.all([
      prisma.user.count(),
      prisma.session.count(),
      prisma.authThrottle.count(),
    ]);
    if (users !== 0 || sessions !== 0 || throttles !== 0) {
      throw Object.assign(new Error(), { code: "AUTH_FOUNDATION_NOT_EMPTY" });
    }

    console.log("Authfundament en lege datastaat: bevestigd");
  }
} catch (error) {
  const safeCode =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "UNKNOWN_ERROR";

  console.error(`Databaseverbinding: mislukt (${safeCode})`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
