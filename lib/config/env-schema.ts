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
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  input: Record<string, string | undefined>,
): ServerEnv {
  return serverEnvSchema.parse(input);
}
