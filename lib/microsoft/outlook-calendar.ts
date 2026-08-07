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
  const calendarId = process.env.MICROSOFT_GRAPH_CALENDAR_ID;
  const calendarPath = calendarId
    ? `/me/calendars/${encodeURIComponent(calendarId)}/calendarView`
    : "/me/calendarView";

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

export { OutlookCalendarConfigError, OutlookCalendarRequestError };
