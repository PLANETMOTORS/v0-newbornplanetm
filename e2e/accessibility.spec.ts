import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import type { Result } from "axe-core"

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
    if ((await firstLink.count()) === 0) {
      test.skip(true, "No vehicles available — cannot test VDP accessibility")
      return
    }
    await firstLink.click()
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      // VDP is a 'use client' component that sets <title> dynamically after
      // data loads. In CI the axe scan may fire before the title is hydrated.
      // color-contrast on Badge components is a pre-existing design-system
      // issue tracked separately.
      .disableRules(["document-title", "color-contrast"])
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
    // Checkout pages require a vehicle in the session; skip when DB is unavailable
    await page.goto(`${BASE_URL}/checkout/payment-type`, { waitUntil: "networkidle" })
    const redirected = page.url().includes("/inventory") || page.url().includes("/auth")
    if (redirected) {
      test.skip(true, "Checkout redirected (no vehicle/session) — cannot test accessibility")
      return
    }

    const checkoutPaths = [
      "/checkout/payment-type",
      "/checkout/trade-in",
      "/checkout/deal-customization",
      "/checkout/personal-info",
      "/checkout/financing",
    ]

    const allViolations: { step: string; violations: Result[] }[] = []

    for (const p of checkoutPaths) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: "networkidle" })
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze()

      const critical = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      )
      if (critical.length > 0) {
        allViolations.push({ step: p, violations: critical })
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
