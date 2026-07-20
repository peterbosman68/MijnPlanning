import { expect, test } from "@playwright/test";

test("beschermde routes sturen een bezoeker naar de login", async ({ page }) => {
  await page.goto("/vandaag");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Inloggen bij MijnPlanning" }),
  ).toBeVisible();
});

test("Taken is zonder sessie niet rechtstreeks toegankelijk", async ({ page }) => {
  await page.goto("/taken");
  await expect(page).toHaveURL(/\/login$/);
});

test("de login past zonder horizontale overflow op desktop en mobiel", async ({
  page,
}) => {
  await page.goto("/login");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
  await expect(page.getByLabel("E-mailadres")).toBeVisible();
  await expect(page.getByLabel("Wachtwoord")).toBeVisible();
});

test("browserextensie-attributen veroorzaken geen hydrationwaarschuwing", async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().includes("A tree hydrated but some attributes")
    ) {
      hydrationErrors.push(message.text());
    }
  });
  await page.addInitScript(() => {
    const markInputs = () => {
      for (const input of document.querySelectorAll("input")) {
        input.setAttribute("data-has-listeners", "true");
      }
    };
    new MutationObserver(markInputs).observe(document, {
      childList: true,
      subtree: true,
    });
  });

  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  expect(hydrationErrors).toEqual([]);
});

test("de publieke healthroute lekt geen details en levert beveiligingsheaders", async ({
  request,
}) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toEqual({ status: "ok" });
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
});
