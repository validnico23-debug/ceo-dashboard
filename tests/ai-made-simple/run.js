// End-to-end test suite for public/ai-made-simple.
//
// Run with: npm test   (from this directory, after `npm install`)
//
// Starts a plain Node static file server over the app directory, drives it
// with a real Chromium instance via Playwright, and asserts on both DOM
// state and real browser behavior (Cache Storage, offline mode, storage
// keys) rather than just "did it throw."
//
// PLAYWRIGHT_CHROMIUM_PATH may be set to point at a pre-installed browser
// (used in the dev sandbox this suite was authored in); CI installs its own
// via `npx playwright install --with-deps chromium` and leaves it unset.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const APP_DIR = path.resolve(__dirname, "../../public/ai-made-simple");
const PORT = 8973;
const BASE_URL = `http://localhost:${PORT}/`;

const MIME = {
  ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml",
};

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split("?")[0]);
    if (reqPath === "/") reqPath = "/index.html";
    const filePath = path.join(APP_DIR, reqPath);
    if (!filePath.startsWith(APP_DIR)) { res.writeHead(403); res.end(); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

// --- Tiny test harness (no external test-runner dependency) ---
const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ok  - ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`FAIL  - ${name}`);
    console.log(`        ${err.message}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }
function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg || "not equal"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  });

  const consoleErrors = [];
  let page;
  const freshPage = async () => {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 400, height: 900 } });
    page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR on ${page.url()}: ${e.message}`));
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(`CONSOLE on ${page.url()}: ${msg.text()}`); });
    return page;
  };
  const clickBtn = (text) => page.click(`button:has-text("${text}")`);
  const goto = () => page.goto(BASE_URL, { waitUntil: "networkidle" });

  await freshPage();

  await test("welcome screen renders the core promise", async () => {
    await goto();
    const h1 = await page.textContent("h1");
    assertEqual(h1.trim(), "AI Made Simple");
    assert(await page.isVisible('button:has-text("Get Started")'), "Get Started button missing");
  });

  await test("onboarding is 2 questions and completing it reaches Home", async () => {
    await clickBtn("Get Started");
    assert(await page.isVisible("text=How comfortable are you with Claude or AI tools?"), "Q1 missing");
    await clickBtn("I've never used it");
    assert(await page.isVisible("text=Would you like written instructions"), "Q2 missing");
    await page.click('button[data-value="written"]');
    const h1 = await page.textContent("h1");
    assertEqual(h1.trim(), "What would you like to do?");
  });

  await test("comfort=never recommends the Beginner track on Home", async () => {
    const beginnerCard = await page.textContent('button:has-text("I\'m new to Claude")');
    assert(beginnerCard.includes("recommended for you"), "Beginner card should be marked recommended");
    const advancedCard = await page.textContent('button:has-text("I already use Claude")');
    assert(!advancedCard.includes("recommended for you"), "Advanced card should NOT be marked recommended");
  });

  await test("Beginner hub lists 5 lessons and 3 practice exercises", async () => {
    await clickBtn("I'm new to Claude");
    const lessonCount = await page.locator('button[data-action="openLesson"]').count();
    assertEqual(lessonCount, 5, "expected 5 beginner lessons");
    const practiceCount = await page.locator('button[data-action="selectPracticeTask"]').count();
    assertEqual(practiceCount, 3, "expected 3 practice exercises");
  });

  await test("a lesson opens, Make This Simpler works, and Mark as Done persists", async () => {
    await clickBtn("What Claude can do");
    assert(await page.isVisible("text=What Claude can do"), "lesson title missing");
    await clickBtn("Make This Simpler");
    const simplified = await page.textContent(".lesson-body");
    assert(simplified.includes("That's the main idea"), "simplified text not applied");
    await clickBtn("Mark as Done");
    await page.waitForTimeout(200);
    const doneChoice = await page.locator('button[data-lesson="what"]').first();
    const cls = await doneChoice.getAttribute("class");
    assert(cls.includes("done"), "lesson should show as done after completing");
  });

  await test("safety warning appears for sensitive input and disappears when removed", async () => {
    await clickBtn("Write an email");
    await page.fill("#answer-field", "my password is hunter2, please help write this");
    assert(await page.isVisible("text=A friendly reminder"), "safety warning should show for 'password'");
    await page.fill("#answer-field", "Asking my landlord to fix the heater");
    await page.waitForTimeout(50);
    assert(!(await page.isVisible("text=A friendly reminder")), "safety warning should clear once sensitive text is removed");
  });

  await test("full practice walkthrough: submit -> 4 guide steps -> success -> save", async () => {
    await page.click("#continue-btn");
    assertEqual((await page.textContent(".progress-label")).trim(), "Step 1 of 4");

    await clickBtn("I opened it — Next Step");
    assertEqual((await page.textContent(".progress-label")).trim(), "Step 2 of 4");
    const promptBefore = await page.textContent("#prompt-text");
    assert(promptBefore.includes("Asking my landlord to fix the heater"), "prompt should include the user's answer");

    await page.click('button:has-text("Friendlier")');
    const promptAfter = await page.textContent("#prompt-text");
    assert(promptAfter.includes("warm and friendly"), "tone chip should regenerate the prompt with the tone line");

    await page.click("#copy-btn");
    await page.waitForTimeout(150);
    assert((await page.textContent("#copy-btn")).includes("Copied"), "copy button should confirm success");

    await clickBtn("Next Step");
    assertEqual((await page.textContent(".progress-label")).trim(), "Step 3 of 4");
    await clickBtn("Next Step");
    assertEqual((await page.textContent(".progress-label")).trim(), "Step 4 of 4");

    await clickBtn("It Worked");
    assert(await page.isVisible("text=Great job"), "success screen should appear");

    await clickBtn("Save This Prompt");
    await page.waitForTimeout(150);
    await page.click('button[aria-label="Account and settings"]');
    await clickBtn("Saved Prompts");
    assert(await page.isVisible("text=Write an email"), "saved prompt should show the task label");
    assert((await page.textContent(".prompt-box")).includes("Asking my landlord to fix the heater"), "saved prompt should include the original answer");
  });

  await test("Advanced hub has 6 lessons and a lesson opens with real content", async () => {
    await goto();
    await clickBtn("I already use Claude");
    const count = await page.locator('button[data-action="openLesson"]').count();
    assertEqual(count, 6, "expected 6 advanced lessons");
    await clickBtn("Use Projects to keep your work organized");
    assert((await page.textContent(".lesson-body")).includes("Projects"), "lesson body should mention Projects");
  });

  await test("Text Size control shows all 3 options without clipping (regression guard)", async () => {
    // This must check real geometry, not just DOM text: the original bug had
    // the "Extra Large" button present in textContent but visually clipped
    // out of view by the segmented control's overflow:hidden, so a
    // text-presence check alone would never have caught it.
    await page.click('button[aria-label="Account and settings"]');
    const container = await page.locator(".segmented").first();
    const containerBox = await container.boundingBox();
    assert(containerBox, "segmented control should have a bounding box");
    const buttons = await page.locator(".segmented button").all();
    assertEqual(buttons.length, 3, "expected exactly 3 text-size options");
    for (const btn of buttons) {
      const label = (await btn.textContent()).trim();
      const box = await btn.boundingBox();
      assert(box, `"${label}" button should have a bounding box`);
      assert(box.width > 15, `"${label}" button is collapsed to near-zero width (${box.width}px) — likely clipped`);
      assert(
        box.x >= containerBox.x - 1 && box.x + box.width <= containerBox.x + containerBox.width + 1,
        `"${label}" button (x:${box.x}, w:${box.width}) falls outside the segmented container (x:${containerBox.x}, w:${containerBox.width}) — clipped by overflow:hidden`
      );
    }
    await page.click('button[data-size="xlarge"]');
    assertEqual(await page.getAttribute("html", "data-textsize"), "xlarge");
  });

  await test("High Contrast toggle applies and persists across reload", async () => {
    await page.click(".switch >> nth=0");
    assert(await page.evaluate(() => document.body.classList.contains("high-contrast")), "high-contrast class should be applied");
    await goto();
    assert(await page.evaluate(() => document.body.classList.contains("high-contrast")), "high-contrast should persist after reload");
  });

  await test("Voice Instructions toggle is free (no lock/premium badge)", async () => {
    await page.click('button[aria-label="Account and settings"]');
    const voiceRow = await page.textContent(".card:has-text('Voice Instructions')");
    assert(!voiceRow.includes("Premium"), "Voice Instructions should not show a Premium badge");
  });

  await test("Reset Demo Data clears both current and legacy storage keys", async () => {
    await page.evaluate(() => localStorage.setItem("aims_state_v1", JSON.stringify({ onboarded: true })));
    page.once("dialog", (d) => d.accept());
    await page.click('button:has-text("Reset Demo Data")');
    await page.waitForTimeout(150);
    const keys = await page.evaluate(() => ({ v1: localStorage.getItem("aims_state_v1"), v2: localStorage.getItem("aims_state_v2") }));
    assertEqual(keys.v1, null, "legacy v1 key should be cleared");
    assertEqual(keys.v2, null, "v2 key should be cleared");
  });

  await test("PWA: manifest is valid and linked", async () => {
    await goto();
    const href = await page.evaluate(() => document.querySelector('link[rel="manifest"]')?.href);
    assert(href, "manifest link missing from <head>");
    const manifest = await page.evaluate(async (u) => (await fetch(u)).json(), href);
    assertEqual(manifest.display, "standalone");
    assert(manifest.icons.length >= 4, "expected at least 4 icons in manifest");
  });

  await test("PWA: service worker registers, activates, and caches the app shell", async () => {
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, { timeout: 5000 }).catch(() => {});
    const reg = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      if (!r) return null;
      await navigator.serviceWorker.ready;
      return { active: !!r.active };
    });
    assert(reg && reg.active, "service worker should be registered and active");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const cached = await page.evaluate(async () => {
      const keys = await caches.keys();
      if (!keys.length) return [];
      const cache = await caches.open(keys[0]);
      return (await cache.keys()).map((r) => new URL(r.url).pathname);
    });
    for (const f of ["/index.html", "/app.js", "/styles.css", "/manifest.json"]) {
      assert(cached.includes(f), `expected ${f} to be cached, got: ${cached.join(", ")}`);
    }
  });

  await test("PWA: app still renders with the network fully offline", async () => {
    await page.context().setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    const title = await page.title();
    const appLength = await page.evaluate(() => document.getElementById("app")?.innerHTML.length || 0);
    await page.context().setOffline(false);
    assertEqual(title, "AI Made Simple");
    assert(appLength > 100, "app root should have rendered real content while offline");
  });

  await page.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} tests passed.`);
  if (consoleErrors.length) {
    console.log(`\n${consoleErrors.length} browser console/page error(s) were captured during the run:`);
    consoleErrors.forEach((e) => console.log("  " + e));
  }
  if (failed.length || consoleErrors.length) process.exit(1);
})();
