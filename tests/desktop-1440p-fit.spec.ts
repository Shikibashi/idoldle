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

  test("zoomed desktop width has zero vertical overflow", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");

    await page.setViewportSize({ width: 1279, height: 1000 });
    await page.goto("/");
    await waitForGame(page);

    const metrics = await pageMetrics(page);

    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight);
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.innerHeight);
    expect(metrics.shellTop).toBeGreaterThanOrEqual(0);
    expect(metrics.shellBottom).toBeLessThanOrEqual(metrics.innerHeight);
  });

  test("short laptop desktop has no accidental document scrollbar", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "laptop");

    await page.goto("/");
    await waitForGame(page);

    const metrics = await page.evaluate(() => ({
      documentScrollHeight: document.documentElement.scrollHeight,
      documentClientHeight: document.documentElement.clientHeight,
      bodyScrollHeight: document.body.scrollHeight,
      innerHeight: window.innerHeight,
      tileWidth: document.querySelector<HTMLElement>("[role='gridcell']")
        ?.getBoundingClientRect().width ?? 0,
      keyHeight: document.querySelector<HTMLElement>("[aria-label='Key A']")
        ?.getBoundingClientRect().height ?? 0,
    }));

    expect(metrics.documentScrollHeight).toBeLessThanOrEqual(
      metrics.documentClientHeight,
    );
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.innerHeight);
    expect(metrics.tileWidth).toBeLessThanOrEqual(40);
    expect(metrics.keyHeight).toBeGreaterThanOrEqual(48);
  });

  test("4K desktop exposes a broad game workspace and inspector", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");

    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.goto("/");
    await waitForGame(page);

    const metrics = await page.evaluate(() => {
      const rect = (selector: string) =>
        document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
      const shell = rect(".site-shell");
      const gameMain = rect(".site-game-main");
      const gamePanel = rect(".retro-board-panel");
      const inspector = rect(".site-info-grid");
      const doc = document.documentElement;

      return {
        shellWidth: shell?.width ?? 0,
        gameMainWidth: gameMain?.width ?? 0,
        gamePanelWidth: gamePanel?.width ?? 0,
        inspectorWidth: inspector?.width ?? 0,
        pageOverflow: doc.scrollWidth - doc.clientWidth,
      };
    });

    expect(metrics.shellWidth).toBeGreaterThan(3000);
    expect(metrics.gameMainWidth).toBeGreaterThan(3000);
    expect(metrics.gamePanelWidth).toBeGreaterThan(2600);
    expect(metrics.inspectorWidth).toBeGreaterThan(250);
    expect(metrics.pageOverflow).toBeLessThanOrEqual(0);
  });

  test("4K desktop expands the keyboard with the game workspace", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");

    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.goto("/");
    await waitForGame(page);

    const metrics = await page.evaluate(() => {
      const key = document.querySelector<HTMLElement>("[aria-label='Key A']");
      const row = document.querySelector<HTMLElement>(".retro-key-row");
      const keyRect = key?.getBoundingClientRect();
      const rowRect = row?.getBoundingClientRect();

      return {
        keyWidth: keyRect?.width ?? 0,
        keyHeight: keyRect?.height ?? 0,
        rowWidth: rowRect?.width ?? 0,
      };
    });

    expect(metrics.rowWidth).toBeGreaterThanOrEqual(800);
    expect(metrics.keyWidth).toBeGreaterThanOrEqual(70);
    expect(metrics.keyHeight).toBeGreaterThanOrEqual(56);
  });

  test("HiDPI-width desktop scales the board and keyboard beyond laptop sizing", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");

    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto("/");
    await waitForGame(page);

    const metrics = await page.evaluate(() => {
      const tile = document.querySelector<HTMLElement>("[role='gridcell']");
      const key = document.querySelector<HTMLElement>("[aria-label='Key A']");
      const row = document.querySelector<HTMLElement>(".retro-key-row");
      const keyboard = document.querySelector<HTMLElement>(".retro-keyboard-panel");
      const keyWidths = Array.from(
        document.querySelectorAll<HTMLElement>(".retro-keyboard-panel button"),
      ).map((button) => button.getBoundingClientRect().width);
      const letterWidths = Array.from(
        document.querySelectorAll<HTMLElement>(".retro-keyboard-panel button"),
      )
        .filter((button) => !["Enter", "Backspace"].includes(button.getAttribute("aria-label") ?? ""))
        .map((button) => button.getBoundingClientRect().width);
      const wideKeys = Array.from(
        document.querySelectorAll<HTMLElement>(".retro-keyboard-panel button"),
      ).filter((button) => ["Enter", "Backspace"].includes(button.getAttribute("aria-label") ?? ""));
      const keyboardRect = keyboard?.getBoundingClientRect();
      const doc = document.documentElement;
      return {
        tileWidth: tile?.getBoundingClientRect().width ?? 0,
        keyWidth: key?.getBoundingClientRect().width ?? 0,
        rowWidth: row?.getBoundingClientRect().width ?? 0,
        keyboardWidth: keyboard?.getBoundingClientRect().width ?? 0,
        keyWidthRange: keyWidths.length
          ? Math.max(...keyWidths) - Math.min(...keyWidths)
          : Number.POSITIVE_INFINITY,
        letterWidthRange: letterWidths.length
          ? Math.max(...letterWidths) - Math.min(...letterWidths)
          : Number.POSITIVE_INFINITY,
        enterWidth: wideKeys.find((button) => button.getAttribute("aria-label") === "Enter")?.getBoundingClientRect().width ?? 0,
        backspaceWidth: wideKeys.find((button) => button.getAttribute("aria-label") === "Backspace")?.getBoundingClientRect().width ?? 0,
        enterRight: wideKeys.find((button) => button.getAttribute("aria-label") === "Enter")?.getBoundingClientRect().right ?? 0,
        backspaceRight: wideKeys.find((button) => button.getAttribute("aria-label") === "Backspace")?.getBoundingClientRect().right ?? 0,
        keyboardCenterX: keyboardRect ? keyboardRect.left + keyboardRect.width / 2 : 0,
        pageOverflow: doc.scrollWidth - doc.clientWidth,
      };
    });

    expect(metrics.tileWidth).toBeGreaterThanOrEqual(96);
    expect(metrics.keyWidth).toBeGreaterThanOrEqual(94);
    expect(metrics.rowWidth).toBeGreaterThanOrEqual(980);
    expect(metrics.keyboardWidth).toBeLessThanOrEqual(1100);
    expect(metrics.letterWidthRange).toBeLessThanOrEqual(0.5);
    expect(metrics.enterWidth).toBeGreaterThan(metrics.keyWidth);
    expect(metrics.backspaceWidth).toBeGreaterThan(metrics.keyWidth);
    expect(metrics.enterRight).toBeGreaterThan(metrics.keyboardCenterX);
    expect(metrics.backspaceRight).toBeGreaterThan(metrics.keyboardCenterX);
    expect(metrics.pageOverflow).toBeLessThanOrEqual(0);
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

    await page.getByRole("link", { name: "Statistics", exact: true }).click();
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
