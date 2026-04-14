import { test, expect } from "@playwright/test"

test.describe("Contact Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact")
  })

  test("loads contact page with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Contact Us/i })).toBeVisible()
  })

  test("displays contact methods", async ({ page }) => {
    await expect(page.getByText("1-866-797-3332")).toBeVisible()
    await expect(page.getByText("info@planetmotors.ca")).toBeVisible()
  })

  test("displays business hours", async ({ page }) => {
    await expect(page.getByText(/Business Hours/i)).toBeVisible()
    await expect(page.getByText(/Monday - Friday/i)).toBeVisible()
  })

  test("contact form is visible", async ({ page }) => {
    await expect(page.getByText("Send Us a Message")).toBeVisible()
  })

  test("shows validation errors for empty required fields", async ({ page }) => {
    // Find the first name input and interact with it to trigger validation
    const firstNameInput = page.getByLabel(/first name/i).or(page.locator('input[name="firstName"]')).first()
    
    if (await firstNameInput.isVisible()) {
      // Focus and blur to trigger validation
      await firstNameInput.focus()
      await firstNameInput.blur()
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
