import { test, expect } from "@playwright/test";

async function waitForGame(page: import("@playwright/test").Page) {
  await page.waitForSelector('[aria-label^="Key"]', { timeout: 10_000 });
}

test.describe("1440p desktop fit", () => {
  test("full page fits without vertical scrolling", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440p-browser");

    await page.goto("/");
    await waitForGame(page);

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const shell = document.querySelector<HTMLElement>(".site-shell");
      const shellRect = shell?.getBoundingClientRect();

      return {
        clientHeight: doc.clientHeight,
        scrollHeight: doc.scrollHeight,
        bodyScrollHeight: document.body.scrollHeight,
        shellTop: shellRect?.top ?? null,
        shellBottom: shellRect?.bottom ?? null,
        innerHeight: window.innerHeight,
      };
    });

    expect(
      metrics.scrollHeight,
      `document scrollHeight ${metrics.scrollHeight}px should fit within ${metrics.clientHeight}px viewport`,
    ).toBeLessThanOrEqual(metrics.clientHeight + 1);

    expect(
      metrics.bodyScrollHeight,
      `body scrollHeight ${metrics.bodyScrollHeight}px should fit within ${metrics.innerHeight}px viewport`,
    ).toBeLessThanOrEqual(metrics.innerHeight + 1);

    expect(metrics.shellTop).not.toBeNull();
    expect(metrics.shellBottom).not.toBeNull();
    expect(metrics.shellTop!).toBeGreaterThanOrEqual(0);
    expect(metrics.shellBottom!).toBeLessThanOrEqual(metrics.innerHeight + 1);
  });
});
