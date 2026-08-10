import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

/**
 * Verification config with an isolated port. The normal development server on
 * port 5173 may belong to another workspace, so browser tests must never reuse
 * an unrelated process.
 */
export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: "http://127.0.0.1:5176",
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : undefined,
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5176",
    port: 5176,
    reuseExistingServer: false,
  },
});
