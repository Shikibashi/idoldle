import { test, expect } from "@playwright/test";

async function waitForGame(page: import("@playwright/test").Page) {
  await page.waitForSelector('[aria-label^="Key"]', { timeout: 10_000 });
}

const FRAMED_SELECTORS = [
  ".site-status",
  ".site-nav",
  ".retro-board-panel",
  ".retro-keyboard-panel",
  ".retro-board-panel .retro-panel__header",
  ".retro-keyboard-panel .retro-panel__header",
  ".site-info-grid",
  ".site-card",
];

test.describe("framed UI containment", () => {
  test("framed regions do not horizontally overflow their borders", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "phone-landscape");

    await page.goto("/");
    await waitForGame(page);

    const failures = await page.evaluate((selectors) => {
      const broken: Array<{
        selector: string;
        text: string;
        clientWidth: number;
        scrollWidth: number;
      }> = [];

      for (const selector of selectors) {
        for (const element of document.querySelectorAll<HTMLElement>(selector)) {
          if (element.scrollWidth > element.clientWidth + 1) {
            broken.push({
              selector,
              text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 120),
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
            });
          }
        }
      }

      return broken;
    }, FRAMED_SELECTORS);

    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });

  test("each rendered status value stays inside its assigned cell", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "phone-landscape");

    await page.goto("/");
    await waitForGame(page);

    const failures = await page.evaluate(() => {
      const tolerance = 0.75;
      return Array.from(document.querySelectorAll<HTMLElement>(".site-status__cell"))
        .flatMap((cell) => {
          const value = cell.querySelector<HTMLElement>(".site-status__value");
          if (!value) return [{ text: cell.textContent ?? "", reason: "missing value box" }];

          const cellRect = cell.getBoundingClientRect();
          const valueRect = value.getBoundingClientRect();
          const style = getComputedStyle(value);
          const outside =
            valueRect.left < cellRect.left - tolerance ||
            valueRect.right > cellRect.right + tolerance;
          const notClipped = style.overflowX !== "hidden" && style.overflow !== "hidden";

          if (!outside && !notClipped) return [];

          return [{
            text: (cell.textContent ?? "").trim().replace(/\s+/g, " "),
            reason: outside ? "value box crosses cell boundary" : "value is not clipped",
            cellLeft: cellRect.left,
            cellRight: cellRect.right,
            valueLeft: valueRect.left,
            valueRight: valueRect.right,
            overflowX: style.overflowX,
          }];
        });
    });

    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });

  test("desktop theme value fits without colliding with attempt", async ({
    page,
  }, testInfo) => {
    test.skip(!["laptop", "desktop"].includes(testInfo.project.name));

    await page.goto("/");
    await waitForGame(page);

    const metrics = await page.evaluate(() => {
      const theme = document.querySelector<HTMLElement>(".site-status__cell--theme");
      const themeValue = theme?.querySelector<HTMLElement>(".site-status__value");
      const attempt = document.querySelector<HTMLElement>(".site-status__cell--attempt");
      if (!theme || !themeValue || !attempt) return null;

      const themeRect = theme.getBoundingClientRect();
      const valueRect = themeValue.getBoundingClientRect();
      const attemptRect = attempt.getBoundingClientRect();
      return {
        themeRight: themeRect.right,
        valueRight: valueRect.right,
        attemptLeft: attemptRect.left,
        valueClientWidth: themeValue.clientWidth,
        valueScrollWidth: themeValue.scrollWidth,
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.valueRight).toBeLessThanOrEqual(metrics!.themeRight + 0.75);
    expect(metrics!.themeRight).toBeLessThanOrEqual(metrics!.attemptLeft + 0.75);
    expect(metrics!.valueScrollWidth).toBeLessThanOrEqual(metrics!.valueClientWidth + 1);
  });
});
