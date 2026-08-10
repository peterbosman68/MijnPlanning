import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import {
  executeTodoImport,
  MicrosoftTodoConfigError,
  MicrosoftTodoImportConflictError,
  MicrosoftTodoRequestError,
} from "@/lib/microsoft/todo-import";
import { assertTrustedRequestOrigin, InvalidRequestOriginError } from "@/lib/security/origin";

type ExecutePayload = {
  confirmOneTimeImport?: boolean;
};

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

  let payload: ExecutePayload = {};
  try {
    payload = (await request.json()) as ExecutePayload;
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON-payload." }, { status: 400 });
  }

  if (payload.confirmOneTimeImport !== true) {
    return NextResponse.json(
      { error: "Bevestig de eenmalige import expliciet." },
      { status: 400 },
    );
  }

  try {
    const result = await executeTodoImport(session.user.id);
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
