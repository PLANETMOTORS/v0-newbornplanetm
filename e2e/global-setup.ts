import { FullConfig, chromium } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  // Pre-warm the dev server
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000', { timeout: 30000 });
  } catch {
    // Server might not be ready yet
  }
  await browser.close();
}

export default globalSetup;
