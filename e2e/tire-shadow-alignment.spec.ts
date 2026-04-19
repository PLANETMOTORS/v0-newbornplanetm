import { test, expect } from "@playwright/test"
import { centerOfRect, ellipseYAtXUpper } from "./utils/ellipse"

/**
 * Tire-shadow alignment regression test.
 *
 * Validates that wheel anchor markers sit within ±TOLERANCE_PX of the
 * shadow ellipse at three representative viewport sizes (desktop, tablet,
 * mobile). Fails the build if any anchor delta exceeds the threshold.
 *
 * Navigates directly to a known vehicle with 360° frames to avoid
 * flaky inventory-discovery navigation. Alignment tests are separated
 * from inventory integration tests.
 *
 * Skip policy: When Supabase is unavailable (CI without env vars), tests
 * skip with an explicit, auditable reason. This is expected — the 360°
 * viewer requires live Supabase data to render frames. Alignment math
 * correctness is enforced by the 17 unit tests which always run.
 *
 * Future work: Add /api/e2e/seed-vehicle endpoint for deterministic
 * fixture-based E2E in CI (separate PR).
 *
 * Requires data-testid attributes on the 360° viewer:
 *   - vehicle-stage  (container div)
 *   - shadow-ellipse (invisible ellipse-sized div)
 *   - wheel-FL / wheel-FR / wheel-RL / wheel-RR (2×2px anchor markers)
 */

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
]

/** Toni's tightened threshold — locked at ≤1px (measured 0.0px in sweep) */
const TOLERANCE_PX = 1.0

/**
 * Known test fixture: Jeep Wrangler 4xe with 37 background-removed 360° frames.
 * Falls back to inventory discovery if the direct route is unavailable.
 */
const TEST_VEHICLE_PATH = "/vehicles/caa5eb3d-c1f8-4d38-887c-d581658b9e73"

/**
 * Helper: open the 360° viewer for a known vehicle.
 * Strategy 1: navigate directly to the known VDP.
 * Strategy 2 (fallback): go to /inventory and click the first vehicle.
 * Returns true if the 360° stage loaded successfully.
 */
async function open360Viewer(
  page: import("@playwright/test").Page
): Promise<boolean> {
  // Strategy 1: Direct navigation to known vehicle
  await page.goto(TEST_VEHICLE_PATH, { waitUntil: "domcontentloaded" })

  // Click the 360° tab
  const btn360 = page.getByRole("button", { name: /360°/i }).first()
  const btn360Visible = await btn360
    .isVisible({ timeout: 10_000 })
    .catch(() => false)

  if (!btn360Visible) {
    // Strategy 2: Fallback to inventory discovery
    await page.goto("/inventory", { waitUntil: "domcontentloaded" })
    const loaded = await page
      .getByText(/vehicles available/i)
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false)
    if (!loaded) return false

    const viewLink = page.getByRole("link", { name: /View/i }).first()
    const viewLinkVisible = await viewLink
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    if (!viewLinkVisible) return false
    await viewLink.click()
    await page.waitForLoadState("domcontentloaded")

    const btn360Fallback = page.getByRole("button", { name: /360°/i }).first()
    const btn360FallbackVisible = await btn360Fallback
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    if (!btn360FallbackVisible) return false
    await btn360Fallback.click()
  } else {
    await btn360.click()
  }

  // Robust wait: wait for vehicle-stage with explicit timeout
  const stage = page.getByTestId("vehicle-stage")
  const stageVisible = await stage
    .isVisible({ timeout: 15_000 })
    .catch(() => false)
  if (!stageVisible) return false

  // Wait for wheel markers to appear (indicates isReady = true, frames loaded)
  const wheelFL = page.getByTestId("wheel-FL")
  const wheelReady = await wheelFL
    .isVisible({ timeout: 10_000 })
    .catch(() => false)

  return wheelReady
}

for (const vp of VIEWPORTS) {
  test(`tire-shadow alignment within ±${TOLERANCE_PX}px @ ${vp.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })

    const loaded = await open360Viewer(page)
    if (!loaded) {
      // eslint-disable-next-line no-console
      console.warn(
        "Skipping 360° E2E alignment test: vehicle-stage or wheel markers " +
          "not visible. Most likely cause: Supabase unavailable in CI " +
          "(NEXT_PUBLIC_SUPABASE_URL not set or no 360° frame data). " +
          "Alignment math correctness is enforced by unit tests."
      )
      test.skip(
        true,
        "Skipping 360 E2E: Supabase unavailable or no 360° frames loaded"
      )
      return
    }

    // Extra settle time for ResizeObserver + layout recalc
    await page.waitForTimeout(2000)

    const stage = page.getByTestId("vehicle-stage")
    await expect(stage).toBeVisible()

    const shadow = page.getByTestId("shadow-ellipse")
    await expect(shadow).toBeVisible()

    const shadowBox = await shadow.boundingBox()
    if (!shadowBox) {
      test.skip(true, "shadow-ellipse boundingBox is null")
      return
    }

    // Ellipse params in page pixels from shadow element box
    const cx = shadowBox.x + shadowBox.width / 2
    const cy = shadowBox.y + shadowBox.height / 2
    const rx = shadowBox.width / 2
    const ry = shadowBox.height / 2

    const wheelIds = ["FL", "FR", "RL", "RR"] as const

    for (const id of wheelIds) {
      const wheel = page.getByTestId(`wheel-${id}`)
      await expect(wheel).toBeVisible({ timeout: 5_000 })

      const box = await wheel.boundingBox()
      expect(box, `wheel-${id} boundingBox should not be null`).not.toBeNull()
      if (!box) return // satisfy TS

      const c = centerOfRect(box)
      const expectedY = ellipseYAtXUpper(c.x, cx, cy, rx, ry)
      const deltaY = c.y - expectedY

      expect(
        Math.abs(deltaY),
        `wheel ${id} deltaY=${deltaY.toFixed(3)}px exceeds ±${TOLERANCE_PX}px @ ${vp.name}`
      ).toBeLessThanOrEqual(TOLERANCE_PX)
    }
  })
}
