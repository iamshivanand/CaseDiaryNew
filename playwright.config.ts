// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./utils/e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 30_000,
  retries: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    headless: true,
    viewport: { width: 900, height: 1200 },
    // Simulate Android WebView UA for more realistic behaviour
    userAgent:
      "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    // Allow local file:// access
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
  // Fail fast on CI; allow parallel locally
  workers: process.env.CI ? 1 : 2,
});
