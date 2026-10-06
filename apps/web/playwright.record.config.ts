import { defineConfig, devices } from "@playwright/test"

import baseConfig from "./playwright.config"

// Records the tour media in public/tour. Each scenario owns its browser
// context (see e2e/media/recorder.ts), so videos are set up there, not here.
export default defineConfig({
  ...baseConfig,
  testDir: "./e2e/media",
  testMatch: "**/*.record.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 60 * 1000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
