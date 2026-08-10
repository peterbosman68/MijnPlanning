import "server-only";

import { getValidAccessToken } from "./token-service";

class OutlookCalendarConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutlookCalendarConfigError";
  }
}

class OutlookCalendarRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutlookCalendarRequestError";
  }
}

function nextDateValue(dateValue: string) {
  const parsed = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10);
}

function toIsoUtc(dateValue: string) {
  return `${dateValue}T00:00:00Z`;
}

function overlapMinutes(
  eventStartIso: string,
  eventEndIso: string,
  windowStartMs: number,
  windowEndMs: number,
) {
  const eventStartMs = new Date(eventStartIso).getTime();
  const eventEndMs = new Date(eventEndIso).getTime();

  if (Number.isNaN(eventStartMs) || Number.isNaN(eventEndMs)) return 0;
  if (eventEndMs <= eventStartMs) return 0;

  const startMs = Math.max(eventStartMs, windowStartMs);
  const endMs = Math.min(eventEndMs, windowEndMs);
  if (endMs <= startMs) return 0;

  return Math.round((endMs - startMs) / (1000 * 60));
}

export type OutlookUpcomingEvent = {
  id: string;
  startIso: string;
  endIso: string;
  subject: string;
  location: string;
  attendeesCount: number;
  bodyPreview: string;
};

function calendarViewPath() {
  const calendarId = process.env.MICROSOFT_GRAPH_CALENDAR_ID;
  return calendarId
    ? `/me/calendars/${encodeURIComponent(calendarId)}/calendarView`
    : "/me/calendarView";
}

export async function getOutlookBookedMinutesForDate(dateValue: string, userId: string) {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(userId);
  } catch {
    throw new OutlookCalendarConfigError("Outlook-agenda is niet gekoppeld of geconfigureerd.");
  }

  const startDateTime = toIsoUtc(dateValue);
  const endDateTime = toIsoUtc(nextDateValue(dateValue));
  const encodedStart = encodeURIComponent(startDateTime);
  const encodedEnd = encodeURIComponent(endDateTime);
  const calendarPath = calendarViewPath();

  const endpoint =
    `https://graph.microsoft.com/v1.0${calendarPath}` +
    `?startDateTime=${encodedStart}&endDateTime=${encodedEnd}&$select=start,end,isCancelled,showAs`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      Prefer: 'outlook.timezone="UTC"',
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new OutlookCalendarRequestError("Outlook-agenda kon niet worden uitgelezen.");
  }

  const payload = (await response.json()) as {
    value?: Array<{
      isCancelled?: boolean;
      showAs?: string;
      start?: { dateTime?: string };
      end?: { dateTime?: string };
    }>;
  };

  const events = Array.isArray(payload.value) ? payload.value : [];
  const windowStartMs = new Date(startDateTime).getTime();
  const windowEndMs = new Date(endDateTime).getTime();

  return events.reduce((sum, event) => {
    if (event.isCancelled) return sum;
    if (event.showAs && ["free", "workingElsewhere"].includes(event.showAs.toLowerCase())) {
      return sum;
    }

    const eventStart = event.start?.dateTime;
    const eventEnd = event.end?.dateTime;
    if (!eventStart || !eventEnd) return sum;

    return sum + overlapMinutes(eventStart, eventEnd, windowStartMs, windowEndMs);
  }, 0);
}

export async function getOutlookUpcomingEvents(userId: string, daysAhead = 30): Promise<OutlookUpcomingEvent[]> {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(userId);
  } catch {
    throw new OutlookCalendarConfigError("Outlook-agenda is niet gekoppeld of geconfigureerd.");
  }

  const now = new Date();
  const end = new Date(now.getTime() + Math.max(1, daysAhead) * 24 * 60 * 60 * 1000);
  const encodedStart = encodeURIComponent(now.toISOString());
  const encodedEnd = encodeURIComponent(end.toISOString());
  const endpoint =
    `https://graph.microsoft.com/v1.0${calendarViewPath()}` +
    `?startDateTime=${encodedStart}&endDateTime=${encodedEnd}` +
    "&$orderby=start/dateTime" +
    "&$select=id,subject,start,end,isCancelled,showAs,location,attendees,bodyPreview" +
    "&$top=200";

  type GraphCalendarEvent = {
    id?: string;
    subject?: string;
    bodyPreview?: string;
    isCancelled?: boolean;
    showAs?: string;
    location?: { displayName?: string };
    attendees?: Array<unknown>;
    start?: { dateTime?: string };
    end?: { dateTime?: string };
  };

  const allEvents: GraphCalendarEvent[] = [];
  let nextUrl: string | undefined = endpoint;
  let pageCount = 0;

  while (nextUrl && pageCount < 10 && allEvents.length < 1000) {
    const response = await fetch(nextUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        Prefer: 'outlook.timezone="UTC"',
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new OutlookCalendarRequestError("Outlook-afspraken konden niet worden uitgelezen.");
    }

    const payload = (await response.json()) as {
      value?: GraphCalendarEvent[];
      "@odata.nextLink"?: string;
    };

    if (Array.isArray(payload.value)) {
      allEvents.push(...payload.value);
    }

    nextUrl = payload["@odata.nextLink"];
    pageCount += 1;
  }

  const nowMs = now.getTime();
  const events = allEvents;

  return events
    .filter((event) => {
      if (!event.id) return false;
      if (!event.start?.dateTime || !event.end?.dateTime) return false;
      if (event.isCancelled) return false;
      if (event.showAs && ["free", "workingElsewhere"].includes(event.showAs.toLowerCase())) return false;
      const endMs = new Date(event.end.dateTime).getTime();
      return Number.isFinite(endMs) && endMs >= nowMs;
    })
    .map((event) => ({
      id: event.id as string,
      startIso: event.start?.dateTime as string,
      endIso: event.end?.dateTime as string,
      subject: event.subject?.trim() || "(Zonder titel)",
      location: event.location?.displayName?.trim() || "Geen locatie",
      attendeesCount: Array.isArray(event.attendees) ? event.attendees.length : 0,
      bodyPreview: event.bodyPreview?.trim() || "",
    }))
    .sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime());
}

export { OutlookCalendarConfigError, OutlookCalendarRequestError };
