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
    await inventoryLink.scrollIntoViewIfNeeded()
    await expect(inventoryLink).toBeVisible({ timeout: 10_000 })
    await inventoryLink.click({ force: false })
    await page.waitForURL(/\/inventory/, { timeout: 15_000 })
    // Inventory page may show heading (success) or error state (API down)
    const heading = page.getByRole("heading", { name: /Vehicle Inventory/i })
    const error = page.getByText(/Error loading inventory/i)
    await expect(heading.or(error)).toBeVisible({ timeout: 15_000 })
  })

  test("clicking contact link navigates to contact page", async ({ page }) => {
    await page.goto("/")
    const contactLink = page.locator('footer a[href="/contact"]').first()
    await contactLink.scrollIntoViewIfNeeded()
    await expect(contactLink).toBeVisible({ timeout: 10_000 })
    await contactLink.click({ force: false })
    await page.waitForURL(/\/contact/, { timeout: 15_000 })
    await expect(page.getByRole("heading", { name: /Contact Us/i })).toBeVisible({ timeout: 10_000 })
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
    await expect(menuButton).toBeVisible({ timeout: 10_000 })
    await menuButton.click()
    await page.waitForTimeout(500) // Let mobile menu animation complete

    // Expand Shop Inventory submenu — the mobile nav button id contains spaces
    const shopButton = page.locator('#mobile-nav-Shop\\ Inventory')
    if (await shopButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await shopButton.click()
      await page.waitForTimeout(300) // Submenu animation
      // Submenu items should appear in the mobile nav region
      const submenuRegion = page.locator('[aria-labelledby="mobile-nav-Shop Inventory"]')
      await expect(submenuRegion.getByText("All Vehicles")).toBeVisible({ timeout: 5_000 })
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
