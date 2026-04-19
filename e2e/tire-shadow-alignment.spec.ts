import { test, expect } from "@playwright/test"
import { centerOfRect, ellipseYAtXLower } from "./utils/ellipse"

/**
 * Tire-shadow alignment regression test.
 *
 * Validates that wheel anchor markers sit within ±TOLERANCE_PX of the
 * shadow ellipse at three representative viewport sizes (desktop, tablet,
 * mobile). Fails the build if any anchor delta exceeds the threshold.
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

const TOLERANCE_PX = 2.0

/**
 * Helper: navigate to inventory, find a vehicle with 360° frames,
 * open its VDP, and click the 360° tab.
 * Returns true if the 360° stage loaded successfully.
 */
async function open360Viewer(
  page: import("@playwright/test").Page
): Promise<boolean> {
  // Go to inventory
  await page.goto("/inventory")
  const loaded = await page
    .getByText(/vehicles available/i)
    .first()
    .isVisible({ timeout: 15_000 })
    .catch(() => false)
  if (!loaded) return false

  // Click first vehicle link
  const viewLink = page.getByRole("link", { name: /^View$/i }).first()
  const viewLinkVisible = await viewLink.isVisible().catch(() => false)
  if (!viewLinkVisible) return false
  await viewLink.click()
  await page.waitForLoadState("domcontentloaded")

  // Click the 360° tab
  const btn360 = page.getByRole("button", { name: /360°/i }).first()
  const btn360Visible = await btn360.isVisible({ timeout: 10_000 }).catch(() => false)
  if (!btn360Visible) return false
  await btn360.click()

  // Wait for the stage to appear
  const stage = page.getByTestId("vehicle-stage")
  return stage.isVisible({ timeout: 10_000 }).catch(() => false)
}

for (const vp of VIEWPORTS) {
  test(`tire-shadow alignment within ±${TOLERANCE_PX}px @ ${vp.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })

    const loaded = await open360Viewer(page)
    if (!loaded) {
      test.skip(true, "360° viewer not available (no vehicles or no 360° frames)")
      return
    }

    // Wait for frames to start loading (wheel markers appear with isReady)
    await page.waitForTimeout(3000)

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
      const wheelVisible = await wheel.isVisible().catch(() => false)
      if (!wheelVisible) {
        // Wheel markers may not render if no 360° frames loaded
        test.skip(true, `wheel-${id} not visible — no 360° frames loaded`)
        return
      }

      const box = await wheel.boundingBox()
      if (!box) {
        test.skip(true, `wheel-${id} boundingBox is null`)
        return
      }

      const c = centerOfRect(box)
      const expectedY = ellipseYAtXLower(c.x, cx, cy, rx, ry)
      const deltaY = c.y - expectedY

      expect(
        Math.abs(deltaY),
        `wheel ${id} deltaY=${deltaY.toFixed(3)}px exceeds ±${TOLERANCE_PX}px @ ${vp.name}`
      ).toBeLessThanOrEqual(TOLERANCE_PX)
    }
  })
}

// Optional: visual snapshot test
for (const vp of VIEWPORTS) {
  test(`visual snapshot @ ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })

    const loaded = await open360Viewer(page)
    if (!loaded) {
      test.skip(true, "360° viewer not available")
      return
    }

    await page.waitForTimeout(3000)

    const stage = page.getByTestId("vehicle-stage")
    await expect(stage).toBeVisible()
    await expect(stage).toHaveScreenshot(`vehicle-stage-${vp.name}.png`, {
      maxDiffPixelRatio: 0.01,
    })
  })
}
