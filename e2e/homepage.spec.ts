import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("loads successfully with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Planet Motors/i)
  })

  test("renders header with logo", async ({ page }) => {
    const header = page.locator("header")
    await expect(header).toBeVisible()
    // Planet Motors logo should be present
    const logo = header.locator('a[href="/"]').first()
    await expect(logo).toBeVisible()
  })

  test("renders main navigation links", async ({ page }) => {
    const header = page.locator("header")
    await expect(header.getByText("Shop Inventory")).toBeVisible()
    await expect(header.getByText("Sell or Trade")).toBeVisible()
    await expect(header.getByText("Finance")).toBeVisible()
  })

  test("renders hero section", async ({ page }) => {
    const main = page.locator("main")
    await expect(main).toBeVisible()
    // Homepage content should load
    await expect(main.locator("text=Planet Motors").first()).toBeVisible({ timeout: 15_000 })
  })

  test("renders footer with contact info", async ({ page }) => {
    const footer = page.locator("footer")
    await expect(footer).toBeVisible()
    await expect(footer.getByText(/Planet Motors/i).first()).toBeVisible()
    await expect(footer.getByText(/1-866-797-3332/).first()).toBeVisible()
  })

  test("footer contains important links", async ({ page }) => {
    const footer = page.locator("footer")
    await expect(footer.locator('a[href="/inventory"]').first()).toBeVisible()
    await expect(footer.locator('a[href="/contact"]').first()).toBeVisible()
  })
})
