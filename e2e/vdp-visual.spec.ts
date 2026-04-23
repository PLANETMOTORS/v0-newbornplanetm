import { test, expect, type Page } from "@playwright/test"

/**
 * Visual Regression Tests for VDP (Vehicle Detail Page)
 *
 * Protects the Finance-First redesign, Mobile Sticky CTA, and Social Proof
 * layouts from CSS regressions. Uses toHaveScreenshot with masking for
 * dynamic content (images, prices, social proof counts).
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pre-accept cookies so the consent banner doesn't block the page. */
async function dismissCookieConsent(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "pm_cookie_consent",
      JSON.stringify({
        decided: true,
        updatedAt: new Date().toISOString(),
        categories: { essential: true, analytics: false, marketing: false },
      })
    )
  })
}

/**
 * Navigate to inventory, wait for vehicles to load, then click through to the
 * first VDP. Returns true if navigation succeeded, false if no vehicles.
 * This mirrors how real users reach the VDP and avoids SSR auth issues with
 * direct URL access.
 */
async function navigateToFirstVdp(page: Page): Promise<boolean> {
  await page.goto("/inventory")

  // Wait for inventory to load
  const loaded = page.getByText(/vehicles available/i)
    .or(page.getByText(/Error loading inventory/i))
    .or(page.getByText(/No vehicles found/i))
  await expect(loaded.first()).toBeVisible({ timeout: 20_000 })

  const hasVehicles = (await page.getByText(/vehicles available/i).count()) > 0
  if (!hasVehicles) return false

  // Click the first "View" link to navigate to VDP
  const viewLink = page.getByRole("link", { name: /^View$/i }).first()
  const viewLinkVisible = await viewLink.isVisible().catch(() => false)
  if (!viewLinkVisible) return false

  await viewLink.click()
  await page.waitForURL(/\/vehicles\//)

  // Wait for VDP content to render
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 15_000 })
  await page.waitForLoadState("networkidle")
  // Buffer for SWR fetches and lazy components
  await page.waitForTimeout(2000)

  return true
}

/** Disable animations and transitions globally for stable screenshots. */
async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
      img[data-nimg="fill"][style*="blur"] {
        filter: none !important;
      }
    `,
  })
}

/**
 * Locators for elements whose content changes between runs (vehicle images,
 * social proof text). These are masked so only *layout* is compared.
 */
function getDynamicMasks(page: Page) {
  return [
    page.locator("img[data-nimg]"),
    page.locator('[class*="social-proof"], [class*="SocialProof"]'),
    page.locator('[class*="drivee"], [class*="spin-viewer"]'),
  ]
}

// ---------------------------------------------------------------------------
// Desktop VDP — sidebar CTA + finance callout + social proof layout
// ---------------------------------------------------------------------------

test.describe("VDP Desktop — Visual Regression", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page)
  })

  test("full page layout", async ({ page }) => {
    const ok = await navigateToFirstVdp(page)
    test.skip(!ok, "No vehicles available in inventory")
    await disableAnimations(page)

    await expect(page).toHaveScreenshot("vdp-desktop-full.png", {
      fullPage: true,
      mask: getDynamicMasks(page),
    })
  })

  test("sidebar finance callout + CTA group", async ({ page }) => {
    const ok = await navigateToFirstVdp(page)
    test.skip(!ok, "No vehicles available in inventory")
    await disableAnimations(page)

    // Target the "Get Pre-Approved" link's ancestor sticky container
    const preApprovedBtn = page.getByRole("link", { name: /Get Pre-Approved/i }).first()
    await expect(preApprovedBtn).toBeVisible()
    const sidebarCard = preApprovedBtn.locator(
      "xpath=ancestor::div[contains(@class,'sticky') or contains(@class,'card') or contains(@class,'border')]"
    ).first()

    await expect(sidebarCard).toHaveScreenshot("vdp-desktop-sidebar-cta.png", {
      mask: [page.locator('[class*="social-proof"], [class*="SocialProof"]')],
    })
  })
})

// ---------------------------------------------------------------------------
// Mobile VDP — sticky CTA bar
// ---------------------------------------------------------------------------

test.describe("VDP Mobile — Visual Regression", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page)
  })

  test("full page layout", async ({ page }) => {
    const ok = await navigateToFirstVdp(page)
    test.skip(!ok, "No vehicles available in inventory")
    await disableAnimations(page)

    await expect(page).toHaveScreenshot("vdp-mobile-full.png", {
      fullPage: true,
      mask: getDynamicMasks(page),
    })
  })

  test("sticky CTA bar", async ({ page }) => {
    const ok = await navigateToFirstVdp(page)
    test.skip(!ok, "No vehicles available in inventory")
    await disableAnimations(page)

    // The sticky CTA bar is a fixed-bottom element on mobile
    const stickyBar = page.locator(".fixed.bottom-0").first()
    await expect(stickyBar).toBeVisible()
    await expect(stickyBar).toHaveScreenshot("vdp-mobile-sticky-cta.png")
  })
})

// ---------------------------------------------------------------------------
// Finance Application Form — Magic Link UI
// ---------------------------------------------------------------------------

test.describe("Finance Application Form — Visual Regression", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page)
  })

  test("desktop form layout with trust badges", async ({ page }) => {
    await page.goto("/financing/application")
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(1000)
    await disableAnimations(page)

    await expect(page).toHaveScreenshot("finance-form-desktop.png", {
      fullPage: true,
      mask: [page.locator("img[data-nimg]")],
    })
  })
})

test.describe("Finance Application Form Mobile — Visual Regression", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page)
  })

  test("mobile form layout", async ({ page }) => {
    await page.goto("/financing/application")
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(1000)
    await disableAnimations(page)

    await expect(page).toHaveScreenshot("finance-form-mobile.png", {
      fullPage: true,
      mask: [page.locator("img[data-nimg]")],
    })
  })
})
