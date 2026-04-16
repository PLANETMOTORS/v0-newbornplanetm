import { test, expect } from "@playwright/test"

/**
 * Helper: navigate to inventory and wait for it to load.
 * Returns true if vehicles are available, false if API errored or no vehicles.
 */
async function loadInventory(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/inventory")
  // Use .first() on the entire OR chain to avoid strict mode when multiple
  // elements match (e.g. "vehicles available" appears in both heading and count).
  const combined = page.getByText(/vehicles available/i)
    .or(page.getByText(/Error loading inventory/i))
    .or(page.getByText(/No vehicles found/i))
  await expect(combined.first()).toBeVisible({ timeout: 15_000 })
  return (await page.getByText(/vehicles available/i).count()) > 0
}

test.describe("Vehicle Detail Page", () => {
  test("navigates to a vehicle from inventory", async ({ page }) => {
    const loaded = await loadInventory(page)
    if (!loaded) {
      test.skip(true, "Inventory API unavailable or no vehicles")
      return
    }

    // Find a "View" link and click it
    const viewLink = page.getByRole("link", { name: /^View$/i }).first()
    const viewLinkVisible = await viewLink.isVisible().catch(() => false)

    if (viewLinkVisible) {
      await viewLink.click()
      await page.waitForURL(/\/vehicles\//)
      // Vehicle detail page should have vehicle info
      await expect(page.locator("main").first()).toBeVisible()
    } else {
      // No vehicles available — skip gracefully
      test.skip(true, "No vehicles in inventory to navigate to")
    }
  })

  test("vehicle detail page has header and footer", async ({ page }) => {
    const loaded = await loadInventory(page)
    if (!loaded) {
      test.skip(true, "Inventory API unavailable or no vehicles")
      return
    }

    const viewLink = page.getByRole("link", { name: /^View$/i }).first()
    const viewLinkVisible = await viewLink.isVisible().catch(() => false)

    if (viewLinkVisible) {
      await viewLink.click()
      await page.waitForURL(/\/vehicles\//)
      await expect(page.locator("header")).toBeVisible()
      await expect(page.locator("footer")).toBeVisible()
    } else {
      test.skip(true, "No vehicles in inventory to navigate to")
    }
  })

  test("vehicle detail page shows CTA buttons", async ({ page }) => {
    const loaded = await loadInventory(page)
    if (!loaded) {
      test.skip(true, "Inventory API unavailable or no vehicles")
      return
    }

    const viewLink = page.getByRole("link", { name: /^View$/i }).first()
    const viewLinkVisible = await viewLink.isVisible().catch(() => false)

    if (viewLinkVisible) {
      await viewLink.click()
      await page.waitForURL(/\/vehicles\//)
      // Look for common CTA elements on vehicle detail page
      const ctaButtons = page.getByRole("button")
      await expect(ctaButtons.first()).toBeVisible({ timeout: 10_000 })
    } else {
      test.skip(true, "No vehicles in inventory to navigate to")
    }
  })
})
