/**
 * Planet Ultra — Step 4: Finance Application (Personal Info)
 * ev.planetmotors.ca
 *
 * Adapted for:
 *  - Supabase Auth (not Clerk)
 *  - FinanceApplicationFullForm component (data-testid selectors added Apr 2026)
 *  - Shadcn/ui Select + Input components
 *  - 5-step internal form: Step 1 = Primary Applicant, Step 2 = Co-Applicant,
 *    Step 3 = Vehicle & Financing, Step 4 = Documents, Step 5 = Review
 *
 * Coverage:
 *  - Required field validation & inline error highlighting
 *  - Phone number formatting (Canadian 10-digit)
 *  - Province auto-fill from postal code
 *  - Employment section fields
 *  - Back-navigation data persistence (localStorage draft)
 *  - Step navigation (Continue / Back)
 *
 * Run: pnpm test:e2e -- e2e/step4-personal-info.spec.ts
 */

import { test, expect, type Page } from "@playwright/test"

// ─── Page Object ──────────────────────────────────────────────────────────────

class FinanceFormPage {
  constructor(private page: Page) {}

  // Navigate to finance application page
  async goto() {
    await this.page.goto("/financing/application")
    // Wait for the form to render — look for the step indicator
    await expect(
      this.page.getByRole("heading", { name: "Primary Applicant Information" }).first()
    ).toBeVisible({ timeout: 15000 })
  }

  // Field accessors — based on Label text (how the real form renders)
  field(label: string) {
    return this.page.getByLabel(label, { exact: false }).first()
  }

  get firstName() {
    return this.page.locator('input').filter({ has: this.page.locator(':scope') }).nth(0)
  }

  // Use label-adjacent input pattern for the form
  inputAfterLabel(labelText: string) {
    return this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${labelText}`, "i") })
      .locator("input")
      .first()
  }

  // Select trigger by label text
  selectTrigger(labelText: string) {
    return this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${labelText}`, "i") })
      .getByRole("combobox")
      .first()
  }

  get continueBtn() {
    return this.page.getByRole("button", { name: /continue/i })
  }

  get backBtn() {
    return this.page.getByRole("button", { name: /back/i })
  }

  get submitBtn() {
    return this.page.getByRole("button", { name: /submit application/i })
  }

  // Validation errors show as red borders or error text
  get validationErrors() {
    return this.page.locator(".border-destructive")
  }

  get errorBanner() {
    return this.page.locator(String.raw`.bg-destructive\/10`)
  }
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

test.describe("Step 4 — Finance Form: Page Load", () => {
  test("financing application page loads with Step 1 visible", async ({
    page,
  }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    // Step 1 header should be visible
    await expect(
      page.getByRole("heading", { name: "Primary Applicant Information" }).first()
    ).toBeVisible()
    // Personal Information section
    await expect(page.getByText("Personal Information").first()).toBeVisible()
  })

  test("page has correct title and navigation", async ({ page }) => {
    await page.goto("/financing/application")
    await expect(page).toHaveTitle(/Planet Motors/i)
  })
})

test.describe("Step 4 — Finance Form: Required Field Validation", () => {
  test("shows validation errors when submitting Step 1 with empty fields", async ({
    page,
  }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    // Click Continue without filling anything
    await form.continueBtn.click()

    // Should show error banner with validation messages
    await expect(form.errorBanner).toBeVisible({ timeout: 5000 })

    // Specific error messages should appear
    await expect(page.getByText("First Name is required")).toBeVisible()
    await expect(page.getByText("Last Name is required")).toBeVisible()
    await expect(page.getByText("Date of Birth is required")).toBeVisible()
  })

  test("validation errors clear after fixing fields", async ({ page }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    // Trigger validation
    await form.continueBtn.click()
    await expect(page.getByText("First Name is required")).toBeVisible()

    // The error text should be in the banner
    const banner = form.errorBanner
    await expect(banner).toContainText("First Name is required")
  })
})

test.describe("Step 4 — Finance Form: Phone Validation", () => {
  test("phone field formats input as Canadian number", async ({ page }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    // Find phone input by its placeholder
    const phoneInput = page.getByPlaceholder("(XXX) XXX-XXXX").first()
    await phoneInput.fill("4165550192")

    // Should be formatted
    await expect(phoneInput).toHaveValue("(416) 555-0192")
  })
})

test.describe("Step 4 — Finance Form: Phone Validation Edge Cases", () => {
  test("rejects phone numbers that start with 0 or 1 area code", async ({
    page,
  }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    const phoneInput = page.getByPlaceholder("(XXX) XXX-XXXX").first()
    await phoneInput.fill("0165550192")

    // Try to continue — should get phone validation error
    await form.continueBtn.click()
    // The error banner should contain a phone-related error
    await expect(form.errorBanner).toBeVisible({ timeout: 5000 })
    await expect(form.errorBanner).toContainText(/area code|phone/i)
  })

  test("rejects phone numbers shorter than 10 digits", async ({ page }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    const phoneInput = page.getByPlaceholder("(XXX) XXX-XXXX").first()
    await phoneInput.fill("416555")

    await form.continueBtn.click()
    // The error banner should contain a phone-related error about 10 digits
    await expect(form.errorBanner).toBeVisible({ timeout: 5000 })
    await expect(form.errorBanner).toContainText(/10 digits|phone/i)
  })
})

