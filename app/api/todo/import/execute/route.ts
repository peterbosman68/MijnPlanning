import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import {
  executeTodoImport,
  MicrosoftTodoConfigError,
  MicrosoftTodoRequestError,
} from "@/lib/microsoft/todo-import";
import { assertTrustedRequestOrigin, InvalidRequestOriginError } from "@/lib/security/origin";

type ExecutePayload = {
  replaceExistingTasks?: boolean;
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

  if (payload.replaceExistingTasks !== true) {
    return NextResponse.json(
      { error: "replaceExistingTasks=true is verplicht voor deze importmodus." },
      { status: 400 },
    );
  }

  try {
    const result = await executeTodoImport(session.user.id, true);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MicrosoftTodoConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof MicrosoftTodoRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ error: "To Do import uitvoeren mislukt." }, { status: 500 });
  }
}
