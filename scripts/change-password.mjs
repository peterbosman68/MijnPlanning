import { PrismaClient } from "@prisma/client";

import {
  ChangePasswordError,
  changeSingleUserPassword,
} from "../lib/auth/change-password.ts";
import { MINIMUM_PASSWORD_LENGTH } from "../lib/auth/constants.ts";
import { readHiddenValue } from "./terminal-input.mjs";

const prisma = new PrismaClient({ log: [] });

try {
  const currentPassword = await readHiddenValue(
    "Huidig wachtwoord (invoer blijft verborgen): ",
  );
  const newPassword = await readHiddenValue(
    `Nieuw wachtwoord, minimaal ${MINIMUM_PASSWORD_LENGTH} tekens (invoer blijft verborgen): `,
  );
  const confirmation = await readHiddenValue("Herhaal het nieuwe wachtwoord: ");

  if (newPassword !== confirmation) {
    throw Object.assign(new Error(), { code: "PASSWORD_CONFIRMATION_MISMATCH" });
  }

  const result = await changeSingleUserPassword(
    prisma,
    currentPassword ?? "",
    newPassword ?? "",
  );

  console.log(
    `Wachtwoord gewijzigd. ${result.revokedSessionCount} actieve sessie(s) ingetrokken.`,
  );
} catch (error) {
  const safeCode =
    error instanceof ChangePasswordError
      ? error.code
      : error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "PASSWORD_CHANGE_FAILED";

  console.error(`Wachtwoord wijzigen mislukt (${safeCode}).`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
