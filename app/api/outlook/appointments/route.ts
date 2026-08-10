import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import {
  getOutlookUpcomingEvents,
  OutlookCalendarConfigError,
  OutlookCalendarRequestError,
} from "@/lib/microsoft/outlook-calendar";

function parseDays(value: string | null) {
  if (!value) return 30;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 90) return 30;
  return parsed;
}

function toDateValue(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function toDayLabel(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

function toTimeLabel(startIso: string, endIso: string, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("nl-NL", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const start = formatter.format(new Date(startIso));
  const end = formatter.format(new Date(endIso));
  return `${start}-${end}`;
}

function attendeeLabel(count: number) {
  if (count <= 0) return "Geen deelnemers";
  if (count === 1) return "1 deelnemer";
  return `${count} deelnemers`;
}

export async function GET(request: Request) {
  const session = await requireUser();
  const { searchParams } = new URL(request.url);
  const daysAhead = parseDays(searchParams.get("days"));
  const timeZone = session.user.timeZone || "Europe/Amsterdam";

  try {
    const events = await getOutlookUpcomingEvents(session.user.id, daysAhead);
    const appointments = events.map((event) => ({
      id: event.id,
      dateValue: toDateValue(event.startIso, timeZone),
      day: toDayLabel(event.startIso, timeZone),
      time: toTimeLabel(event.startIso, event.endIso, timeZone),
      title: event.subject,
      location: event.location,
      attendees: attendeeLabel(event.attendeesCount),
      note: event.bodyPreview || "Geen extra toelichting.",
    }));

    return NextResponse.json({ appointments });
  } catch (error) {
    if (error instanceof OutlookCalendarConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof OutlookCalendarRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ error: "Outlook-afspraken laden mislukt." }, { status: 500 });
  }
}
