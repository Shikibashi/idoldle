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
      // Model a 2560x1440 desktop running at roughly 125% effective scaling
      // with browser chrome / desktop panels consuming additional height.
      // This is intentionally harsher than the previous 2560x1180 project.
      name: "desktop",
      use: {
        viewport: { width: 2048, height: 1000 },
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
