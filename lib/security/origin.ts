export class InvalidRequestOriginError extends Error {
  constructor() {
    super("INVALID_REQUEST_ORIGIN");
    this.name = "InvalidRequestOriginError";
  }
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",", 1)[0]?.trim() || null;
}

export function assertTrustedRequestOrigin(headers: Pick<Headers, "get">): void {
  const origin = firstHeaderValue(headers.get("origin"));
  const host =
    firstHeaderValue(headers.get("x-forwarded-host")) ??
    firstHeaderValue(headers.get("host"));

  if (!origin || !host) {
    throw new InvalidRequestOriginError();
  }

  try {
    if (new URL(origin).host !== host) {
      throw new InvalidRequestOriginError();
    }
  } catch (error) {
    if (error instanceof InvalidRequestOriginError) {
      throw error;
    }

    throw new InvalidRequestOriginError();
  }
}
