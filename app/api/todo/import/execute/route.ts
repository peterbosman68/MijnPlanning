import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import {
  executeTodoImport,
  MicrosoftTodoConfigError,
  MicrosoftTodoImportConflictError,
  MicrosoftTodoRequestError,
} from "@/lib/microsoft/todo-import";
import { assertTrustedRequestOrigin, InvalidRequestOriginError } from "@/lib/security/origin";

export const executeTodoImportPayloadSchema = z.object({
  confirmOneTimeImport: z.literal(true),
  selectedSourceExternalIds: z
    .array(z.string().trim().min(1).max(1_000))
    .min(1)
    .max(5_000)
    .refine((items) => new Set(items).size === items.length, "De taakselectie bevat dubbele items."),
}).strict();

export async function POST(request: Request) {
  const session = await requireUser();

  try {
    assertTrustedRequestOrigin(await headers());
  } catch (error) {
    if (error instanceof InvalidRequestOriginError) {
      return NextResponse.json({ error: "Ongeldige request-origin." }, { status: 403 });
    }
    return NextResponse.json({ error: "Origin-validatie mislukt." }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON-payload." }, { status: 400 });
  }

  const parsedPayload = executeTodoImportPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return NextResponse.json(
      { error: "Bevestig de import en selecteer minimaal één geldige To Do-taak." },
      { status: 400 },
    );
  }

  try {
    const result = await executeTodoImport(
      session.user.id,
      parsedPayload.data.selectedSourceExternalIds,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MicrosoftTodoConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof MicrosoftTodoRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    if (error instanceof MicrosoftTodoImportConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "To Do import uitvoeren mislukt." }, { status: 500 });
  }
}
