import { test, expect } from "@playwright/test";

async function waitForKeyboard(page: import("@playwright/test").Page) {
  await page.waitForSelector('[aria-label^="Key"]', { timeout: 10_000 });
}

test.describe("keyboard containment", () => {
  for (const height of [720, 212]) {
    test(`240px viewport keeps every virtual key actionable at ${height}px height`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 240, height });
      await page.goto("/");
      await waitForKeyboard(page);

      const metrics = await page.evaluate(() => {
        const panel = document.querySelector<HTMLElement>(".retro-keyboard-panel");
        const rows = Array.from(
          document.querySelectorAll<HTMLElement>(".retro-keyboard-panel .retro-key-row"),
        );
        const keys = Array.from(
          document.querySelectorAll<HTMLElement>(".retro-keyboard-panel button"),
        );
        if (!panel || rows.length !== 3 || keys.length !== 28) return null;

        const panelRect = panel.getBoundingClientRect();
        const keyRects = keys.map((key) => key.getBoundingClientRect());
        return {
          panel: {
            left: panelRect.left,
            right: panelRect.right,
            scrollWidth: panel.scrollWidth,
            clientWidth: panel.clientWidth,
          },
          rows: rows.map((row) => ({
            scrollWidth: row.scrollWidth,
            clientWidth: row.clientWidth,
          })),
          keys: keyRects.map((rect) => ({
            left: rect.left,
            right: rect.right,
            width: rect.width,
            height: rect.height,
          })),
          document: {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          },
        };
      });

      expect(metrics).not.toBeNull();
      expect(metrics!.panel.scrollWidth).toBeLessThanOrEqual(metrics!.panel.clientWidth);
      expect(metrics!.rows.every((row) => row.scrollWidth <= row.clientWidth + 1)).toBe(true);
      expect(metrics!.document.scrollWidth).toBeLessThanOrEqual(metrics!.document.clientWidth);

      for (const key of metrics!.keys) {
        expect(key.left).toBeGreaterThanOrEqual(metrics!.panel.left - 0.5);
        expect(key.right).toBeLessThanOrEqual(metrics!.panel.right + 0.5);
        expect(key.width).toBeGreaterThanOrEqual(24);
        expect(key.height).toBeGreaterThanOrEqual(48);
      }

      const q = page.getByRole("button", { name: "Key Q", exact: true });
      await expect(q).toHaveCount(1);
      await q.click();
      expect(
        await page.evaluate(() => document.querySelector("[role='gridcell']")?.textContent),
      ).toBe("Q");
    });
  }

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
