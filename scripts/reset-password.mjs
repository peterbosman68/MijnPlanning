import { PrismaClient } from "@prisma/client";
import { createInterface } from "node:readline/promises";

import { MINIMUM_PASSWORD_LENGTH } from "../lib/auth/constants.ts";
import {
  ResetPasswordError,
  resetSingleUserPassword,
} from "../lib/auth/reset-password.ts";
import { readHiddenValue } from "./terminal-input.mjs";

const prisma = new PrismaClient({ log: [] });

async function readRecoveryConfirmation() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw Object.assign(new Error(), { code: "INTERACTIVE_TERMINAL_REQUIRED" });
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write(
      "Noodherstel vervangt het wachtwoord en logt het account op alle apparaten uit.\n",
    );
    const email = await terminal.question("Account-e-mailadres: ");
    const confirmation = await terminal.question(
      "Typ HERSTEL om door te gaan: ",
    );
    return { email, confirmation };
  } finally {
    terminal.close();
  }
}

try {
  const { email, confirmation } = await readRecoveryConfirmation();
  if (confirmation !== "HERSTEL") {
    throw Object.assign(new Error(), { code: "PASSWORD_RESET_NOT_CONFIRMED" });
  }

  const newPassword = await readHiddenValue(
    `Nieuw wachtwoord, minimaal ${MINIMUM_PASSWORD_LENGTH} tekens (invoer blijft verborgen): `,
  );
  const repeatedPassword = await readHiddenValue(
    "Herhaal het nieuwe wachtwoord: ",
  );

  if (newPassword !== repeatedPassword) {
    throw Object.assign(new Error(), { code: "PASSWORD_CONFIRMATION_MISMATCH" });
  }

  const result = await resetSingleUserPassword(
    prisma,
    email ?? "",
    newPassword ?? "",
  );

  console.log(
    `Noodherstel geslaagd. ${result.revokedSessionCount} actieve sessie(s) ingetrokken en ${result.clearedThrottleCount} loginblokkade(s) gewist.`,
  );
} catch (error) {
  const safeCode =
    error instanceof ResetPasswordError
      ? error.code
      : error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "PASSWORD_RESET_FAILED";

  console.error(`Noodherstel mislukt (${safeCode}).`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
