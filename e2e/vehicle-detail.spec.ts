import { test, expect } from "@playwright/test"

test.describe("Vehicle Detail Page", () => {
  test("navigates to a vehicle from inventory", async ({ page }) => {
    await page.goto("/inventory")
    // Wait for inventory to load
    await expect(page.getByText(/vehicles available/i).or(page.getByText(/No vehicles found/i))).toBeVisible({
      timeout: 15_000,
    })

    // Find a "View" link and click it
    const viewLink = page.getByRole("link", { name: /^View$/i }).first()
    const viewLinkVisible = await viewLink.isVisible().catch(() => false)

    if (viewLinkVisible) {
      await viewLink.click()
      await page.waitForURL(/\/vehicles\//)
      // Vehicle detail page should have vehicle info
      await expect(page.locator("main")).toBeVisible()
    } else {
      // No vehicles available — skip gracefully
      test.skip(true, "No vehicles in inventory to navigate to")
    }
  })

  test("vehicle detail page has header and footer", async ({ page }) => {
    await page.goto("/inventory")
    await expect(page.getByText(/vehicles available/i).or(page.getByText(/No vehicles found/i))).toBeVisible({
      timeout: 15_000,
    })

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
    await page.goto("/inventory")
    await expect(page.getByText(/vehicles available/i).or(page.getByText(/No vehicles found/i))).toBeVisible({
      timeout: 15_000,
    })

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
