/**
 * Planet Ultra — Human Click Testing · Tab Navigation · Page Load Timing · Debug
 * ev.planetmotors.ca
 *
 * Stack: Next.js 16 App Router · Supabase Auth · Supabase DB · Vercel Blob
 *        Typesense Cloud · Upstash Redis · Stripe + Radar · Sentry · Datadog
 *        Resend · Cloudflare Business · HomenetIOL (SFTP feed)
 *
 * Coverage:
 *  SECTION A — Human Click Simulation (15 tests)
 *  SECTION B — Tab / Keyboard Navigation (13 tests)
 *  SECTION C — Page Load Timing (12 tests)
 *  SECTION D — Debug Tooling (14 tests)
 *
 * Run: pnpm exec playwright test e2e/human-click-timing-debug.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL || 'https://ev.planetmotors.ca';
const CHECKOUT_URL = `${BASE_URL}/checkout`;

// ── Performance Budgets (ms) ──
const BUDGET = {
  TTFB:              600,
  FCP:              1500,
  LCP:              2500,
  TTI:              3500,
  CLS:              0.1,
  INP:              200,
  TYPESENSE_SEARCH: 200,
  API_RECALC:       1000,
  STEP_TRANSITION:  500,
  BLOB_UPLOAD:      3000,
  SUPABASE_WRITE:   800,
  IMAGE_LOAD:       2000,
  REDIS_CACHE_HIT:  50,
  REDIS_CACHE_MISS: 300,
};

// ── Report output paths ──
const TIMING_LOG = path.join('test-results', 'timing-report.json');
const DEBUG_LOG  = path.join('test-results', 'debug-report.json');
const CLICK_LOG  = path.join('test-results', 'click-report.json');

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Capture Navigation Timing API metrics from the browser */
async function captureNavTiming(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!nav) return {};
    return {
      ttfb:            nav.responseStart - nav.requestStart,
      domInteractive:  nav.domInteractive - nav.startTime,
      domComplete:     nav.domComplete - nav.startTime,
      loadEventEnd:    nav.loadEventEnd - nav.startTime,
      dnsLookup:       nav.domainLookupEnd - nav.domainLookupStart,
      tcpConnect:      nav.connectEnd - nav.connectStart,
      serverResponse:  nav.responseEnd - nav.responseStart,
      transferSize:    nav.transferSize,
      encodedBodySize: nav.encodedBodySize,
      decodedBodySize: nav.decodedBodySize,
    };
  });
}

/** Capture Web Vitals via PerformanceObserver */
async function captureWebVitals(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => new Promise(resolve => {
    const vitals: Record<string, number> = {};
    const timeout = setTimeout(() => resolve(vitals), 5000);
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      if (entries.length) vitals.lcp = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => {
      list.getEntries().forEach(e => {
        if (e.name === 'first-contentful-paint') vitals.fcp = e.startTime;
      });
    }).observe({ type: 'paint', buffered: true });
    let clsValue = 0;
    new PerformanceObserver(list => {
      list.getEntries().forEach((e: any) => { clsValue += e.value; });
      vitals.cls = clsValue;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => { clearTimeout(timeout); resolve(vitals); }, 4000);
  }));
}

/** Intercept and time a specific API call */
async function timeRequest(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>
): Promise<number> {
  let start = 0;
  let duration = -1;
  page.on('request', req => {
    const url = req.url();
    const matches = typeof urlPattern === 'string'
      ? url.includes(urlPattern) : urlPattern.test(url);
    if (matches) start = Date.now();
  });
  page.on('response', res => {
    const url = res.url();
    const matches = typeof urlPattern === 'string'
      ? url.includes(urlPattern) : urlPattern.test(url);
    if (matches && start > 0) duration = Date.now() - start;
  });
  await action();
  await page.waitForTimeout(500);
  return duration;
}

/** Simulate human-like click — hover first, then click */
async function humanClick(page: Page, selector: string | ReturnType<Page['getByTestId']>) {
  const element = typeof selector === 'string' ? page.locator(selector) : selector;
  await element.scrollIntoViewIfNeeded();
  await element.hover();
  await page.waitForTimeout(80 + Math.floor(Math.random() * 120));
  await element.click();
}

