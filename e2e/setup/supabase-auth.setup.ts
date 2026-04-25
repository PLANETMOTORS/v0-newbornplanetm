/**
 * Planet Ultra — Supabase Auth Setup
 * ev.planetmotors.ca
 *
 * Generates authenticated Supabase session storageState
 * used as a dependency by financing flow tests (Steps 4 & 5).
 *
 * Run automatically before test suite via globalSetup project
 * or manually: npx playwright test --project=setup
 *
 * Env vars required:
 *   TEST_USER_EMAIL
 *   TEST_USER_PASSWORD
 */

import { test as setup, expect } from "@playwright/test"
import * as path from "node:path"
import * as fs from "node:fs"

const AUTH_FILE = path.join(__dirname, ".auth/user.json")

setup("authenticate via Supabase", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in environment.\n" +
        "Add them to your .env.test or GitHub Actions secrets."
    )
  }

  // Ensure auth directory exists
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  // Navigate to the login page
  await page.goto("/auth/login")

  // Supabase login flow — email + password
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()

  // Wait for authenticated state — Supabase redirects after login
  await expect(page).not.toHaveURL(/auth\/login/, { timeout: 15000 })

  // Confirm Supabase session cookies are present
  const cookies = await page.context().cookies()
  const supabaseCookie = cookies.find(
    (c) =>
      c.name.includes("sb-") ||
      c.name.includes("supabase") ||
      c.name.startsWith("sb-")
  )

  if (!supabaseCookie) {
    console.warn(
      "⚠️  No Supabase cookie found — auth may rely on localStorage tokens"
    )
  }

  // Save storage state for reuse across all authenticated tests
  await page.context().storageState({ path: AUTH_FILE })

  console.log(`✓ Supabase auth state saved to ${AUTH_FILE}`)
})
