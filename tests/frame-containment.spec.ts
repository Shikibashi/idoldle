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

  test("each status cell keeps its content inside its assigned column", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "phone-landscape");

    await page.goto("/");
    await waitForGame(page);

    const failures = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>(".site-status > span"))
        .filter((cell) => cell.scrollWidth > cell.clientWidth + 1)
        .map((cell) => ({
          text: (cell.textContent ?? "").trim().replace(/\s+/g, " "),
          clientWidth: cell.clientWidth,
          scrollWidth: cell.scrollWidth,
        })),
    );

    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });
});
