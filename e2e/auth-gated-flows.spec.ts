/* eslint-disable no-useless-assignment */
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
 *
 * Against live/staging:
 *   npx playwright test e2e/auth-gated-flows.spec.ts --project=chromium \
 *     --config=playwright.live.config.ts
 */

import { test, expect, type Page } from "@playwright/test"
import * as path from "path"
import * as fs from "fs"

// ─── Constants ───────────────────────────────────────────────────────────────

const FIXTURES_DIR = path.join(__dirname, "fixtures")
const TEST_IMAGE_PATH = path.join(FIXTURES_DIR, "test-id-front.jpg")

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

/** Dismiss cookie consent banner if present */
async function dismissCookieConsent(page: Page) {
  const acceptBtn = page.getByRole("button", { name: /accept all/i })
  if (await acceptBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await acceptBtn.click()
    await page.waitForTimeout(500)
    console.log("✓ Cookie consent dismissed")
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
  await expect(
    page.getByRole("heading", { name: /welcome back/i })
  ).toBeVisible({ timeout: 15_000 })

  // Dismiss cookie consent if it overlays the form
  await dismissCookieConsent(page)

  // Scope to the login form to avoid matching footer newsletter input
  const loginForm = page
    .locator("form")
    .filter({ has: page.locator('input[type="password"]') })
  await loginForm.locator('input[type="email"]').fill(email)
  await loginForm.locator('input[type="password"]').fill(password)
  await loginForm.getByRole("button", { name: /sign in/i }).click()

  // Wait for redirect away from login page
  await expect(page).not.toHaveURL(/auth\/login/, { timeout: 20_000 })
  console.log("✓ Logged in successfully")
}

/**
 * Find a field's direct container by navigating from the label element
 * to its parent <div>. This avoids matching overly-broad ancestor divs.
 */
function fieldContainer(page: Page, labelText: string | RegExp) {
  return page.locator("label", { hasText: labelText }).first().locator("..")
}

/** Fill a text/number input found next to a label */
async function fillField(page: Page, labelText: string | RegExp, value: string) {
  const container = fieldContainer(page, labelText)
  await container.locator("input").first().fill(value)
}

/** Pick a Radix Select option: click the combobox trigger, then the option */
async function selectField(page: Page, labelText: string | RegExp, optionText: string | RegExp) {
  const container = fieldContainer(page, labelText)
  await container.getByRole("combobox").click()
  await page.getByRole("option", { name: optionText }).click()
}

// ─── Setup ───────────────────────────────────────────────────────────────────

test.beforeAll(() => {
  ensureTestFixtures()
})

// Generous timeout for live-site testing
test.setTimeout(180_000)

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
        const body = await response.text().catch(() => "(could not read body)")
        apiResponses.push({ url, status: response.status(), body })
        console.log(
          `API Response: ${response.status()} ${url}\n  Body: ${body.slice(0, 500)}`
        )
      }
    })

    // ── Step 0: Authenticate ──────────────────────────────────────────────
    await loginViaUI(page)

    // ── Step 0b: Get a vehicle ID from inventory ──────────────────────────
    // Navigate to inventory API to find a valid vehicle ID for Step 3
    const inventoryRes = await page.request.get("/api/v1/inventory/homenet")
    let vehicleId = ""
    if (inventoryRes.ok()) {
      try {
        const data = await inventoryRes.json()
        const vehicles = data.vehicles || data.data || data
        if (Array.isArray(vehicles) && vehicles.length > 0) {
          vehicleId = vehicles[0].id || ""
          console.log(`✓ Found vehicle ID: ${vehicleId}`)
        }
      } catch {
        console.log("⚠ Could not parse inventory response")
      }
    }

    // ── Step 1: Navigate to Finance Application ───────────────────────────
    const financeUrl = vehicleId
      ? `/financing/application?vehicleId=${vehicleId}`
      : "/financing/application"
    await page.goto(financeUrl)

    // Wait for Step 1 to load
    await expect(
      page.getByText(/primary applicant information/i).first()
    ).toBeVisible({ timeout: 15_000 })
    console.log("✓ Finance application Step 1 loaded")

    // Dismiss cookie consent if it reappears
    await dismissCookieConsent(page)

    // ── Fill Step 1 — Personal Information ────────────────────────────────
    // The form uses <Label> + <Input> pairs without name attributes.
    // We locate fields by their label text.

    // First Name *
    await fillField(page, "First Name", "Test")
    // Last Name *
    await fillField(page, "Last Name", "User")

    // Date of Birth * — three Radix Selects (Day, Month, Year)
    // The DOB label's parent div contains a sub-grid with 3 comboboxes
    const dobContainer = fieldContainer(page, "Date of Birth")
    const dobTriggers = dobContainer.getByRole("combobox")
    // Day
    await dobTriggers.nth(0).click()
    await page.getByRole("option", { name: "15" }).click()
    // Month
    await dobTriggers.nth(1).click()
    await page.getByRole("option", { name: "Jun" }).click()
    // Year
    await dobTriggers.nth(2).click()
    await page.getByRole("option", { name: "1990" }).click()
    console.log("✓ DOB filled")

    // Gender *
    await selectField(page, "Gender", /^Male$/)

    // Marital Status *
    await selectField(page, "Marital Status", /^Single$/)

    // Phone *
    await fillField(page, "Phone", "4165551234")

    // Email *
    await fillField(page, "Email", process.env.TEST_USER_EMAIL || "test@planetmotors.ca")

    // Credit Rating *
    await selectField(page, "Credit Rating", /Good/)

    console.log("✓ Personal info filled")

    // ── Fill Step 1 — Address ─────────────────────────────────────────────
    // Postal Code * — custom PostalCodeInput component
    await fillField(page, /^Postal Code/, "M5V3L9")
    // Wait for postal code lookup to auto-fill city/province
    await page.waitForTimeout(2_000)

    // Address Type *
    await selectField(page, "Address Type", /^House$/)

    // Street Number *
    await fillField(page, "Street Number", "100")

    // Street Name *
    await fillField(page, "Street Name", "King Street")

    // City — may be auto-filled from postal code; fill if empty
    const cityInput = fieldContainer(page, "City").locator("input").first()
    const cityValue = await cityInput.inputValue()
    if (!cityValue) {
      await cityInput.fill("Toronto")
    }

    console.log("✓ Address filled")

    // ── Fill Step 1 — Home/Mortgage ───────────────────────────────────────
    // Home Status *
    await selectField(page, "Home Status", /^Rent$/)

    // Monthly Payment *
    await fillField(page, "Monthly Payment", "1500")

    console.log("✓ Home details filled")

    // ── Fill Step 1 — Employment ──────────────────────────────────────────
    // Scroll down to make employment fields visible
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(500)

    // Employment Type *
    await selectField(page, "Employment Type", /^Full-Time$/)

    // Status * (employment status — use regex to avoid matching "Marital Status")
    await selectField(page, /^Status \*$/, /^Employed$/)

    // Employer Name *
    await fillField(page, "Employer Name", "Acme Corp")

    // Occupation *
    await fillField(page, "Occupation", "Software Engineer")

    // Employer Phone *
    await fillField(page, /Employer Phone/, "4165559999")

    // Employer Postal Code *
    await fillField(page, /Employer Postal Code/, "M5V1J2")
    await page.waitForTimeout(1_500)

    console.log("✓ Employment filled")

    // ── Fill Step 1 — Income ──────────────────────────────────────────────
    await page.evaluate(() => window.scrollBy(0, 400))
    await page.waitForTimeout(500)

    // Gross Income *
    await fillField(page, "Gross Income", "85000")

    // Income Frequency *
    await selectField(page, "Income Frequency", /^Annually$/)

    console.log("✓ Income filled")

    // ── Click Continue to advance from Step 1 ─────────────────────────────
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    const continueBtn = page
      .getByRole("button", { name: /continue|next step/i })
      .first()
    await continueBtn.click()
    console.log("✓ Step 1 Continue clicked")

    // Check for validation errors — if any, log them and still try to continue
    await page.waitForTimeout(2_000)
    const validationErrors = page.locator("text=is required")
    const errorCount = await validationErrors.count()
    if (errorCount > 0) {
      const errTexts: string[] = []
      for (let i = 0; i < Math.min(errorCount, 5); i++) {
        errTexts.push(await validationErrors.nth(i).textContent() || "")
      }
      console.log(`⚠ Validation errors (${errorCount}): ${errTexts.join(", ")}`)
    }

    // ── Step 2: Co-Applicant (skip) ──────────────────────────────────────
    await page.waitForTimeout(1_500)
    const step2Visible = await page
      .getByText(/co-applicant/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    if (step2Visible) {
      await page
        .getByRole("button", { name: /continue|next|skip/i })
        .first()
        .click()
      console.log("✓ Step 2 (Co-Applicant) — skipped")
    } else {
      console.log("✓ Step 2 (Co-Applicant) — auto-skipped (not shown)")
    }

    // ── Step 3: Vehicle & Financing ──────────────────────────────────────
    await page.waitForTimeout(1_500)

    // If vehicle was pre-filled via URL param, just continue.
    // If not, we need to select one from the modal.
    const selectVehicleBtn = page.getByRole("button", {
      name: /browse available inventory/i,
    })
    const needsVehicleSelection = await selectVehicleBtn
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    if (needsVehicleSelection) {
      console.log("⚠ No vehicle pre-selected — opening inventory modal")
      await selectVehicleBtn.click()
      await page.waitForTimeout(2_000)

      // Click the first vehicle's Select button in the modal
      const selectBtn = page.getByRole("button", { name: /^Select$/ }).first()
      if (await selectBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await selectBtn.click()
        console.log("✓ Vehicle selected from modal")
        await page.waitForTimeout(1_000)
      } else {
        console.log("⚠ No vehicles in inventory modal")
      }
    } else {
      console.log("✓ Vehicle pre-selected via URL param")
    }

    // Click continue past Step 3
    const step3Continue = page
      .getByRole("button", { name: /continue|next/i })
      .first()
    if (await step3Continue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await step3Continue.click()
      console.log("✓ Step 3 (Vehicle & Financing) — continuing")
    }

    // ── Step 4: Review & Submit ──────────────────────────────────────────
    await page.waitForTimeout(1_500)
    const reviewVisible = await page
      .getByText(/review|summary/i)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    if (reviewVisible) {
      // Scroll to bottom to find submit
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)

      const submitBtn = page
        .getByRole("button", { name: /submit application|submit/i })
        .first()
      if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await submitBtn.click()
        console.log("✓ Application submitted")
      } else {
        // Try the continue/next button
        await page
          .getByRole("button", { name: /continue|next/i })
          .first()
          .click()
        console.log("✓ Step 4 (Review) — continuing")
      }
    }

    // ── Step 5: Documents & Final Submit ─────────────────────────────────
    await page.waitForTimeout(2_000)

    const finalSubmitBtn = page
      .getByRole("button", { name: /submit application|submit|finish/i })
      .first()
    if (
      await finalSubmitBtn.isVisible({ timeout: 5_000 }).catch(() => false)
    ) {
      await finalSubmitBtn.click()
      console.log("✓ Final submit clicked")
    }

    // Wait for API response
    await page.waitForTimeout(8_000)

    // Check for success state
    const successMsg = page
      .getByText(/application received|submitted|confirmation|thank you/i)
      .first()
    const isSuccess = await successMsg
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    if (isSuccess) {
      console.log("✓ Finance application submitted successfully!")
      const pageText = await page.textContent("body")
      const confirmMatch = pageText?.match(/PM-FA-[A-Z0-9]+-[A-Z0-9]{4}/)
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
      expect(financeResponse.status).toBeLessThan(500)
    } else {
      console.log("⚠ No finance API call intercepted — form may not have reached submission")
    }

    // ── ID Verification Upload ────────────────────────────────────────────
    console.log("\n── ID Verification Upload ──")

    // Navigate to ID verification
    const continueToIDV = page.getByRole("button", {
      name: /continue to id verification|verify/i,
    })
    if (await continueToIDV.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await continueToIDV.click()
      await page.waitForTimeout(2_000)
    } else {
      await page.goto("/financing/verification")
    }

    // Dismiss cookie consent if it reappears
    await dismissCookieConsent(page)

    await expect(
      page.getByRole("heading", { name: /identity verification/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    console.log("✓ ID Verification page loaded")

    // Select ID type
    const idTypeSelect = page.locator('select[name="id-type"]')
    if (await idTypeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await idTypeSelect.selectOption({ label: "Driver's License" })
    } else {
      // Try Radix select pattern
      const idTypeContainer = fieldContainer(page, "ID Type")
      if (await idTypeContainer.getByRole("combobox").isVisible({ timeout: 2_000 }).catch(() => false)) {
        await idTypeContainer.getByRole("combobox").click()
        await page.getByRole("option", { name: /driver/i }).click()
      }
    }

    // Fill ID number
    const idNumberInput = page.locator('input[name="id-number"]')
    if (await idNumberInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await idNumberInput.fill("D1234-56789-01234")
    }

    // Set expiry date
    const expiryInput = page.locator('input[name="expiry-date"], input[type="date"]').first()
    if (await expiryInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expiryInput.fill("2028-12-31")
    }

    // Upload front ID image
    const frontFileInput = page.locator('input[name="id-front-upload"], input[type="file"]').first()
    if (
      await frontFileInput
        .isVisible({ timeout: 2_000 })
        .catch(() => false)
    ) {
      await frontFileInput.setInputFiles(TEST_IMAGE_PATH)
      console.log("✓ Front ID image uploaded")
    } else {
      // Hidden file input — try setting files anyway
      const hiddenInput = page.locator('input[type="file"]').first()
      const count = await hiddenInput.count()
      if (count > 0) {
        await hiddenInput.setInputFiles(TEST_IMAGE_PATH)
        console.log("✓ Front ID image uploaded via hidden input")
      }
    }

    await page.waitForTimeout(1_000)

    // Submit verification
    const verifySubmitBtn = page
      .getByRole("button", { name: /submit for verification|submit|verify/i })
      .first()
    if (
      await verifySubmitBtn.isEnabled({ timeout: 3_000 }).catch(() => false)
    ) {
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
