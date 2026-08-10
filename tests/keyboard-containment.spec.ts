import { test, expect } from "@playwright/test";

async function waitForKeyboard(page: import("@playwright/test").Page) {
  await page.waitForSelector('[aria-label^="Key"]', { timeout: 10_000 });
}

test.describe("keyboard containment", () => {
  test("all keyboard keys remain inside the keyboard panel", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "phone-landscape");

    await page.goto("/");
    await waitForKeyboard(page);

    const geometry = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>(".retro-keyboard-panel");
      const keys = Array.from(
        document.querySelectorAll<HTMLElement>(".retro-keyboard-panel button"),
      );

      if (!panel || keys.length === 0) return null;

      const panelRect = panel.getBoundingClientRect();
      const keyRects = keys.map((key) => key.getBoundingClientRect());

      return {
        panelLeft: panelRect.left,
        panelRight: panelRect.right,
        minKeyLeft: Math.min(...keyRects.map((rect) => rect.left)),
        maxKeyRight: Math.max(...keyRects.map((rect) => rect.right)),
      };
    });

    expect(geometry).not.toBeNull();

    // Half-pixel tolerance covers DPR rounding without allowing visible bleed.
    expect(geometry!.minKeyLeft).toBeGreaterThanOrEqual(
      geometry!.panelLeft - 0.5,
    );
    expect(geometry!.maxKeyRight).toBeLessThanOrEqual(
      geometry!.panelRight + 0.5,
    );
  });
});
