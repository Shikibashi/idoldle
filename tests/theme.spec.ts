import { test, expect } from "@playwright/test";

async function waitForApp(page: import("@playwright/test").Page) {
  await page.waitForSelector('[aria-label^="Key"]', { timeout: 10_000 });
}

test.describe("color mode", () => {
  test("switches between explicit appearance modes", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const root = page.locator(".site-page[data-color-mode]");
    await expect(root).toHaveAttribute("data-color-mode", "dark");

    const appearance = page.getByRole("combobox", { name: "Appearance mode" });
    await expect(appearance).toHaveValue("dark");
    await appearance.selectOption("light");

    await expect(root).toHaveAttribute("data-color-mode", "light");
    await expect(appearance).toHaveValue("light");

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

  test("persists the selected mode after reload", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    await page
      .getByRole("combobox", { name: "Appearance mode" })
      .selectOption("light");
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
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await waitForApp(page);

    const root = page.locator(".site-page[data-color-mode]");
    const appearance = page.getByRole("combobox", { name: "Appearance mode" });
    await appearance.selectOption("system");
    await expect(appearance).toHaveValue("system");
    await expect(root).toHaveAttribute("data-color-mode", "light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.emulateMedia({ colorScheme: "dark" });
    await expect(root).toHaveAttribute("data-color-mode", "dark");

    await appearance.selectOption("light");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(root).toHaveAttribute("data-color-mode", "light");
  });
});
