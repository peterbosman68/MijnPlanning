import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PasswordResetEmailDeliveryError,
  sendPasswordResetEmail,
} from "@/lib/email/resend";

describe("Resend-adapter voor wachtwoordherstel", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("verstuurt alleen het noodzakelijke bericht met idempotency key", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_uitsluitend_een_testwaarde");
    vi.stubEnv(
      "PASSWORD_RESET_EMAIL_FROM",
      "MijnPlanning <onboarding@resend.dev>",
    );
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, _request?: RequestInit) => {
        void _url;
        void _request;
        return new Response('{"id":"email-1"}');
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    await sendPasswordResetEmail({
      recipient: "peter@example.com",
      resetUrl:
        "https://mijnplanning.example/wachtwoord-herstellen?token=geheime-testtoken",
      requestId: "reset-1",
      expiresInMinutes: 30,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0];
    if (!request) {
      throw new Error("EXPECTED_RESEND_REQUEST");
    }
    expect(url).toBe("https://api.resend.com/emails");
    expect(request.headers).toMatchObject({
      Authorization: "Bearer re_uitsluitend_een_testwaarde",
      "Idempotency-Key": "password-reset/reset-1",
      "User-Agent": "MijnPlanning/1.0",
    });
    expect(JSON.parse(request.body as string)).toMatchObject({
      from: "MijnPlanning <onboarding@resend.dev>",
      to: ["peter@example.com"],
      subject: "Nieuw wachtwoord instellen voor MijnPlanning",
    });
  });

  it("geeft bij een providerfout alleen een vaste technische fout", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_uitsluitend_een_testwaarde");
    vi.stubEnv(
      "PASSWORD_RESET_EMAIL_FROM",
      "MijnPlanning <onboarding@resend.dev>",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("providertekst die niet mag doorlekken", { status: 403 }),
      ),
    );

    await expect(
      sendPasswordResetEmail({
        recipient: "peter@example.com",
        resetUrl:
          "https://mijnplanning.example/wachtwoord-herstellen?token=geheime-testtoken",
        requestId: "reset-1",
        expiresInMinutes: 30,
      }),
    ).rejects.toEqual(new PasswordResetEmailDeliveryError());
  });
});