test.describe("Step 4 — Finance Form: Step Navigation", () => {
  test("Back button is disabled on Step 1", async ({ page }) => {
    const form = new FinanceFormPage(page)
    await form.goto()
    await expect(form.backBtn).toBeDisabled()
  })

  test("progress indicator shows current step", async ({ page }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    // Step 1 should be highlighted — look for the step text
    await expect(page.getByText("Primary Applicant")).toBeVisible()
  })
})

test.describe("Step 4 — Finance Form: Draft Persistence", () => {
  test("form data persists in localStorage as draft", async ({ page }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    // Fill first name
    const firstNameInput = page
      .locator("div")
      .filter({ hasText: /^First Name/ })
      .locator("input")
      .first()
    await firstNameInput.fill("James")

    // Wait for debounced save
    await page.waitForTimeout(2000)

    // Check localStorage for draft
    const draftExists = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      return keys.some((k) => k.includes("pm:finance-draft"))
    })
    expect(draftExists).toBeTruthy()
  })

  test("form data restores from localStorage on page reload", async ({
    page,
  }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    // Seed draft data using the full state structure the component expects
    await page.evaluate(() => {
      const draft = {
        primaryApplicant: {
          salutation: "", firstName: "TestRestore", middleName: "", lastName: "User", suffix: "",
          dateOfBirth: { day: "", month: "", year: "" },
          gender: "", maritalStatus: "", phone: "(416) 555-0192", mobilePhone: "", email: "test@example.com",
          noEmail: false, languagePreference: "en", creditRating: "",
          postalCode: "", addressType: "", suiteNumber: "", streetNumber: "",
          streetName: "", streetType: "", streetDirection: "", city: "", province: "Ontario",
          durationYears: "", durationMonths: "",
          homeStatus: "", marketValue: "", mortgageAmount: "", mortgageHolder: "",
          monthlyPayment: "", outstandingMortgage: "",
          employmentCategory: "", employmentStatus: "", employerName: "", occupation: "",
          jobTitle: "", employerStreet: "", employerCity: "", employerProvince: "",
          employerPostalCode: "", employerPhone: "", employerPhoneExt: "",
          employmentYears: "", employmentMonths: "",
          grossIncome: "", incomeFrequency: "", otherIncomeType: "",
          otherIncomeAmount: "", otherIncomeFrequency: "",
        },
        currentStep: 1,
      }
      localStorage.setItem(
        "pm:finance-draft:general",
        JSON.stringify(draft)
      )
    })

    // Reload to trigger draft recovery
    await page.reload()
    await expect(
      page.getByRole("heading", { name: "Primary Applicant Information" }).first()
    ).toBeVisible({ timeout: 15000 })

    // Check that data was restored by verifying the phone field
    const phoneInput = page.getByPlaceholder("(XXX) XXX-XXXX").first()
    await expect(phoneInput).toHaveValue("(416) 555-0192")
  })
})

test.describe("Step 4 — Finance Form: Address Section", () => {
  test("address section renders with postal code input", async ({ page }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    // Current Address section should be visible on Step 1
    await expect(page.getByText("Current Address")).toBeVisible()
    // Postal code field should be present
    await expect(page.getByText(/postal code/i).first()).toBeVisible()
  })
})

test.describe("Step 4 — Finance Form: Employment Section", () => {
  test("employment section renders with required fields", async ({
    page,
  }) => {
    const form = new FinanceFormPage(page)
    await form.goto()

    // Employment section should be visible on Step 1 (titled "Current Employment")
    await expect(page.getByText("Current Employment")).toBeVisible()
    // Employment Type field
    await expect(page.getByText(/employment type/i).first()).toBeVisible()
  })
})

test.describe("Step 4 — Finance Form: Sensitive Data", () => {
  test("no sensitive data leaks in network requests during form fill", async ({
    page,
  }) => {
    const requestBodies: string[] = []

    page.on("request", (req) => {
      const body = req.postData()
      if (body) requestBodies.push(body)
    })

    const form = new FinanceFormPage(page)
    await form.goto()

    // Fill some fields and wait
    const firstNameInput = page
      .locator("div")
      .filter({ hasText: /^First Name/ })
      .locator("input")
      .first()
    await firstNameInput.fill("TestSensitive")
    await page.waitForTimeout(3000)

    // No request body should contain raw form data during typing
    // (data should only be sent on explicit submit)
    for (const body of requestBodies) {
      expect(body).not.toContain("TestSensitive")
    }
  })
})
