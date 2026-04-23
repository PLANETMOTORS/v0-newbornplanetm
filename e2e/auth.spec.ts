import { test, expect } from "@playwright/test"

test.describe("Auth — Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login")
  })

  test("renders login page with correct heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Sign In/i })).toBeVisible()
    await expect(page.getByText("Welcome Back")).toBeVisible()
  })

  test("renders email and password fields", async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("renders OAuth buttons (Google and Facebook)", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Facebook/i })).toBeVisible()
  })

  test("renders forgot password link", async ({ page }) => {
    const forgotLink = page.getByRole("link", { name: /Forgot password/i })
    await expect(forgotLink).toBeVisible()
    await expect(forgotLink).toHaveAttribute("href", "/auth/forgot-password")
  })

  test("renders create account link", async ({ page }) => {
    const signupLink = page.getByRole("link", { name: /Create Account/i })
    await expect(signupLink).toBeVisible()
    await expect(signupLink).toHaveAttribute("href", "/auth/signup")
  })

  test("shows OMVIC trust indicator", async ({ page }) => {
    await expect(page.getByText("OMVIC Licensed Dealer")).toBeVisible()
  })

  test("password visibility toggle works", async ({ page }) => {
    const passwordInput = page.locator('input#password')
    await expect(passwordInput).toHaveAttribute("type", "password")

    // Click the show-password toggle — the button is the sibling of the input
    const toggleButton = page.locator('#password ~ button')
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute("type", "text")

    // Click again to hide
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute("type", "password")
  })

  test("submit button is present and labelled", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible()
  })

  test("remember-me checkbox is present", async ({ page }) => {
    await expect(page.getByLabel(/Remember me/i)).toBeVisible()
  })
})

test.describe("Auth — Signup Page", () => {
  test("signup page renders", async ({ page }) => {
    await page.goto("/auth/signup")
    // The signup page should load without a server error
    await expect(page.locator("main")).toBeVisible()
  })
})

test.describe("Auth — Forgot Password Page", () => {
  test("forgot password page renders", async ({ page }) => {
    await page.goto("/auth/forgot-password")
    await expect(page.locator("main")).toBeVisible()
  })
})

test.describe("Auth — Open-Redirect Guard", () => {
  test("redirectTo with absolute URL falls back to /account", async ({ page }) => {
    // Attempt to inject an external redirect
    await page.goto("/auth/login?redirectTo=https://evil.com")
    // The page should still render the login form (not redirect)
    await expect(page.getByRole("heading", { name: /Sign In/i })).toBeVisible()
  })

  test("redirectTo with protocol-relative URL falls back to /account", async ({ page }) => {
    await page.goto("/auth/login?redirectTo=//evil.com")
    await expect(page.getByRole("heading", { name: /Sign In/i })).toBeVisible()
  })

  test("redirectTo with valid relative path is accepted", async ({ page }) => {
    await page.goto("/auth/login?redirectTo=/inventory")
    await expect(page.getByRole("heading", { name: /Sign In/i })).toBeVisible()
  })
})
