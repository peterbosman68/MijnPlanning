import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createInterface } from "node:readline/promises";

import { MINIMUM_PASSWORD_LENGTH } from "../lib/auth/constants.ts";
import { hashPassword } from "../lib/auth/password.ts";
import { readHiddenValue } from "./terminal-input.mjs";

const prisma = new PrismaClient({ log: [] });

const inputSchema = z.object({
  email: z.string().trim().max(320).email().transform((value) => value.toLowerCase()),
  password: z.string().min(MINIMUM_PASSWORD_LENGTH).max(1024),
});

async function readEmailFromTerminal() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return undefined;
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await terminal.question("E-mailadres: ");
  } finally {
    terminal.close();
  }
}

try {
  const passwordFromEnvironment =
    process.env.MIJNPLANNING_BOOTSTRAP_PASSWORD !== undefined;
  const rawEmail =
    process.env.MIJNPLANNING_BOOTSTRAP_EMAIL ?? (await readEmailFromTerminal());
  const rawPassword =
    process.env.MIJNPLANNING_BOOTSTRAP_PASSWORD ??
    (await readHiddenValue("Wachtwoord (invoer blijft verborgen): "));
  delete process.env.MIJNPLANNING_BOOTSTRAP_EMAIL;
  delete process.env.MIJNPLANNING_BOOTSTRAP_PASSWORD;

  if (!passwordFromEnvironment && process.stdin.isTTY) {
    const confirmation = await readHiddenValue("Herhaal het wachtwoord: ");
    if (rawPassword !== confirmation) {
      throw Object.assign(new Error(), { code: "PASSWORD_CONFIRMATION_MISMATCH" });
    }
  }

  const input = inputSchema.parse({ email: rawEmail, password: rawPassword });
  const existingUserCount = await prisma.user.count();

  if (existingUserCount !== 0) {
    throw Object.assign(new Error(), { code: "USER_ALREADY_EXISTS" });
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      timeZone: "Europe/Amsterdam",
    },
  });

  console.log("Eerste gebruiker aangemaakt.");
} catch (error) {
  const safeCode =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : error instanceof z.ZodError
        ? "INVALID_BOOTSTRAP_INPUT"
        : "USER_CREATION_FAILED";

  console.error(`Gebruiker aanmaken mislukt (${safeCode}).`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
