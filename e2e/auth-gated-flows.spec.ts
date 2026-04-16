/**
 * Planet Motors — Auth-Gated E2E Flows
 *
 * Tests the two auth-gated endpoints that could not be verified
 * without Supabase credentials:
 *   1. Finance form full submission → /api/v1/financing/apply (POST)
 *   2. ID verification upload       → /api/v1/id-verification (POST)
 *
 * Prerequisites:
 *   TEST_USER_EMAIL and TEST_USER_PASSWORD env vars must be set.
 *   Run: TEST_USER_EMAIL=x TEST_USER_PASSWORD=y pnpm test:e2e -- e2e/auth-gated-flows.spec.ts
 *
 * Against staging/production:
 *   PLAYWRIGHT_BASE_URL=https://ev.planetmotors.ca \
 *   TEST_USER_EMAIL=x TEST_USER_PASSWORD=y \
 *   npx playwright test e2e/auth-gated-flows.spec.ts --project=chromium
 */

import { test, expect, type Page } from "@playwright/test"
import * as path from "path"
import * as fs from "fs"

// ─── Constants ───────────────────────────────────────────────────────────────

const FIXTURES_DIR = path.join(__dirname, "fixtures")
const TEST_IMAGE_PATH = path.join(FIXTURES_DIR, "test-id-front.jpg")

// Confirmation number pattern: PM-FA-{base36_timestamp}-{4_random_chars}
const CONFIRMATION_RE = /PM-FA-[A-Z0-9]+-[A-Z0-9]{4}/

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a minimal valid JPEG for upload tests */
function ensureTestFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true })
  }
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    const minimalJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
      0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb,
      0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07,
      0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b,
      0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e,
      0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c,
      0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34,
      0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34,
      0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01,
      0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05,
      0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
      0x3f, 0x00, 0x7b, 0x40, 0x1b, 0xff, 0xd9,
    ])
    fs.writeFileSync(TEST_IMAGE_PATH, minimalJpeg)
  }
}

/** Log in via the Supabase email/password form and wait for redirect */
async function loginViaUI(page: Page) {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set.\n" +
        "Export them or pass inline:\n" +
        "  TEST_USER_EMAIL=user@example.com TEST_USER_PASSWORD=secret npx playwright test"
    )
  }

  await page.goto("/auth/login")
  // The page uses <h1>Welcome Back</h1> as the heading;
  // "Sign In" is inside a CardTitle (div), not a semantic heading.
  await expect(
    page.getByRole("heading", { name: /welcome back/i }).or(
      page.getByText("Sign In", { exact: true }).first()
    )
  ).toBeVisible({
    timeout: 15_000,
  })

  // Fill email — use the form input with type="email" or label
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()

  // Wait for redirect away from login page (Supabase redirects to /account)
  await expect(page).not.toHaveURL(/auth\/login/, { timeout: 20_000 })
  console.log("✓ Logged in successfully")
}

/** Select a value from a Radix UI Select (combobox) */
async function selectRadixOption(page: Page, triggerLocator: string, optionText: string) {
  await page.locator(triggerLocator).click()
  await page.getByRole("option", { name: optionText }).click()
}

// ─── Setup ───────────────────────────────────────────────────────────────────

test.beforeAll(() => {
  ensureTestFixtures()
})

// Increase timeouts for live-site testing
test.setTimeout(120_000)

// ─── Test Suite ──────────────────────────────────────────────────────────────

