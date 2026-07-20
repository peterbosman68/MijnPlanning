export function getSessionCookieName(isProduction: boolean): string {
  return isProduction
    ? "__Host-mijnplanning_session"
    : "mijnplanning_session";
}

export function getSessionCookieOptions(
  expiresAt: Date,
  isProduction: boolean,
) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    expires: expiresAt,
  };
}
