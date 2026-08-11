import { test, expect } from "@playwright/test";

async function waitForGame(page: import("@playwright/test").Page) {
  await page.waitForSelector('[aria-label^="Key"]', { timeout: 10_000 });
}

test.describe("ECW web behavior", () => {
  test("branding links back to the daily puzzle home", async ({ page }) => {
    await page.goto("/");
    await waitForGame(page);

    const home = page.getByRole("link", { name: "Idoldle home", exact: true });
    await expect(home).toHaveAttribute("href", "/");

    await home.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("dialog", { name: "About Idoldle" })).toHaveCount(0);
  });

  test("addressable views preserve fragments, current state, and focus", async ({ page }) => {
    await page.goto("/");
    await waitForGame(page);

    const about = page.locator('nav.site-nav a[href="#about"]');
    await expect(about).toHaveCount(1);
    await about.click();

    await expect(page).toHaveURL(/#about$/);
    await expect(about).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("dialog", { name: "About Idoldle" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "About Idoldle" })).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.getAttribute("href"))).toBe("#about");

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(about).not.toHaveAttribute("aria-current", "page");
  });

  test("modal content traps focus and makes the background inert", async ({ page }) => {
    await page.goto("/");
    await waitForGame(page);

    const about = page.locator('nav.site-nav a[href="#about"]');
    await about.click();
    const dialog = page.getByRole("dialog", { name: "About Idoldle" });
    await expect(dialog).toBeVisible();

    const backgroundState = await page.evaluate(() => {
      const activeDialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const siblings = [...document.querySelectorAll<HTMLElement>(".site-shell > *")]
        .filter((element) => !element.contains(activeDialog));
      return {
        siblingsInert: siblings.length > 0 && siblings.every((element) => element.inert),
        activeInsideDialog: activeDialog?.contains(document.activeElement) ?? false,
      };
    });
    expect(backgroundState.siblingsInert).toBe(true);
    expect(backgroundState.activeInsideDialog).toBe(true);

    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement))).toBe(true);

    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("href"))).toBe("#about");
  });

  test("display uses natural names and a native-popover-compatible fallback", async ({ page }) => {
    await page.goto("/");
    await waitForGame(page);

    const display = page.getByRole("button", { name: "Display", exact: true });
    await expect(display).toHaveCount(1);
    await display.click();
    const popup = page.locator('[data-display-popup="true"]');
    await expect(popup).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("radio", { name: "Light", exact: true })).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toContain("Display");
  });

  test("completion does not redirect focus into Statistics", async ({ page }) => {
    await page.goto("/");
    await waitForGame(page);
    await page.waitForTimeout(2_100);
    await expect(page.getByRole("dialog", { name: "Statistics" })).toHaveCount(0);
  });

  test("wide Page Mode exposes three structural regions without document overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto("/");
    await waitForGame(page);

    const metrics = await page.evaluate(() => {
      const main = document.querySelector<HTMLElement>(".site-game-main");
      const cards = [...document.querySelectorAll<HTMLElement>(".site-info-grid > *")]
        .map((element) => element.getBoundingClientRect());
      return {
        columns: main ? getComputedStyle(main).gridTemplateColumns.split(" ").length : 0,
        leftCard: cards[0]?.left ?? 0,
        center: document.querySelector<HTMLElement>(".site-game-column")?.getBoundingClientRect().left ?? 0,
        rightCard: cards[1]?.left ?? 0,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        verticalOverflow: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      };
    });
    expect(metrics.columns).toBe(3);
    expect(metrics.leftCard).toBeLessThan(metrics.center);
    expect(metrics.rightCard).toBeGreaterThan(metrics.center);
    expect(metrics.overflow).toBeLessThanOrEqual(0);
    expect(metrics.verticalOverflow).toBeLessThanOrEqual(0);
  });

  test("wide virtual keyboard follows the common Wordle command-row pattern", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto("/");
    await waitForGame(page);

    const keyboard = await page.evaluate(() => {
      const rows = [...document.querySelectorAll<HTMLElement>(".retro-key-row")].map((row) => ({
        labels: [...row.querySelectorAll<HTMLButtonElement>("button")].map((button) => button.getAttribute("aria-label")),
        rect: row.getBoundingClientRect(),
      }));
      const letters = [...document.querySelectorAll<HTMLElement>(".retro-key:not(.retro-key--wide)")]
        .map((key) => key.getBoundingClientRect());
      const commands = [...document.querySelectorAll<HTMLElement>(".retro-key--wide")]
        .map((key) => ({ label: key.getAttribute("aria-label"), rect: key.getBoundingClientRect() }));
      return {
        rows: rows.map(({ labels, rect }) => ({ labels, left: rect.left, right: rect.right })),
        letterWidths: [...new Set(letters.map((rect) => Math.round(rect.width)))],
        commands: commands.map(({ label, rect }) => ({ label, left: rect.left, right: rect.right })),
        verticalOverflow: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      };
    });

    expect(keyboard.rows[2]?.labels).toEqual([
      "Enter",
      "Key Z",
      "Key X",
      "Key C",
      "Key V",
      "Key B",
      "Key N",
      "Key M",
      "Backspace",
    ]);
    expect(keyboard.letterWidths).toEqual([96]);
    expect(keyboard.commands[0]?.left).toBeLessThan(keyboard.commands[1]?.left ?? 0);
    expect(new Set(keyboard.rows.map((row) => Math.round(row.left))).size).toBe(1);
    expect(new Set(keyboard.rows.map((row) => Math.round(row.right))).size).toBe(1);
    expect(keyboard.verticalOverflow).toBeLessThanOrEqual(0);
  });

  test("computed ECW hit minimum stays above the 24 CSS px floor", async ({ page }) => {
    await page.goto("/");
    await waitForGame(page);
    const hitMin = await page.evaluate(() => {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const declared = getComputedStyle(document.documentElement).getPropertyValue("--ecw-hit-min").trim();
      const rem = declared.match(/^([\d.]+)rem$/);
      return rem ? Number(rem[1]) * root : Number.parseFloat(declared);
    });
    expect(hitMin).toBeGreaterThanOrEqual(24);
  });

  test("guess feedback is announced independently of the persistent status strip", async ({ page }) => {
    await page.goto("/");
    await waitForGame(page);

    const enter = page.getByRole("button", { name: "Enter", exact: true });
    await expect(enter).toHaveCount(1);
    await enter.click();

    const announcement = page.locator('p[role="alert"][aria-atomic="true"]');
    await expect(announcement).toContainText(/Need \d+ letters\./);
    await expect(page.locator('p[aria-live="polite"][aria-atomic="true"]')).not.toContainText("Need");
    await expect(page.locator('[aria-label="Today\'s game status"]')).not.toHaveAttribute("aria-live");
  });

  test("short viewport, text growth, and RTL remain operable without page overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "phone-landscape");
    await page.setViewportSize({ width: 667, height: 256 });
    await page.goto("/");
    await waitForGame(page);

    await expect(page.locator(".site-short-viewport")).toBeVisible();
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      keyVisible: Boolean(document.querySelector('[aria-label^="Key"]')),
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    expect(metrics.keyVisible).toBe(true);

    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
      document.documentElement.style.fontSize = "200%";
    });
    await page.addStyleTag({
      content: "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-block-end: 2em !important; }",
    });
    const grownMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      direction: document.documentElement.dir,
    }));
    expect(grownMetrics.direction).toBe("rtl");
    expect(grownMetrics.scrollWidth).toBeLessThanOrEqual(grownMetrics.clientWidth);
  });

  test("forced colors retains structural boundaries and focused selected state", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    await waitForGame(page);

    const display = page.getByRole("button", { name: "Display", exact: true });
    await display.click();
    const selected = page.locator('label[data-selected="true"] input[name="idoldle-display-mode"]');
    await expect(selected).toHaveCount(1);
    await selected.focus();

    const state = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>(".site-card");
      const focused = document.activeElement as HTMLElement | null;
      return {
        panelBorder: panel ? getComputedStyle(panel).borderColor : "",
        focusedOutline: focused ? getComputedStyle(focused).outlineColor : "",
      };
    });
    expect(state.panelBorder).not.toBe("transparent");
    expect(state.focusedOutline).not.toBe("transparent");
  });
});
