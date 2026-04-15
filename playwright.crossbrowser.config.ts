import { defineConfig, devices } from "@playwright/test"

const BASE_URL = process.env.BASE_URL || "https://deploy-preview-241--planetnewborn-v0-newbornplanetm.netlify.app"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 1,
  workers: 3,
  reporter: [["list"], ["json", { outputFile: "test-results/cross-browser-results.json" }]],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 20_000,
    actionTimeout: 5_000,
  },
  // Exclude tests that need local server or auth setup
  testIgnore: [
    "**/setup/**",
    "**/global-setup.ts",
    "**/human-click-timing-debug.spec.ts",
    "**/accessibility.spec.ts",
    "**/step4-personal-info.spec.ts",
    "**/step5-financing-idv.spec.ts",
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: { bypassCSP: true },
        launchOptions: { args: ["--disable-gpu", "--no-sandbox"] },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 14"],
      },
    },
  ],
  // No webServer — testing against live deploy
})
