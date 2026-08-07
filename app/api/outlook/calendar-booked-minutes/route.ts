import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import {
  getOutlookBookedMinutesForDate,
  OutlookCalendarConfigError,
  OutlookCalendarRequestError,
} from "@/lib/microsoft/outlook-calendar";

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: Request) {
  const user = await requireUser();

  const { searchParams } = new URL(request.url);
  const dateValue = searchParams.get("date")?.trim() ?? "";

  if (!isIsoDate(dateValue)) {
    return NextResponse.json({ error: "Ongeldige datumparameter." }, { status: 400 });
  }

  try {
    const bookedMinutes = await getOutlookBookedMinutesForDate(dateValue, user.user.id);
    return NextResponse.json({ dateValue, bookedMinutes });
  } catch (error) {
    if (error instanceof OutlookCalendarConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof OutlookCalendarRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ error: "Outlook-agenda controle mislukt." }, { status: 500 });
  }
}
