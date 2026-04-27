import { defineConfig } from "@playwright/test"

/**
 * BrowserStack Playwright Configuration
 * Requires BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables
 */

// Validate required credentials
const BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME
const BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY

if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
  throw new Error(
    'BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables are required'
  )
}

// Helper to create BrowserStack WebSocket endpoint
const createWsEndpoint = (caps: Record<string, unknown>) =>
  `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(
    JSON.stringify({
      ...caps,
      build: `Planet-Motors-QA-${new Date().toISOString().split("T")[0]}`,
      "browserstack.username": BROWSERSTACK_USERNAME,
      "browserstack.accessKey": BROWSERSTACK_ACCESS_KEY,
      "browserstack.local": true,
      "browserstack.networkLogs": true,
      "browserstack.consoleLogs": "verbose",
    })
  )}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  workers: 3,
  timeout: 60000,
  reporter: [
    ["html", { outputFolder: "playwright-report-browserstack" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 30000,
    actionTimeout: 10000,
    connectOptions: {
      wsEndpoint: createWsEndpoint({
        browser: "chrome",
        browser_version: "latest",
        os: "Windows",
        os_version: "11",
        name: "Planet Motors QA",
      }),
    },
  },
  projects: [
    {
      name: "bs-chrome-win11",
      use: {
        connectOptions: {
          wsEndpoint: createWsEndpoint({
            browser: "chrome",
            browser_version: "latest",
            os: "Windows",
            os_version: "11",
            name: "Chrome on Windows 11",
          }),
        },
      },
    },
    {
      name: "bs-edge-win11",
      use: {
        connectOptions: {
          wsEndpoint: createWsEndpoint({
            browser: "edge",
            browser_version: "latest",
            os: "Windows",
            os_version: "11",
            name: "Edge on Windows 11",
          }),
        },
      },
    },
    {
      name: "bs-firefox-win11",
      use: {
        connectOptions: {
          wsEndpoint: createWsEndpoint({
            browser: "firefox",
            browser_version: "latest",
            os: "Windows",
            os_version: "11",
            name: "Firefox on Windows 11",
          }),
        },
      },
    },
    {
      name: "bs-chrome-mac",
      use: {
        connectOptions: {
          wsEndpoint: createWsEndpoint({
            browser: "chrome",
            browser_version: "latest",
            os: "OS X",
            os_version: "Monterey",
            name: "Chrome on macOS Monterey",
          }),
        },
      },
    },
    {
      name: "bs-safari-mac",
      use: {
        connectOptions: {
          wsEndpoint: createWsEndpoint({
            browser: "webkit",
            browser_version: "latest",
            os: "OS X",
            os_version: "Monterey",
            name: "Safari on macOS Monterey",
          }),
        },
      },
    },
    {
      name: "bs-chrome-android",
      use: {
        connectOptions: {
          wsEndpoint: createWsEndpoint({
            browser: "chrome",
            browser_version: "latest",
            os: "android",
            os_version: "13.0",
            device: "Samsung Galaxy S23",
            name: "Chrome on Android (Galaxy S23)",
            realMobile: "true",
          }),
        },
      },
    },
    {
      name: "bs-safari-ios",
      use: {
        connectOptions: {
          wsEndpoint: createWsEndpoint({
            browser: "webkit",
            browser_version: "latest",
            os: "ios",
            os_version: "17",
            device: "iPhone 15 Pro",
            name: "Safari on iOS (iPhone 15 Pro)",
            realMobile: "true",
          }),
        },
      },
    },
  ],
})
