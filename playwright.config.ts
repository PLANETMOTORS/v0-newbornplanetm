import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 15000,
    actionTimeout: 2000,
  },
  projects: [
    // Auth setup — generates Supabase session for authenticated tests
    // Only runs when TEST_USER_EMAIL + TEST_USER_PASSWORD are set
    ...(process.env.TEST_USER_EMAIL
      ? [
          {
            name: "setup",
            testMatch: /.*\.setup\.ts/,
            testDir: "./e2e/setup",
          },
        ]
      : []),
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Inject a script that ensures :focus pseudo-class works in headless mode
        // by giving the document focus on every page load
        contextOptions: {
          bypassCSP: true,
        },
        launchOptions: {
          args: ['--disable-gpu', '--no-sandbox'],
        },
      },
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
