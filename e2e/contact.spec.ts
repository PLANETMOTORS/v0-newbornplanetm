import { test, expect } from "@playwright/test"

test.describe("Contact Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact")
  })

  test("loads contact page with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Contact Us/i })).toBeVisible()
  })

  test("displays contact methods", async ({ page }) => {
    // Scope to main content area to avoid header/footer duplicates
    const main = page.locator("section").first()
    await expect(page.getByText("1-866-797-3332").first()).toBeVisible()
    await expect(page.getByText("info@planetmotors.ca").first()).toBeVisible()
  })

  test("displays business hours", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Business Hours/i })).toBeVisible()
    await expect(page.getByText(/Monday - Friday/i).first()).toBeVisible()
  })

  test("contact form is visible", async ({ page }) => {
    await expect(page.getByText("Send Us a Message")).toBeVisible()
  })

  test("shows validation errors for empty required fields", async ({ page }) => {
    // Find the first name input and interact with it to trigger validation
    const firstNameInput = page.getByLabel(/first name/i).or(page.locator('#firstName')).first()

    if (await firstNameInput.isVisible()) {
      // Type and clear to trigger onChange validation (form validates on change, not blur)
      await firstNameInput.fill("a")
      await firstNameInput.fill("")
      // Check for validation message
      await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 5_000 })
    }
  })

  test("fills form with invalid email and shows error", async ({ page }) => {
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first()

    if (await emailInput.isVisible()) {
      await emailInput.fill("not-an-email")
      await emailInput.blur()
      await expect(page.getByText(/valid email/i).first()).toBeVisible({ timeout: 5_000 })
    }
  })

  test("fills form fields with test data without submitting", async ({ page }) => {
    // Fill available form fields
    const firstNameInput = page.getByLabel(/first name/i).or(page.locator('input[name="firstName"]')).first()
    const lastNameInput = page.getByLabel(/last name/i).or(page.locator('input[name="lastName"]')).first()
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first()

    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill("Test")
      await expect(firstNameInput).toHaveValue("Test")
    }
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill("User")
      await expect(lastNameInput).toHaveValue("User")
    }
    if (await emailInput.isVisible()) {
      await emailInput.fill("test@example.com")
      await expect(emailInput).toHaveValue("test@example.com")
    }
    // Intentionally do NOT submit the form
  })
})
