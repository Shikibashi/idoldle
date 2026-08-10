import { test, expect } from "@playwright/test";

async function waitForGame(page: import("@playwright/test").Page) {
  await page.waitForSelector('[aria-label^="Key"]', { timeout: 10_000 });
}

async function pageMetrics(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const shell = document.querySelector<HTMLElement>(".site-shell");
    const shellRect = shell?.getBoundingClientRect();
    const tile = document.querySelector<HTMLElement>("[role='gridcell']");
    const key = document.querySelector<HTMLElement>("[aria-label='Key A']");
    const tileRect = tile?.getBoundingClientRect();
    const keyRect = key?.getBoundingClientRect();

    return {
      clientHeight: doc.clientHeight,
      scrollHeight: doc.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      shellTop: shellRect?.top ?? null,
      shellBottom: shellRect?.bottom ?? null,
      innerHeight: window.innerHeight,
      tileWidth: tileRect?.width ?? null,
      keyHeight: keyRect?.height ?? null,
    };
  });
}

test.describe("scaled 1440p desktop fit", () => {
  test("full page has zero vertical overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");

    await page.goto("/");
    await waitForGame(page);

    const metrics = await pageMetrics(page);

    expect(
      metrics.scrollHeight,
      `document scrollHeight ${metrics.scrollHeight}px must not exceed ${metrics.clientHeight}px viewport`,
    ).toBeLessThanOrEqual(metrics.clientHeight);

    expect(
      metrics.bodyScrollHeight,
      `body scrollHeight ${metrics.bodyScrollHeight}px must not exceed ${metrics.innerHeight}px viewport`,
    ).toBeLessThanOrEqual(metrics.innerHeight);

    expect(metrics.shellTop).not.toBeNull();
    expect(metrics.shellBottom).not.toBeNull();
    expect(metrics.shellTop!).toBeGreaterThanOrEqual(0);
    expect(metrics.shellBottom!).toBeLessThanOrEqual(metrics.innerHeight);

    // Compact-height mode should reduce the board, not the accessible keyboard.
    expect(metrics.tileWidth).not.toBeNull();
    expect(metrics.tileWidth!).toBeLessThanOrEqual(55);
    expect(metrics.keyHeight).not.toBeNull();
    expect(metrics.keyHeight!).toBeGreaterThanOrEqual(48);
  });

  test("tall desktop window has zero vertical overflow", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");

    await page.setViewportSize({ width: 1981, height: 1262 });
    await page.goto("/");
    await waitForGame(page);

    const metrics = await pageMetrics(page);

    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight);
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.innerHeight);
    expect(metrics.shellTop).toBeGreaterThanOrEqual(0);
    expect(metrics.shellBottom).toBeLessThanOrEqual(metrics.innerHeight);
  });

  test("statistics modal does not create a document scrollbar", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");

    await page.goto("/");
    await waitForGame(page);

    const before = await pageMetrics(page);
    expect(before.scrollHeight).toBeLessThanOrEqual(before.clientHeight);
    expect(before.bodyScrollHeight).toBeLessThanOrEqual(before.innerHeight);

    await page.click('[aria-label="Open statistics"]');
    const dialog = page.locator(
      '[role="dialog"][aria-labelledby="stats-modal-title"]',
    );
    await expect(dialog).toBeVisible();

    const modalMetrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const dialogEl = document.querySelector<HTMLElement>(
        '[role="dialog"][aria-labelledby="stats-modal-title"]',
      );
      const rect = dialogEl?.getBoundingClientRect();

      return {
        documentScrollHeight: doc.scrollHeight,
        documentClientHeight: doc.clientHeight,
        bodyScrollHeight: body.scrollHeight,
        innerHeight: window.innerHeight,
        htmlOverflowY: getComputedStyle(doc).overflowY,
        bodyOverflowY: getComputedStyle(body).overflowY,
        dialogOverflowY: dialogEl ? getComputedStyle(dialogEl).overflowY : null,
        dialogTop: rect?.top ?? null,
        dialogBottom: rect?.bottom ?? null,
      };
    });

    expect(modalMetrics.documentScrollHeight).toBeLessThanOrEqual(
      modalMetrics.documentClientHeight,
    );
    expect(modalMetrics.bodyScrollHeight).toBeLessThanOrEqual(
      modalMetrics.innerHeight,
    );
    expect(modalMetrics.htmlOverflowY).toBe("hidden");
    expect(modalMetrics.bodyOverflowY).toBe("hidden");
    expect(["auto", "scroll"]).toContain(modalMetrics.dialogOverflowY);
    expect(modalMetrics.dialogTop).not.toBeNull();
    expect(modalMetrics.dialogBottom).not.toBeNull();
    expect(modalMetrics.dialogTop!).toBeGreaterThanOrEqual(0);
    expect(modalMetrics.dialogBottom!).toBeLessThanOrEqual(
      modalMetrics.innerHeight,
    );
  });
});
