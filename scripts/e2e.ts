/**
 * Mobile-width end-to-end walk of the demo loop in an isolated browser profile.
 * Requires the dev server: npm run dev
 *
 *   npm run e2e
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const username = `e2e_${Date.now().toString().slice(-8)}`;

function cachedChromium(): string | undefined {
  const local = process.env.LOCALAPPDATA;
  if (!local) return undefined;
  const candidate = path.join(
    local,
    "ms-playwright",
    "chromium-1248",
    "chrome-win64",
    "chrome.exe",
  );
  return existsSync(candidate) ? candidate : undefined;
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`ok - ${message}`);
}

async function main() {
  const executablePath = cachedChromium();
  const browser = await chromium.launch(
    executablePath ? { executablePath } : {},
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: "Africa/Lagos",
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`${base}/signup`);
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill("sabilab12345");
  await page.getByLabel("Password again", { exact: true }).fill("sabilab12345");
  await page.locator('input[name="consent"]').check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/home", { timeout: 40_000 });
  assert(
    await page.getByRole("heading", { name: /Hello/ }).isVisible(),
    "sign-up lands on My page",
  );

  await page.getByRole("link", { name: "Start a session" }).first().click();
  await page.waitForURL("**/start/adaeze-fabrics");
  assert(
    await page.getByRole("heading", { name: "Adaeze's Fabrics" }).isVisible(),
    "scenario setup opens",
  );

  await page.getByRole("button", { name: "Take my brief" }).click();
  console.log("started session");
  await page.waitForURL(/\/session\/.+\/brief/, { timeout: 30_000 });
  assert(
    await page.getByText("Your private brief").isVisible(),
    "private brief renders",
  );

  await page.getByRole("button", { name: "Enter the workspace" }).click();
  await page.waitForURL(/\/session\/.+\/workspace/, { timeout: 30_000 });
  assert(
    await page.getByText("Squad huddle").isVisible(),
    "workspace and chat render",
  );

  await page.getByRole("button", { name: "Look at Ledger" }).click();
  await page.getByText("Saved to your notes").waitFor({ timeout: 10_000 });
  assert(
    await page.getByRole("heading", { name: "The ledger" }).isVisible(),
    "inspecting an object saves a note",
  );

  await page
    .getByLabel("Message your team")
    .fill("Should we offer the discount and pay Kano something today?");
  await page.getByRole("button", { name: "Send" }).click();
  await page
    .getByText("I can defend ten per cent")
    .waitFor({ timeout: 15_000 });
  assert(
    await page.getByText("I can defend ten per cent").isVisible(),
    "scripted teammate replies to the topic",
  );

  await page.screenshot({ path: "e2e-workspace.png", fullPage: true });

  await page.getByRole("button", { name: "Go to my task" }).click();
  await page.waitForURL(/\/session\/.+\/task/, { timeout: 20_000 });
  console.log("task page loaded");

  await page
    .getByLabel("Your recommendation")
    .fill(
      "I would offer Mrs Bello 10% off, which is ₦100,000, and keep the rest as a credit for her next order. I would pay Kano Textiles ₦150,000 today to restart supply, because we only have 12 blue rolls and rent of ₦120,000 is due Friday. That leaves cash for the 2pm delivery, so we keep the customer and protect the rent.",
    );
  await page.getByRole("button", { name: "Submit for feedback" }).click();
  console.log("clicked submit");
  await page.waitForURL(/\/session\/.+\/results/, { timeout: 30_000 });
  console.log("results loaded");
  assert(
    await page.getByRole("heading", { name: "Your results" }).isVisible(),
    "submission scores and lands on results",
  );

  const verified = await page.getByText(/Verified against your submission/).count();
  assert(verified > 0, "results show verified quotes");
  await page.screenshot({ path: "e2e-results.png", fullPage: true });

  await page.getByRole("button", { name: "Publish card" }).click();
  const open = page.getByRole("link", { name: "Open card" });
  await open.waitFor({ timeout: 20_000 });
  await open.click();
  await page.waitForURL("**/card/**", { timeout: 20_000 });
  assert(
    await page.getByText(username).first().isVisible(),
    "public Evidence Card shows the student",
  );

  await page.screenshot({
    path: "e2e-card.png",
    fullPage: true,
  });
  assert(errors.length === 0, `no client errors (${errors.join(" | ") || "none"})`);
  console.log(`\nE2E passed for ${username} at ${page.url()}`);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
