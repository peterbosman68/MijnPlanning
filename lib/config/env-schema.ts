import { z } from "zod";

const databaseUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "DATABASE_URL moet een PostgreSQL-URL zijn.",
  );

export const serverEnvSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  SESSION_SECRET: z.string().min(32).max(512),
  MICROSOFT_CLIENT_ID: z.string().min(10).optional(),
  MICROSOFT_CLIENT_SECRET: z.string().min(10).optional(),
  MICROSOFT_TOKEN_ENCRYPTION_KEY: z.string().length(64).optional(),
  // Legacy: handmatig token voor Graph Explorer tests
  MICROSOFT_GRAPH_ACCESS_TOKEN: z.string().min(20).optional(),
  MICROSOFT_GRAPH_CALENDAR_ID: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  input: Record<string, string | undefined>,
): ServerEnv {
  return serverEnvSchema.parse(input);
}
