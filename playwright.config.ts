import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "iphone-se",
      use: {
        viewport: { width: 320, height: 568 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "iphone-12",
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "pixel-5",
      use: {
        viewport: { width: 393, height: 851 },
        deviceScaleFactor: 2.75,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "ipad",
      use: {
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "laptop",
      use: {
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
      },
    },
    {
      // A 2560x1440 monitor typically exposes roughly 1180-1300 CSS px of
      // page height after browser chrome and a desktop panel. Use the lower
      // end of that range so the canonical desktop project enforces the
      // no-scroll contract in a normal maximized browser, not fullscreen.
      name: "desktop",
      use: {
        viewport: { width: 2560, height: 1180 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
      },
    },
    {
      name: "phone-landscape",
      use: {
        viewport: { width: 667, height: 375 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
