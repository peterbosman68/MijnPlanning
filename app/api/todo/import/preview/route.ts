import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import {
  MicrosoftTodoConfigError,
  MicrosoftTodoRequestError,
  previewTodoImport,
} from "@/lib/microsoft/todo-import";

export async function GET() {
  const session = await requireUser();

  try {
    const preview = await previewTodoImport(session.user.id);
    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof MicrosoftTodoConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof MicrosoftTodoRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ error: "To Do preview ophalen mislukt." }, { status: 500 });
  }
}
