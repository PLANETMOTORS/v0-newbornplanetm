import { test, expect } from "@playwright/test"

type Page = import("@playwright/test").Page

/**
 * Helper: navigate to inventory and wait for it to load.
 * Returns true if vehicles are available, false if API errored or no vehicles.
 */
async function loadInventory(page: Page): Promise<boolean> {
  await page.goto("/inventory")
  // Use .first() on the entire OR chain to avoid strict mode when multiple
  // elements match (e.g. "vehicles available" appears in both heading and count).
  const combined = page.getByText(/vehicles available/i)
    .or(page.getByText(/Error loading inventory/i))
    .or(page.getByText(/No vehicles found/i))
  await expect(combined.first()).toBeVisible({ timeout: 15_000 })
  return (await page.getByText(/vehicles available/i).count()) > 0
}

/**
 * Helper: navigate to inventory, find the first "View" link, and navigate to the VDP.
 * Calls test.skip() and returns false if inventory is unavailable or no vehicles exist.
 */
async function navigateToFirstVehicle(page: Page): Promise<boolean> {
  const loaded = await loadInventory(page)
  if (!loaded) {
    test.skip(true, "Inventory API unavailable or no vehicles")
    return false
  }
  const viewLink = page.getByRole("link", { name: /^View$/i }).first()
  const viewLinkVisible = await viewLink.isVisible().catch(() => false)
  if (!viewLinkVisible) {
    test.skip(true, "No vehicles in inventory to navigate to")
    return false
  }
  await viewLink.click()
  await page.waitForURL(/\/vehicles\//)
  return true
}

test.describe("Vehicle Detail Page", () => {
  test("navigates to a vehicle from inventory", async ({ page }) => {
    const navigated = await navigateToFirstVehicle(page)
    if (!navigated) return
    // Vehicle detail page should have vehicle info
    await expect(page.locator("main").first()).toBeVisible()
  })

  test("vehicle detail page has header and footer", async ({ page }) => {
    const navigated = await navigateToFirstVehicle(page)
    if (!navigated) return
    await expect(page.locator("header")).toBeVisible()
    await expect(page.locator("footer")).toBeVisible()
  })

  test("vehicle detail page shows CTA buttons", async ({ page }) => {
    const navigated = await navigateToFirstVehicle(page)
    if (!navigated) return
    // Look for common CTA elements on vehicle detail page
    const ctaButtons = page.getByRole("button")
    await expect(ctaButtons.first()).toBeVisible({ timeout: 10_000 })
  })
})