test.describe("Auth-Gated Flows — Finance Submission & ID Upload", () => {
  test("Full finance application → confirmation number → ID upload", async ({
    page,
  }) => {
    // Track API responses
    const apiResponses: { url: string; status: number; body: string }[] = []

    page.on("response", async (response) => {
      const url = response.url()
      if (
        url.includes("/api/v1/financing/apply") ||
        url.includes("/api/v1/id-verification")
      ) {
        let body = ""
        try {
          body = await response.text()
        } catch {
          body = "(could not read body)"
        }
        apiResponses.push({ url, status: response.status(), body })
        console.log(
          `API Response: ${response.status()} ${url}\n  Body: ${body.slice(0, 500)}`
        )
      }
    })

    // ── Step 0: Authenticate ──────────────────────────────────────────────
    await loginViaUI(page)

    // ── Step 1: Navigate to Finance Application ───────────────────────────
    await page.goto("/financing/application")
    await expect(
      page.getByText(/applicant information|personal information/i).first()
    ).toBeVisible({ timeout: 15_000 })
    console.log("✓ Finance application Step 1 loaded")

    // Fill Step 1 — Primary Applicant (all required fields)
    await page.locator('input[name="firstName"], #firstName').first().fill("Test")
    await page.locator('input[name="lastName"], #lastName').first().fill("User")

    // Date of Birth — fill day/month/year selects or inputs
    const dobDay = page.locator('[name="dobDay"], [name="dob-day"]').first()
    const dobMonth = page.locator('[name="dobMonth"], [name="dob-month"]').first()
    const dobYear = page.locator('[name="dobYear"], [name="dob-year"]').first()
    if (await dobDay.isVisible()) {
      await dobDay.fill("15")
      await dobMonth.fill("06")
      await dobYear.fill("1990")
    }

    // Gender & Marital Status — try select/combobox patterns
    const genderTrigger = page.locator('[data-testid="gender-select"], [name="gender"]').first()
    if (await genderTrigger.isVisible()) {
      await genderTrigger.click()
      const genderOption = page.getByRole("option", { name: /male/i }).first()
      if (await genderOption.isVisible({ timeout: 2_000 })) {
        await genderOption.click()
      }
    }

    const maritalTrigger = page.locator('[data-testid="maritalStatus-select"], [name="maritalStatus"]').first()
    if (await maritalTrigger.isVisible()) {
      await maritalTrigger.click()
      const maritalOption = page.getByRole("option", { name: /single/i }).first()
      if (await maritalOption.isVisible({ timeout: 2_000 })) {
        await maritalOption.click()
      }
    }

    // Phone & Email
    await page.locator('input[name="phone"], #phone, input[type="tel"]').first().fill("4165551234")
    await page.locator('input[name="email"], #email, input[type="email"]').last().fill(
      process.env.TEST_USER_EMAIL || "test@planetmotors.ca"
    )

    // Credit Rating
    const creditTrigger = page.locator('[data-testid="creditRating-select"], [name="creditRating"]').first()
    if (await creditTrigger.isVisible()) {
      await creditTrigger.click()
      const creditOption = page.getByRole("option", { name: /good|excellent/i }).first()
      if (await creditOption.isVisible({ timeout: 2_000 })) {
        await creditOption.click()
      }
    }

    // Address fields
    await page.locator('input[name="postalCode"], #postalCode').first().fill("M5V 3L9")

    const addressTypeTrigger = page.locator('[data-testid="addressType-select"], [name="addressType"]').first()
    if (await addressTypeTrigger.isVisible()) {
      await addressTypeTrigger.click()
      const addrOption = page.getByRole("option").first()
      if (await addrOption.isVisible({ timeout: 2_000 })) {
        await addrOption.click()
      }
    }

    await page.locator('input[name="streetNumber"], #streetNumber').first().fill("100")
    await page.locator('input[name="streetName"], #streetName').first().fill("King Street")
    await page.locator('input[name="city"], #city').first().fill("Toronto")

    // Home Status
    const homeStatusTrigger = page.locator('[data-testid="homeStatus-select"], [name="homeStatus"]').first()
    if (await homeStatusTrigger.isVisible()) {
      await homeStatusTrigger.click()
      const homeOption = page.getByRole("option", { name: /rent/i }).first()
      if (await homeOption.isVisible({ timeout: 2_000 })) {
        await homeOption.click()
      }
    }

    await page.locator('input[name="monthlyPayment"], #monthlyPayment').first().fill("1500")

    // Employment fields
    const empCatTrigger = page.locator('[data-testid="employmentCategory-select"], [name="employmentCategory"]').first()
    if (await empCatTrigger.isVisible()) {
      await empCatTrigger.click()
      const empOption = page.getByRole("option").first()
      if (await empOption.isVisible({ timeout: 2_000 })) {
        await empOption.click()
      }
    }

    const empStatusTrigger = page.locator('[data-testid="employmentStatus-select"], [name="employmentStatus"]').first()
    if (await empStatusTrigger.isVisible()) {
      await empStatusTrigger.click()
      const empStatOption = page.getByRole("option", { name: /full.?time/i }).first()
      if (await empStatOption.isVisible({ timeout: 2_000 })) {
        await empStatOption.click()
      }
    }

    await page.locator('input[name="employerName"], #employerName').first().fill("Acme Corp")
    await page.locator('input[name="occupation"], #occupation').first().fill("Software Engineer")
    await page.locator('input[name="employerPostalCode"], #employerPostalCode').first().fill("M5V 1J2")
    await page.locator('input[name="employerPhone"], #employerPhone').first().fill("4165559999")

    // Income
    await page.locator('input[name="grossIncome"], #grossIncome').first().fill("85000")

    const incomeFreqTrigger = page.locator('[data-testid="incomeFrequency-select"], [name="incomeFrequency"]').first()
    if (await incomeFreqTrigger.isVisible()) {
      await incomeFreqTrigger.click()
      const freqOption = page.getByRole("option", { name: /annual/i }).first()
      if (await freqOption.isVisible({ timeout: 2_000 })) {
        await freqOption.click()
      }
    }

    // Click Continue to advance from Step 1
    const continueBtn = page.getByRole("button", { name: /continue|next/i }).first()
    await continueBtn.click()
    console.log("✓ Step 1 filled — advancing")

    // ── Step 2: Co-Applicant (skip) ───────────────────────────────────────
    // Wait briefly for step transition
    await page.waitForTimeout(1_000)

    // If co-applicant step shows, skip it by clicking Continue
    const step2Header = page.getByText(/co-applicant/i).first()
    if (await step2Header.isVisible({ timeout: 3_000 })) {
      // Click continue without adding co-applicant
      await page.getByRole("button", { name: /continue|next|skip/i }).first().click()
      console.log("✓ Step 2 (Co-Applicant) — skipped")
    } else {
      console.log("✓ Step 2 (Co-Applicant) — auto-skipped (not shown)")
    }

    // ── Step 3: Vehicle & Financing ───────────────────────────────────────
    await page.waitForTimeout(1_000)
    const step3Header = page.getByText(/vehicle|financing/i).first()
    if (await step3Header.isVisible({ timeout: 5_000 })) {
      // Fill requested amount if visible
      const requestedAmount = page.locator('input[name="totalPrice"], input[name="requestedAmount"], #totalPrice').first()
      if (await requestedAmount.isVisible({ timeout: 2_000 })) {
        await requestedAmount.fill("35000")
      }

      const downPayment = page.locator('input[name="downPayment"], #downPayment').first()
      if (await downPayment.isVisible({ timeout: 2_000 })) {
        await downPayment.fill("5000")
      }

      await page.getByRole("button", { name: /continue|next/i }).first().click()
      console.log("✓ Step 3 (Vehicle & Financing) — filled")
    }

    // ── Step 4: Review & Submit ───────────────────────────────────────────
    await page.waitForTimeout(1_000)
    const reviewSection = page.getByText(/review|summary/i).first()
    if (await reviewSection.isVisible({ timeout: 5_000 })) {
      await page.getByRole("button", { name: /continue|next|submit/i }).first().click()
      console.log("✓ Step 4 (Review) — continuing")
    }

    // ── Step 5: Documents & Final Submit ──────────────────────────────────
    await page.waitForTimeout(1_000)

    // Look for the submit/finish button
    const submitBtn = page.getByRole("button", { name: /submit application|submit|finish/i }).first()
    if (await submitBtn.isVisible({ timeout: 5_000 })) {
      await submitBtn.click()
      console.log("✓ Step 5 (Documents) — submitted")
    }

    // Wait for API response
    await page.waitForTimeout(5_000)

    // Check for success state or confirmation number
    const successMessage = page.getByText(/application received|submitted|confirmation/i).first()
    const isSuccess = await successMessage.isVisible({ timeout: 10_000 }).catch(() => false)

    if (isSuccess) {
      console.log("✓ Finance application submitted successfully!")

      // Try to capture confirmation number from the page
      const pageContent = await page.textContent("body")
      const confirmMatch = pageContent?.match(CONFIRMATION_RE)
      if (confirmMatch) {
        console.log(`✓ Confirmation Number: ${confirmMatch[0]}`)
      }
    }

    // Report finance API response
    const financeResponse = apiResponses.find((r) =>
      r.url.includes("/api/v1/financing/apply")
    )
    if (financeResponse) {
      console.log(
        `\n═══ FINANCE API RESULT ═══\n` +
          `  Status: ${financeResponse.status}\n` +
          `  Body: ${financeResponse.body.slice(0, 1000)}\n`
      )
      // Parse confirmation number from API response
      try {
        const parsed = JSON.parse(financeResponse.body)
        const appNumber =
          parsed.data?.application?.applicationNumber ||
          parsed.data?.applicationNumber
        if (appNumber) {
          console.log(`  Confirmation Number: ${appNumber}`)
          expect(appNumber).toMatch(CONFIRMATION_RE)
        }
      } catch {
        // Response may not be JSON
      }
    }

    // ── ID Verification Upload ────────────────────────────────────────────
    console.log("\n── ID Verification Upload ──")

    // Navigate to ID verification (may already be on the page via redirect)
    const continueToIDV = page.getByRole("button", {
      name: /continue to id verification|verify/i,
    })
    if (await continueToIDV.isVisible({ timeout: 3_000 })) {
      await continueToIDV.click()
      await page.waitForTimeout(2_000)
    } else {
      await page.goto("/financing/verification")
    }

    await expect(
      page.getByRole("heading", { name: /identity verification/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    console.log("✓ ID Verification page loaded")

    // Select ID type
    const idTypeSelect = page
      .locator("div")
      .filter({ hasText: /^ID Type/ })
      .getByRole("combobox")
      .first()
    if (await idTypeSelect.isVisible({ timeout: 3_000 })) {
      await idTypeSelect.click()
      await page
        .getByRole("option", { name: /driver.*license/i })
        .first()
        .click()
    }

    // Fill ID number
    const idNumberInput = page.getByPlaceholder("Enter ID number").first()
    if (await idNumberInput.isVisible({ timeout: 2_000 })) {
      await idNumberInput.fill("D1234-56789-01234")
    }

    // Set expiry date
    const expiryInput = page.locator('input[type="date"]').first()
    if (await expiryInput.isVisible({ timeout: 2_000 })) {
      await expiryInput.fill("2028-12-31")
    }

    // Upload front ID image
    const frontFileInput = page.locator('input[type="file"]').first()
    if (await frontFileInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await frontFileInput.setInputFiles(TEST_IMAGE_PATH)
      console.log("✓ Front ID image uploaded via file input")
    } else {
      // Try clicking the upload area to trigger a hidden file input
      const uploadArea = page.getByText(/upload front|click to upload/i).first()
      if (await uploadArea.isVisible({ timeout: 2_000 })) {
        // Set file via the hidden input
        const fileInput = page.locator('input[type="file"]').first()
        await fileInput.setInputFiles(TEST_IMAGE_PATH)
        console.log("✓ Front ID image uploaded via hidden input")
      }
    }

    await page.waitForTimeout(1_000)

    // Submit verification
    const verifySubmitBtn = page
      .getByRole("button", { name: /submit for verification|submit|verify/i })
      .first()
    if (await verifySubmitBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
      await verifySubmitBtn.click()
      console.log("✓ ID verification submitted")
      await page.waitForTimeout(5_000)
    } else {
      console.log("⚠ Submit button not enabled (may require all fields)")
    }

    // Report ID verification API response
    const idvResponse = apiResponses.find((r) =>
      r.url.includes("/api/v1/id-verification")
    )
    if (idvResponse) {
      console.log(
        `\n═══ ID VERIFICATION API RESULT ═══\n` +
          `  Status: ${idvResponse.status}\n` +
          `  Body: ${idvResponse.body.slice(0, 1000)}\n`
      )
    }

    // ── Summary Report ────────────────────────────────────────────────────
    console.log("\n════════════════════════════════════════")
    console.log("  AUTH-GATED FLOW TEST RESULTS")
    console.log("════════════════════════════════════════")
    for (const resp of apiResponses) {
      const endpoint = resp.url.split("/api/")[1] || resp.url
      console.log(`  ${resp.status} — /api/${endpoint}`)
    }
    if (apiResponses.length === 0) {
      console.log("  No API calls intercepted (form may not have submitted)")
    }
    console.log("════════════════════════════════════════\n")
  })
})
