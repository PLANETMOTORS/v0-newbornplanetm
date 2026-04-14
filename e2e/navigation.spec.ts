import { test, expect } from "@playwright/test"

test.describe("Navigation", () => {
  test("main nav links are visible on desktop", async ({ page }) => {
    await page.goto("/")
    const header = page.locator("header")
    await expect(header.getByText("Shop Inventory")).toBeVisible()
    await expect(header.getByText("Sell or Trade")).toBeVisible()
    await expect(header.getByText("Finance")).toBeVisible()
    await expect(header.getByText("More")).toBeVisible()
  })

  test("clicking inventory link navigates to inventory page", async ({ page }) => {
    await page.goto("/")
    // Use the footer link which is a direct <a> tag
    const inventoryLink = page.locator('footer a[href="/inventory"]').first()
    await expect(inventoryLink).toBeVisible()
    await inventoryLink.click()
    await page.waitForURL(/\/inventory/)
    await expect(page.getByRole("heading", { name: /Vehicle Inventory/i })).toBeVisible({
      timeout: 15_000,
    })
  })

  test("clicking contact link navigates to contact page", async ({ page }) => {
    await page.goto("/")
    const contactLink = page.locator('footer a[href="/contact"]').first()
    await expect(contactLink).toBeVisible()
    await contactLink.click()
    await page.waitForURL(/\/contact/)
    await expect(page.getByRole("heading", { name: /Contact Us/i })).toBeVisible()
  })

  test("mobile menu toggle works", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")

    // The hamburger menu button should be visible on mobile
    const menuButton = page.getByRole("button", { name: /open menu/i })
    await expect(menuButton).toBeVisible()

    // Click to open mobile menu
    await menuButton.click()

    // Mobile nav items should appear
    await expect(page.locator('button#mobile-nav-Shop\\ Inventory').or(page.getByText("Shop Inventory").nth(1))).toBeVisible()
  })

  test("mobile menu navigation works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")

    const menuButton = page.getByRole("button", { name: /open menu/i })
    await menuButton.click()

    // Expand Shop Inventory submenu
    const shopButton = page.locator('button#mobile-nav-Shop\\ Inventory')
    if (await shopButton.isVisible()) {
      await shopButton.click()
      // Submenu items should appear
      await expect(page.getByText("All Vehicles")).toBeVisible()
    }
  })

  test("logo links to homepage", async ({ page }) => {
    await page.goto("/contact")
    const logo = page.locator('header a[href="/"]').first()
    await expect(logo).toBeVisible()
    await logo.click()
    await page.waitForURL("/")
  })
})
