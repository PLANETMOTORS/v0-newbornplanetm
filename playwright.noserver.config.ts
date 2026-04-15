import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    screenshot: "only-on-failure",
    navigationTimeout: 15000,
    actionTimeout: 2000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: { bypassCSP: true },
        launchOptions: { args: ['--disable-gpu', '--no-sandbox'] },
      },
    },
  ],
  // No webServer — use the already-running dev server
})
