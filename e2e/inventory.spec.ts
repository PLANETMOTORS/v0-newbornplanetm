import { test, expect } from "@playwright/test"

test.describe("Inventory Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory")
  })

  test("loads inventory page with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Vehicle Inventory/i })).toBeVisible({
      timeout: 15_000,
    })
  })

  test("displays vehicle count", async ({ page }) => {
    // Wait for inventory to load — look for the "vehicles available" text
    await expect(page.getByText(/vehicles available/i)).toBeVisible({ timeout: 15_000 })
  })

  test("renders search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first()
    await expect(searchInput).toBeVisible({ timeout: 15_000 })
  })

  test("search input accepts text", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first()
    await expect(searchInput).toBeVisible({ timeout: 15_000 })
    await searchInput.fill("Toyota")
    await expect(searchInput).toHaveValue("Toyota")
  })

  test("filter button is visible", async ({ page }) => {
    await expect(page.getByText(/vehicles available/i)).toBeVisible({ timeout: 15_000 })
    const filterBtn = page.getByRole("button", { name: /filter/i }).first()
    await expect(filterBtn).toBeVisible()
  })

  test("sort dropdown is present", async ({ page }) => {
    await expect(page.getByText(/vehicles available/i)).toBeVisible({ timeout: 15_000 })
    const sortSelect = page.locator("select").first()
    await expect(sortSelect).toBeVisible()
  })

  test("renders vehicle cards or no-results message", async ({ page }) => {
    await expect(page.getByText(/vehicles available/i).or(page.getByText(/No vehicles found/i))).toBeVisible({
      timeout: 15_000,
    })
  })
})
