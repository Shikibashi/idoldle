import { test, expect } from "@playwright/test";

async function waitForApp(page: import("@playwright/test").Page) {
  await page.waitForSelector('[aria-label^="Key"]', { timeout: 10_000 });
}

async function chooseDisplayMode(
  page: import("@playwright/test").Page,
  mode: "system" | "light" | "dark",
  forceOverlay = false,
) {
  const display = page.getByRole("button", { name: "[ DISPLAY ]", exact: true });
  if (forceOverlay) await display.dispatchEvent("click");
  else await display.click();

  const radio = page.getByRole("radio", { name: mode.toUpperCase(), exact: true });
  if (forceOverlay) await radio.dispatchEvent("click");
  else await radio.click();
}

async function chooseDensity(
  page: import("@playwright/test").Page,
  density: "automatic" | "compact" | "comfortable",
  forceOverlay = false,
) {
  const display = page.getByRole("button", { name: "[ DISPLAY ]", exact: true });
  if (forceOverlay) await display.dispatchEvent("click");
  else await display.click();

  const radio = page.getByRole("radio", { name: density.toUpperCase(), exact: true });
  if (forceOverlay) await radio.dispatchEvent("click");
  else await radio.click();
}

async function chooseContrast(
  page: import("@playwright/test").Page,
  contrast: "normal" | "increased",
  forceOverlay = false,
) {
  const display = page.getByRole("button", { name: "[ DISPLAY ]", exact: true });
  if (forceOverlay) await display.dispatchEvent("click");
  else await display.click();

  const contrastDisclosure = page.locator(".site-display-advanced > summary");
  if (forceOverlay) await contrastDisclosure.dispatchEvent("click");
  else await contrastDisclosure.click();

  const radio = page.getByRole("radio", { name: contrast.toUpperCase(), exact: true });
  if (forceOverlay) await radio.dispatchEvent("click");
  else await radio.click();
}

test.describe("color mode", () => {
  test("switches between explicit appearance modes", async ({ page }, testInfo) => {
    await page.goto("/");
    await waitForApp(page);

    const root = page.locator(".site-page[data-color-mode]");
    await expect(root).toHaveAttribute("data-color-mode", "dark");

    const display = page.getByRole("button", { name: "[ DISPLAY ]", exact: true });
    await expect(display).toHaveCount(1);
    await chooseDisplayMode(page, "light", testInfo.project.name === "phone-landscape");

    await expect(root).toHaveAttribute("data-color-mode", "light");
    await expect(display).toHaveAttribute("aria-expanded", "false");

    const lightStyles = await page.evaluate(() => ({
      colorScheme: document.documentElement.style.colorScheme,
      pageBackground: getComputedStyle(
        document.querySelector(".site-page")!,
      ).backgroundColor,
      tileBackground: getComputedStyle(
        document.querySelector(".retro-tile--empty")!,
      ).backgroundColor,
    }));

    expect(lightStyles.colorScheme).toBe("light");
    expect(lightStyles.pageBackground).toBe("rgb(199, 204, 223)");
    expect(lightStyles.tileBackground).toBe("rgb(255, 255, 255)");
  });

  test("persists the selected mode after reload", async ({ page }, testInfo) => {
    await page.goto("/");
    await waitForApp(page);

    await chooseDisplayMode(page, "light", testInfo.project.name === "phone-landscape");
    await page.reload();
    await waitForApp(page);

    await expect(page.locator(".site-page[data-color-mode]")).toHaveAttribute(
      "data-color-mode",
      "light",
    );
    await expect(
      page.locator(".site-page[data-appearance-mode]")
    ).toHaveAttribute("data-appearance-mode", "light");
  });

  test("follows system preference until an explicit mode is chosen", async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await waitForApp(page);

    const root = page.locator(".site-page[data-color-mode]");
    await chooseDisplayMode(page, "system", testInfo.project.name === "phone-landscape");
    await expect(root).toHaveAttribute("data-color-mode", "light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.emulateMedia({ colorScheme: "dark" });
    await expect(root).toHaveAttribute("data-color-mode", "dark");

    await chooseDisplayMode(page, "light", testInfo.project.name === "phone-landscape");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(root).toHaveAttribute("data-color-mode", "light");
  });

  test("supports independent density preferences", async ({ page }, testInfo) => {
    await page.goto("/");
    await waitForApp(page);

    const root = page.locator(".site-page[data-density]");
    await expect(root).toHaveAttribute("data-density-mode", "automatic");
    await expect(root).toHaveAttribute("data-density", /^(compact|comfortable)$/);

    await chooseDensity(page, "compact", testInfo.project.name === "phone-landscape");
    await expect(root).toHaveAttribute("data-density-mode", "compact");
    await expect(root).toHaveAttribute("data-density", "compact");

    await page.reload();
    await waitForApp(page);
    await expect(root).toHaveAttribute("data-density-mode", "compact");
    await expect(root).toHaveAttribute("data-density", "compact");

    await chooseDensity(page, "comfortable", testInfo.project.name === "phone-landscape");
    await expect(root).toHaveAttribute("data-density-mode", "comfortable");
    await expect(root).toHaveAttribute("data-density", "comfortable");
  });

  test("supports increased contrast and resets display preferences", async ({ page }, testInfo) => {
    await page.goto("/");
    await waitForApp(page);

    const root = page.locator(".site-page[data-contrast]");
    await expect(root).toHaveAttribute("data-contrast", "normal");

    await chooseContrast(page, "increased", testInfo.project.name === "phone-landscape");
    await expect(root).toHaveAttribute("data-contrast", "increased");
    await page.reload();
    await waitForApp(page);
    await expect(root).toHaveAttribute("data-contrast", "increased");

    const display = page.getByRole("button", { name: "[ DISPLAY ]", exact: true });
    if (testInfo.project.name === "phone-landscape") await display.dispatchEvent("click");
    else await display.click();
    const reset = page.getByRole("button", { name: "[ RESET DISPLAY ]", exact: true });
    if (testInfo.project.name === "phone-landscape") await reset.dispatchEvent("click");
    else await reset.click();

    await expect(root).toHaveAttribute("data-contrast", "normal");
    await expect(page.locator(".site-page[data-appearance-mode]")).toHaveAttribute(
      "data-appearance-mode",
      "system",
    );
    await expect(page.locator(".site-page[data-density-mode]")).toHaveAttribute(
      "data-density-mode",
      "automatic",
    );
  });
});