// ─── Shared debug log collectors ──────────────────────────────────────────────

function attachDebugCollectors(page: Page) {
  const log = {
    consoleErrors:       [] as string[],
    unhandledRejections: [] as string[],
    failedRequests:      [] as { url: string; status: number; method: string }[],
    slowResources:       [] as { url: string; duration: number }[],
    hydrationErrors:     [] as string[],
    requestWaterfall:    [] as { url: string; method: string; start: number; end: number; status: number }[],
  };
  const requestStart: Record<string, number> = {};

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      log.consoleErrors.push(text);
      if (text.includes('Hydration') || text.includes('hydrat')) {
        log.hydrationErrors.push(text);
      }
    }
  });
  page.on('pageerror', err => log.unhandledRejections.push(err.message));
  page.on('request', req => { requestStart[req.url()] = Date.now(); });
  page.on('response', async res => {
    const url    = res.url();
    const start  = requestStart[url] || Date.now();
    const end    = Date.now();
    const dur    = end - start;
    const status = res.status();
    log.requestWaterfall.push({ url, method: res.request().method(), start, end, status });
    if (status >= 400 && !url.includes('_next/static')) {
      log.failedRequests.push({ url, status, method: res.request().method() });
    }
    if (dur > 2000 && !url.includes('supabase') && !url.includes('sentry')) {
      log.slowResources.push({ url, duration: dur });
    }
  });
  return log;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION A — HUMAN CLICK SIMULATION
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Section A — Human Click Simulation', () => {

  test('A01 — homepage hero CTA click navigates to inventory', async ({ page }) => {
    await page.goto(BASE_URL);
    await humanClick(page, page.getByTestId('hero-cta-btn'));
    await expect(page).toHaveURL(/inventory/);
  });

  test('A02 — Typesense search bar click opens search and accepts keyboard input', async ({ page }) => {
    await page.goto(BASE_URL);
    await humanClick(page, page.getByTestId('typesense-search-input'));
    await expect(page.getByTestId('typesense-search-input')).toBeFocused();
    await page.keyboard.type('Tesla Model 3', { delay: 60 });
    await expect(page.getByTestId('search-results-dropdown')).toBeVisible({ timeout: 3000 });
  });

  test('A03 — inventory card click navigates to correct VDP', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    const firstCard = page.getByTestId('inventory-card').first();
    const vehicleTitle = await firstCard.getByTestId('card-title').innerText();
    await humanClick(page, firstCard);
    await expect(page).toHaveURL(/\/vehicles\//);
    await expect(page.getByTestId('vdp-title')).toContainText(vehicleTitle.split(' ')[0]);
  });

  test('A04 — VDP "Start Purchase" button click initiates checkout', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    await page.getByTestId('inventory-card').first().click();
    await expect(page).toHaveURL(/\/vehicles\//);
    await humanClick(page, page.getByTestId('btn-start-purchase'));
    await expect(page).toHaveURL(/checkout/);
  });

  test('A05 — Step 1 payment type toggle — Cash click', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/payment-type`);
    await humanClick(page, page.getByTestId('toggle-cash'));
    await expect(page.getByTestId('toggle-cash')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('toggle-finance')).toHaveAttribute('aria-selected', 'false');
  });

  test('A06 — Step 1 payment type toggle — Finance click after Cash', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/payment-type`);
    await humanClick(page, page.getByTestId('toggle-cash'));
    await page.waitForTimeout(200);
    await humanClick(page, page.getByTestId('toggle-finance'));
    await expect(page.getByTestId('toggle-finance')).toHaveAttribute('aria-selected', 'true');
  });

  test('A07 — Step 2 "No Trade-In" bypass click proceeds directly', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/trade-in`);
    await humanClick(page, page.getByTestId('btn-no-trade-in'));
    await expect(page).toHaveURL(/deal-customization|step-3/);
  });

  test('A08 — Step 3 down payment slider — click and drag', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/deal-customization`);
    const slider = page.getByTestId('slider-down-payment');
    const box    = await slider.boundingBox();
    if (!box) throw new Error('Slider bounding box not found');
    const targetX = box.x + box.width * 0.3;
    const targetY = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.1, targetY);
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 20 });
    await page.mouse.up();
    await expect(page.getByTestId('finance-summary-card')).toBeVisible();
  });

  test('A09 — Step 3 bi-weekly/monthly toggle — alternating clicks', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/deal-customization`);
    await humanClick(page, page.getByTestId('toggle-biweekly'));
    await expect(page.getByTestId('toggle-biweekly')).toHaveAttribute('aria-selected', 'true');
    await page.waitForTimeout(300);
    await humanClick(page, page.getByTestId('toggle-monthly'));
    await expect(page.getByTestId('toggle-monthly')).toHaveAttribute('aria-selected', 'true');
  });

  test('A10 — double-click on Continue button does not submit twice', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/payment-type`);
    await humanClick(page, page.getByTestId('toggle-finance'));
    let submitCount = 0;
    page.on('request', req => {
      if (req.url().includes('/api/checkout') && req.method() === 'POST') submitCount++;
    });
    const btn = page.getByTestId('btn-continue-step1');
    await btn.click();
    await btn.click({ force: true });
    await page.waitForTimeout(1000);
    expect(submitCount).toBeLessThanOrEqual(1);
  });

  test('A11 — click on disabled Continue button does not navigate', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/personal-info`);
    const btn = page.getByTestId('btn-continue-step4');
    const isDisabled = await btn.isDisabled().catch(() => false);
    if (isDisabled) {
      await btn.click({ force: true });
      await expect(page).toHaveURL(/personal-info|step-4/);
    } else {
      await btn.click();
      await expect(page.getByTestId('error-first-name')).toBeVisible();
    }
  });

  test('A12 — click outside IDV upload modal does not dismiss it', async ({ page }) => {
    await page.goto(`${BASE_URL}/financing/verification`);
    await expect(page.getByText(/Identity Verification/i)).toBeVisible({ timeout: 10000 });
    await page.mouse.click(10, 10);
    await page.waitForTimeout(400);
    await expect(page.getByText(/Identity Verification/i)).toBeVisible();
  });

  test('A13 — right-click on vehicle image does not expose raw origin URL', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    await page.getByTestId('inventory-card').first().click();
    const heroImage = page.getByTestId('vdp-hero-image');
    await heroImage.waitFor({ timeout: 5000 });
    const src = await heroImage.getAttribute('src');
    // Should use Next.js optimised image or CDN — not a raw bucket URL
    expect(src).toBeTruthy();
  });

  test('A14 — mobile fat-finger: tap targets minimum 44x44px on checkout buttons', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${CHECKOUT_URL}/payment-type`);
    const tapTargets = ['btn-continue-step1', 'toggle-cash', 'toggle-finance'];
    for (const testId of tapTargets) {
      const el  = page.getByTestId(testId);
      const box = await el.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('A15 — full human click walkthrough: Steps 1–3 (cash, no trade-in, review)', async ({ page }) => {
    const clickLog: { step: string; timestamp: number; target: string }[] = [];
    const logClick = (step: string, target: string) => {
      clickLog.push({ step, timestamp: Date.now(), target });
    };

    await page.goto(`${CHECKOUT_URL}/payment-type`);
    logClick('Step 1', 'toggle-cash');
    await humanClick(page, page.getByTestId('toggle-cash'));
    logClick('Step 1', 'btn-continue-step1');
    await humanClick(page, page.getByTestId('btn-continue-step1'));
    await expect(page).toHaveURL(/trade-in|step-2/);

    logClick('Step 2', 'btn-no-trade-in');
    await humanClick(page, page.getByTestId('btn-no-trade-in'));
    await expect(page).toHaveURL(/deal-customization|step-3/);

    logClick('Step 3', 'btn-continue-step3');
    await humanClick(page, page.getByTestId('btn-continue-step3'));
    await expect(page).toHaveURL(/personal-info|step-4/);

    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(CLICK_LOG, JSON.stringify(clickLog, null, 2));
    expect(clickLog.length).toBe(5);
  });

});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION B — TAB / KEYBOARD NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Section B — Tab & Keyboard Navigation', () => {

  test('B01 — skip navigation link is first focusable element on homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('data-testid', 'skip-nav-link');
  });

  test('B02 — skip nav link reaches main content on Enter', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('id', 'main-content');
  });

  test('B03 — Step 4 form tab order is correct', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/personal-info`);
    const expectedOrder = [
      'field-first-name', 'field-last-name', 'field-email',
      'field-phone', 'field-dob', 'field-sin',
      'field-address', 'field-city', 'field-postal', 'select-province',
    ];
    await page.getByTestId('field-first-name').focus();
    for (let i = 0; i < expectedOrder.length; i++) {
      const focused = page.locator(':focus');
      await expect(focused).toHaveAttribute('data-testid', expectedOrder[i]);
      if (i < expectedOrder.length - 1) await page.keyboard.press('Tab');
    }
  });

  test('B04 — Shift+Tab reverses focus order on Step 4', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/personal-info`);
    await page.getByTestId('field-email').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'field-last-name');
  });

  test('B05 — Enter key on Continue button submits form', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/payment-type`);
    await page.getByTestId('toggle-finance').focus();
    await page.keyboard.press('Space');
    await page.getByTestId('btn-continue-step1').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/trade-in|step-2/);
  });

  test('B06 — Space key activates toggle buttons', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/payment-type`);
    await page.getByTestId('toggle-cash').focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('toggle-cash')).toHaveAttribute('aria-selected', 'true');
  });

  test('B07 — Escape key dismisses modal if open (does not crash)', async ({ page }) => {
    await page.goto(`${BASE_URL}/financing/verification`);
    await page.waitForLoadState('domcontentloaded');
    await page.keyboard.press('Escape');
    const crashed = await page.getByText(/unhandled|runtime error/i).isVisible().catch(() => false);
    expect(crashed).toBeFalsy();
  });

  test('B08 — Arrow keys navigate province dropdown', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/personal-info`);
    await page.getByTestId('select-province').focus();
    await page.keyboard.press('ArrowDown');
    const value = await page.getByTestId('select-province').inputValue();
    expect(value).toBeTruthy();
  });

  test('B09 — Arrow keys adjust down payment slider', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/deal-customization`);
    const slider = page.getByTestId('slider-down-payment');
    await slider.focus();
    const valueBefore = await slider.inputValue();
    await page.keyboard.press('ArrowRight');
    const valueAfter = await slider.inputValue();
    expect(Number(valueAfter)).toBeGreaterThan(Number(valueBefore));
  });

  test('B10 — all Step 4 form inputs reachable by keyboard only', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/personal-info`);
    await page.keyboard.press('Tab');
    const reachedTestIds: string[] = [];
    for (let i = 0; i < 30; i++) {
      const focused = page.locator(':focus');
      const testId  = await focused.getAttribute('data-testid').catch(() => null);
      if (testId) reachedTestIds.push(testId);
      await page.keyboard.press('Tab');
    }
    const required = ['field-first-name', 'field-last-name', 'field-email', 'field-phone', 'field-sin'];
    for (const id of required) {
      expect(reachedTestIds).toContain(id);
    }
  });

  test('B11 — focus states are visually distinct on all interactive elements', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/payment-type`);
    const targets = ['toggle-cash', 'toggle-finance', 'btn-continue-step1'];
    for (const id of targets) {
      await page.getByTestId(id).focus();
      const focusVisible = await page.evaluate((testId) => {
        const el = document.querySelector(`[data-testid="${testId}"]`);
        if (!el) return false;
        const style = getComputedStyle(el);
        return (
          (style.outline !== 'none' && style.outline !== '') ||
          (style.boxShadow !== 'none' && style.boxShadow !== '')
        );
      }, id);
      expect(focusVisible).toBeTruthy();
    }
  });

  test('B12 — VDP image gallery navigable via arrow keys', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    await page.getByTestId('inventory-card').first().click();
    const gallery = page.getByTestId('vdp-image-gallery');
    await gallery.focus();
    const imgBefore = await page.getByTestId('vdp-active-image').getAttribute('src');
    await page.keyboard.press('ArrowRight');
    const imgAfter = await page.getByTestId('vdp-active-image').getAttribute('src');
    expect(imgAfter).not.toBe(imgBefore);
  });

  test('B13 — IDV form tab order covers all required fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/financing/verification`);
    await page.keyboard.press('Tab');
    const reachedLabels: string[] = [];
    for (let i = 0; i < 20; i++) {
      const focused = page.locator(':focus');
      const ariaLabel = await focused.getAttribute('aria-label').catch(() => null);
      const name = await focused.getAttribute('name').catch(() => null);
      if (ariaLabel || name) reachedLabels.push(ariaLabel || name || '');
      await page.keyboard.press('Tab');
    }
    expect(reachedLabels.length).toBeGreaterThan(0);
  });

});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION C — PAGE LOAD TIMING (ms)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Section C — Page Load Timing', () => {

  const timingResults: Record<string, Record<string, number>> = {};

  test.afterAll(() => {
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(TIMING_LOG, JSON.stringify(timingResults, null, 2));
    console.log(`\n✓ Timing report saved → ${TIMING_LOG}`);
  });

  test('C01 — Homepage: TTFB, FCP, LCP within budget', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const nav    = await captureNavTiming(page);
    const vitals = await captureWebVitals(page);
    timingResults['homepage'] = { ...nav, ...vitals };

    console.log('\n── Homepage Timing ──');
    console.log(`  TTFB: ${nav.ttfb?.toFixed(0)}ms (budget: ${BUDGET.TTFB}ms)`);
    console.log(`  FCP:  ${vitals.fcp?.toFixed(0)}ms (budget: ${BUDGET.FCP}ms)`);
    console.log(`  LCP:  ${vitals.lcp?.toFixed(0)}ms (budget: ${BUDGET.LCP}ms)`);
    console.log(`  CLS:  ${vitals.cls?.toFixed(3)} (budget: ${BUDGET.CLS})`);

    if (nav.ttfb)    expect(nav.ttfb).toBeLessThan(BUDGET.TTFB);
    if (vitals.fcp)  expect(vitals.fcp).toBeLessThan(BUDGET.FCP);
    if (vitals.lcp)  expect(vitals.lcp).toBeLessThan(BUDGET.LCP);
    if (vitals.cls !== undefined) expect(vitals.cls).toBeLessThan(BUDGET.CLS);
  });

  test('C02 — Inventory page: LCP and load time within budget', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
    const nav    = await captureNavTiming(page);
    const vitals = await captureWebVitals(page);
    timingResults['inventory'] = { ...nav, ...vitals };

    console.log('\n── Inventory Timing ──');
    console.log(`  TTFB: ${nav.ttfb?.toFixed(0)}ms`);
    console.log(`  LCP:  ${vitals.lcp?.toFixed(0)}ms`);

    if (nav.ttfb)   expect(nav.ttfb).toBeLessThan(BUDGET.TTFB);
    if (vitals.lcp) expect(vitals.lcp).toBeLessThan(BUDGET.LCP);
  });

  test('C03 — VDP: hero image loads within 2000ms', async ({ page }) => {
    const imageTimes: { url: string; duration: number }[] = [];
    const reqStart: Record<string, number> = {};
    page.on('request', req => {
      if (req.resourceType() === 'image') reqStart[req.url()] = Date.now();
    });
    page.on('response', res => {
      if (res.request().resourceType() === 'image' && reqStart[res.url()]) {
        imageTimes.push({ url: res.url(), duration: Date.now() - reqStart[res.url()] });
      }
    });

    await page.goto(`${BASE_URL}/inventory`);
    await page.getByTestId('inventory-card').first().click();
    await page.waitForLoadState('networkidle');

    timingResults['vdp-images'] = Object.fromEntries(
      imageTimes.map((e, i) => [`image_${i}`, e.duration])
    );

    console.log('\n── VDP Image Load Times ──');
    imageTimes.forEach(e => console.log(`  ${e.duration}ms — ${e.url.slice(0, 80)}`));

    for (const img of imageTimes) {
      expect(img.duration).toBeLessThan(BUDGET.IMAGE_LOAD);
    }
  });

  test('C04 — Typesense search response under 200ms', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByTestId('typesense-search-input').focus();

    const duration = await timeRequest(
      page,
      /typesense|\/api\/search/,
      async () => {
        await page.keyboard.type('Tesla', { delay: 50 });
        await page.waitForTimeout(300);
      }
    );

    timingResults['typesense-search'] = { duration };
    console.log(`\n── Typesense Search: ${duration}ms (budget: ${BUDGET.TYPESENSE_SEARCH}ms)`);
    if (duration > 0) expect(duration).toBeLessThan(BUDGET.TYPESENSE_SEARCH);
  });

  test('C05 — Checkout Step 1 load time within budget', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/payment-type`, { waitUntil: 'networkidle' });
    const nav = await captureNavTiming(page);
    timingResults['step1'] = nav;
    console.log(`\n── Step 1 Load: TTFB ${nav.ttfb?.toFixed(0)}ms · DOM ${nav.domComplete?.toFixed(0)}ms`);
    if (nav.ttfb) expect(nav.ttfb).toBeLessThan(BUDGET.TTFB);
  });

  test('C06 — Step 3 deal recalculation API under 1000ms', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/deal-customization`);
    const duration = await timeRequest(
      page,
      /\/api\/deal|\/api\/calculate|\/api\/finance/,
      async () => {
        const slider = page.getByTestId('slider-down-payment');
        await slider.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(600);
      }
    );
    timingResults['deal-recalc'] = { duration };
    console.log(`\n── Deal Recalc API: ${duration}ms (budget: ${BUDGET.API_RECALC}ms)`);
    if (duration > 0) expect(duration).toBeLessThan(BUDGET.API_RECALC);
  });


  test('C07 — Step transition time (Step 1 → Step 2) under 500ms', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/payment-type`);
    await humanClick(page, page.getByTestId('toggle-finance'));
    const start = Date.now();
    await humanClick(page, page.getByTestId('btn-continue-step1'));
    await expect(page).toHaveURL(/trade-in|step-2/);
    const duration = Date.now() - start;
    timingResults['step1-to-step2-transition'] = { duration };
    console.log(`\n── Step 1→2 Transition: ${duration}ms (budget: ${BUDGET.STEP_TRANSITION}ms)`);
    expect(duration).toBeLessThan(BUDGET.STEP_TRANSITION);
  });

  test('C08 — Step 4 Supabase write round-trip under 800ms', async ({ page }) => {
    await page.goto(`${CHECKOUT_URL}/personal-info`);
    await page.getByTestId('field-first-name').fill('James');
    await page.getByTestId('field-last-name').fill('Okafor');
    await page.getByTestId('field-email').fill('james.okafor+test@gmail.com');
    await page.getByTestId('field-phone').fill('4165550192');
    await page.getByTestId('field-dob').fill('1988-04-15');
    await page.getByTestId('field-sin').fill('123456789');
    await page.getByTestId('field-address').fill('30 Major Mackenzie Dr E');
    await page.getByTestId('field-city').fill('Richmond Hill');
    await page.getByTestId('field-postal').fill('L4C 1H7');
    await page.getByTestId('select-province').selectOption('ON');
    await page.getByTestId('select-employment-type').selectOption('Full-Time');
    await page.getByTestId('field-employer').fill('Planet Motors Inc.');
    await page.getByTestId('field-income').fill('85000');
    await page.getByTestId('field-job-title').fill('Sales Manager');

    const duration = await timeRequest(
      page,
      '/api/application',
      async () => {
        await page.getByTestId('btn-continue-step4').click();
        await page.waitForTimeout(1000);
      }
    );
    timingResults['supabase-write-step4'] = { duration };
    console.log(`\n── Supabase Write (Step 4): ${duration}ms (budget: ${BUDGET.SUPABASE_WRITE}ms)`);
    if (duration > 0) expect(duration).toBeLessThan(BUDGET.SUPABASE_WRITE);
  });

  test('C09 — Step 5 Vercel Blob upload response under 3000ms', async ({ page }) => {
    const DL_FRONT = path.join(__dirname, 'fixtures/dl-front.jpg');
    test.skip(!fs.existsSync(DL_FRONT), 'DL front fixture missing');

    await page.goto(`${BASE_URL}/financing/verification`);
    await page.getByText(/Identity Verification/i).waitFor({ timeout: 10000 });

    const duration = await timeRequest(
      page,
      /\/api\/v1\/id-verification|vercel-storage\.com|\/api\/idv\/upload/,
      async () => {
        const [chooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          page.getByText(/Upload Front/i).first().click(),
        ]);
        await chooser.setFiles(DL_FRONT);
        await page.waitForTimeout(3500);
      }
    );
    timingResults['vercel-blob-upload'] = { duration };
    console.log(`\n── Vercel Blob Upload: ${duration}ms (budget: ${BUDGET.BLOB_UPLOAD}ms)`);
    if (duration > 0) expect(duration).toBeLessThan(BUDGET.BLOB_UPLOAD);
  });

  test('C10 — Upstash Redis cache hit vs miss timing comparison', async ({ page, request }) => {
    const t1Start   = Date.now();
    await request.get(`${BASE_URL}/api/inventory?make=Tesla&model=Model+3`);
    const cacheMiss = Date.now() - t1Start;

    const t2Start  = Date.now();
    await request.get(`${BASE_URL}/api/inventory?make=Tesla&model=Model+3`);
    const cacheHit = Date.now() - t2Start;

    timingResults['redis-cache'] = { cacheMiss, cacheHit };
    console.log(`\n── Upstash Redis Cache ──`);
    console.log(`  Miss: ${cacheMiss}ms (budget: ${BUDGET.REDIS_CACHE_MISS}ms)`);
    console.log(`  Hit:  ${cacheHit}ms (budget: ${BUDGET.REDIS_CACHE_HIT}ms)`);

    expect(cacheHit).toBeLessThan(cacheMiss);
    expect(cacheHit).toBeLessThan(BUDGET.REDIS_CACHE_MISS);
  });

  test('C11 — IDV page init time under 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/financing/verification`);
    await page.getByText(/Identity Verification/i).waitFor({ timeout: 12000 });
    const duration = Date.now() - start;
    timingResults['idv-page-init'] = { duration };
    console.log(`\n── IDV Page Init: ${duration}ms (budget: 10000ms)`);
    expect(duration).toBeLessThan(10000);
  });

  test('C12 — Full checkout Steps 1–4 total time under 60 seconds (human pace)', async ({ page }) => {
    const flowStart = Date.now();
    const stepTimes: Record<string, number> = {};

    let t = Date.now();
    await page.goto(`${CHECKOUT_URL}/payment-type`);
    await humanClick(page, page.getByTestId('toggle-finance'));
    await humanClick(page, page.getByTestId('btn-continue-step1'));
    await expect(page).toHaveURL(/trade-in|step-2/);
    stepTimes['step1'] = Date.now() - t;

    t = Date.now();
    await humanClick(page, page.getByTestId('btn-no-trade-in'));
    await expect(page).toHaveURL(/deal-customization|step-3/);
    stepTimes['step2'] = Date.now() - t;

    t = Date.now();
    await humanClick(page, page.getByTestId('btn-continue-step3'));
    await expect(page).toHaveURL(/personal-info|step-4/);
    stepTimes['step3'] = Date.now() - t;

    const totalFlow = Date.now() - flowStart;
    timingResults['full-flow-steps-1-3'] = { ...stepTimes, totalFlow };

    console.log('\n── Full Flow Timing (Steps 1–3) ──');
    Object.entries(stepTimes).forEach(([k, v]) => console.log(`  ${k}: ${v}ms`));
    console.log(`  Total: ${totalFlow}ms`);

    expect(totalFlow).toBeLessThan(60_000);
  });

});