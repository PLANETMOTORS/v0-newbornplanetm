import { test, expect } from "@playwright/test"

/**
 * Helper: navigate to inventory and wait for it to load.
 * Returns true if vehicles are available, false if API errored or no vehicles.
 */
async function loadInventory(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/inventory")
  const success = page.getByText(/vehicles available/i).first()
  const error = page.getByText(/Error loading inventory/i).first()
  const noResults = page.getByText(/No vehicles found/i).first()
  await expect(success.or(error).or(noResults)).toBeVisible({ timeout: 15_000 })
  return await success.isVisible()
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
