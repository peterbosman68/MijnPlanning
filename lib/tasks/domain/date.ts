import { AMSTERDAM_TIME_ZONE } from "./types";

type DateTimeParts = Readonly<{
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}>;

const amsterdamPartsFormatter = new Intl.DateTimeFormat("nl-NL", {
  timeZone: AMSTERDAM_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const amsterdamLabelFormatter = new Intl.DateTimeFormat("nl-NL", {
  timeZone: AMSTERDAM_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

function parseDateLocal(value: string): DateTimeParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: 0,
    minute: 0,
  };
}

function parseTimeLocal(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function formatParts(date: Date): DateTimeParts {
  const parts = amsterdamPartsFormatter.formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) => {
    const match = parts.find((part) => part.type === type);

    if (!match?.value) {
      throw new Error("DATE_FORMAT_FAILED");
    }

    return Number(match.value);
  };

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
  };
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function toComparableMinutes(parts: DateTimeParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

export function formatAmsterdamDateTimeLabel(date: Date): string {
  return amsterdamLabelFormatter.format(date);
}

export function formatAmsterdamDateInput(date: Date): string {
  const parts = formatParts(date);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function formatAmsterdamTimeInput(date: Date): string {
  const parts = formatParts(date);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function parseAmsterdamDateTimeInput(
  dateValue: string,
  timeValue: string | null | undefined,
  defaultTime = "17:00",
): Date | null {
  const dateParts = parseDateLocal(dateValue);

  if (!dateParts) {
    return null;
  }

  const timeParts = parseTimeLocal(timeValue ?? defaultTime);

  if (!timeParts) {
    throw new Error("INVALID_TIME_VALUE");
  }

  const expected = {
    year: dateParts.year,
    month: dateParts.month,
    day: dateParts.day,
    hour: timeParts.hour,
    minute: timeParts.minute,
  } satisfies DateTimeParts;

  let utcMillis = Date.UTC(
    expected.year,
    expected.month - 1,
    expected.day,
    expected.hour,
    expected.minute,
  );

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const actual = formatParts(new Date(utcMillis));

    if (
      actual.year === expected.year &&
      actual.month === expected.month &&
      actual.day === expected.day &&
      actual.hour === expected.hour &&
      actual.minute === expected.minute
    ) {
      return new Date(utcMillis);
    }

    utcMillis -= toComparableMinutes(actual) - toComparableMinutes(expected);
  }

  throw new Error("AMSTERDAM_DATETIME_CONVERSION_FAILED");
}
