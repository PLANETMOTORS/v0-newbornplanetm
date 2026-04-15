import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

// WCAG 2.2 AA compliance — axe-core scans
// Covers: A11Y-001 through A11Y-004 from the Launch Readiness Checklist

test.describe("Section A11Y — Accessibility (WCAG 2.2 AA)", () => {
  test("A11Y-001 — Homepage: zero critical/serious axe violations", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" })
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    )
    if (critical.length > 0) {
      console.log("\n── Homepage A11Y Violations ──")
      critical.forEach((v) => {
        console.log(
          `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`
        )
        v.nodes.slice(0, 3).forEach((n) => console.log(`    → ${n.html.slice(0, 120)}`))
      })
    }
    expect(critical.length).toBe(0)
  })

  test("A11Y-002 — Inventory: zero critical/serious axe violations", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/inventory`, { waitUntil: "networkidle" })
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    )
    if (critical.length > 0) {
      console.log("\n── Inventory A11Y Violations ──")
      critical.forEach((v) => {
        console.log(
          `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`
        )
        v.nodes.slice(0, 3).forEach((n) => console.log(`    → ${n.html.slice(0, 120)}`))
      })
    }
    expect(critical.length).toBe(0)
  })

  test("A11Y-003 — VDP: zero critical/serious axe violations", async ({
    page,
  }) => {
    // Navigate to first vehicle via inventory
    await page.goto(`${BASE_URL}/inventory`, { waitUntil: "networkidle" })
    const firstLink = page.locator('a[href*="/vehicles/"]').first()
    if ((await firstLink.count()) > 0) {
      await firstLink.click()
      await page.waitForLoadState("networkidle")
    } else {
      // Fallback: use mock vehicle page
      await page.goto(`${BASE_URL}/vehicles/1`, { waitUntil: "networkidle" })
    }

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    )
    if (critical.length > 0) {
      console.log("\n── VDP A11Y Violations ──")
      critical.forEach((v) => {
        console.log(
          `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`
        )
        v.nodes.slice(0, 3).forEach((n) => console.log(`    → ${n.html.slice(0, 120)}`))
      })
    }
    expect(critical.length).toBe(0)
  })

  test("A11Y-004 — Checkout: zero critical/serious axe violations across all steps", async ({
    page,
  }) => {
    const checkoutPaths = [
      "/checkout/payment-type",
      "/checkout/trade-in",
      "/checkout/deal-customization",
      "/checkout/personal-info",
      "/checkout/financing",
    ]

    const allViolations: { step: string; violations: any[] }[] = []

    for (const path of checkoutPaths) {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" })
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze()

      const critical = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      )
      if (critical.length > 0) {
        allViolations.push({ step: path, violations: critical })
      }
    }

    if (allViolations.length > 0) {
      console.log("\n── Checkout A11Y Violations ──")
      allViolations.forEach(({ step, violations }) => {
        console.log(`  Step: ${step}`)
        violations.forEach((v) => {
          console.log(
            `    [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`
          )
        })
      })
    }

    const totalCritical = allViolations.reduce(
      (sum, s) => sum + s.violations.length,
      0
    )
    expect(totalCritical).toBe(0)
  })

  test("A11Y-005 — HTML lang attribute is set", async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    const lang = await page.evaluate(() => document.documentElement.lang)
    expect(lang).toMatch(/^en/)
  })

  test("A11Y-006 — All images have alt text", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" })
    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"))
      return imgs
        .filter((img) => !img.hasAttribute("alt"))
        .map((img) => img.src.slice(0, 100))
    })
    if (imagesWithoutAlt.length > 0) {
      console.log("\n── Images missing alt text ──")
      imagesWithoutAlt.forEach((src) => console.log(`  → ${src}`))
    }
    expect(imagesWithoutAlt.length).toBe(0)
  })
})
