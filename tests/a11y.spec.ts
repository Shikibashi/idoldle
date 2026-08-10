/**
 * a11y.spec.ts — Phase C2
 *
 * Accessibility scans using @axe-core/playwright across all 7 viewport
 * projects in both light mode and dark mode.
 *
 * Covers AC-15: No critical or serious WCAG 2.1 AA violations.
 *
 * Projects defined in playwright.config.ts:
 *   iphone-se (320×568), iphone-12 (390×844), pixel-5 (393×851),
 *   ipad (768×1024), laptop (1280×800), desktop (1920×1080),
 *   phone-landscape (667×375)
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ---------------------------------------------------------------------------
// Helper: wait for keyboard to render before scanning
// ---------------------------------------------------------------------------
async function waitForApp(page: import("@playwright/test").Page) {
  // The rotate-hint overlay covers the game on phone-landscape; wait for it.
  // On all other projects, wait for the keyboard buttons.
  try {
    await page.waitForSelector('[aria-label^="Key"], .rotate-hint', {
      timeout: 10_000,
    });
  } catch {
    // Fallback: wait for network idle
    await page.waitForLoadState("networkidle");
  }
}

// ---------------------------------------------------------------------------
// Helper: filter to only critical/serious violations
// ---------------------------------------------------------------------------
function seriousViolations(
  violations: import("axe-core").Result[],
): import("axe-core").Result[] {
  return violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
}

// ---------------------------------------------------------------------------
// Helper: format violations for readable assertion messages
// ---------------------------------------------------------------------------
function formatViolations(violations: import("axe-core").Result[]): string {
  if (violations.length === 0) return "none";
  return violations
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`,
    )
    .join("\n  ");
}

// ---------------------------------------------------------------------------
// 1. Light mode axe scan — all projects
// ---------------------------------------------------------------------------
test.describe("light mode accessibility", () => {
  test("no critical/serious axe violations (light mode)", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    await page
      .getByRole("combobox", { name: "Appearance mode" })
      .selectOption("light");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const serious = seriousViolations(results.violations);
    expect(
      serious,
      `Accessibility violations found:\n  ${formatViolations(serious)}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Dark mode axe scan — all projects
// ---------------------------------------------------------------------------
test.describe("dark mode accessibility", () => {
  test("no critical/serious axe violations (dark mode)", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await waitForApp(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const serious = seriousViolations(results.violations);
    expect(
      serious,
      `Dark mode accessibility violations found:\n  ${formatViolations(serious)}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3. prefers-reduced-motion: animate-flip elements get animation: none
// ---------------------------------------------------------------------------
test.describe("reduced motion", () => {
  test("animate-flip has animation: none when prefers-reduced-motion: reduce", async ({
    page,
  }, testInfo) => {
    // phone-landscape is covered by rotate-hint; skip for this test
    // since the game board may not be rendered/visible behind the hint.
    test.skip(testInfo.project.name === "phone-landscape");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForApp(page);

    // Inject a revealed tile to trigger animate-flip class.
    // Because we can't play a game, we check whether the CSS rule is applied
    // by querying what animation value a hypothetical .animate-flip element
    // would receive. We do this by inserting a test element.
    const animationValue = await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "animate-flip";
      document.body.appendChild(el);
      const val = getComputedStyle(el).animation;
      document.body.removeChild(el);
      return val;
    });

    // When prefers-reduced-motion: reduce is active, the index.css rule sets
    // animation: none !important for .animate-flip elements.
    expect(
      animationValue,
      "animate-flip should have animation: none under reduced-motion",
    ).toMatch(/^none/);
  });
});
