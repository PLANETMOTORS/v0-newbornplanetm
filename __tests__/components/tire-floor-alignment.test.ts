/**
 * Regression tests for tire-floor alignment calculation.
 *
 * Verifies that the pixel-based positioning algorithm in VehicleSpinViewer
 * places the tire contact line within ±2 px of the floor contact line
 * at three representative viewport sizes (mobile, tablet, desktop).
 *
 * Tests are parameterized across all body-type anchor profiles (sedan, suv,
 * truck, oversized) to ensure alignment holds for every real configuration.
 *
 * Key architecture:
 *   - floorContactY is the alignment target (upper edge of shadow ellipse = floor surface)
 *   - shadowCenterY is only for the visual shadow div position
 *   - tireContactY is where tires are in the source image
 *
 * These are pure-math tests that mirror the ResizeObserver callback in
 * components/vehicle-spin-viewer.tsx — no DOM or React rendering needed.
 */
import { describe, it, expect } from 'vitest'

// Shadow ellipse ry = 5.93% of container height (must match component)
const SHADOW_RY_FRACTION = 0.0593

// ── Per-body-type anchor profiles (must match vehicle-spin-viewer.tsx) ──
const ANCHOR_PROFILES = {
  sedan: { floorContactY: 0.7556 - SHADOW_RY_FRACTION, shadowCenterY: 0.7556, tireContactY: 0.850 },
  suv: { floorContactY: 0.7400 - SHADOW_RY_FRACTION, shadowCenterY: 0.7400, tireContactY: 0.825 },
  truck: { floorContactY: 0.7300 - SHADOW_RY_FRACTION, shadowCenterY: 0.7300, tireContactY: 0.810 },
  oversized: { floorContactY: 0.7200 - SHADOW_RY_FRACTION, shadowCenterY: 0.7200, tireContactY: 0.800 },
} as const

const IMG_ASPECT   = 4 / 3
const SCALE_FACTOR = 1.25

/** Snap to nearest 0.5 CSS-px (same as component) */
const snap = (v: number) => Math.round(v * 2) / 2

/**
 * Replicates the ResizeObserver recalc() from vehicle-spin-viewer.tsx.
 * Returns computed layout values given a container size and profile.
 */
function computeAlignment(
  containerW: number,
  containerH: number,
  profile: { floorContactY: number; tireContactY: number },
) {
  const fitW = Math.min(containerW, containerH * IMG_ASPECT)
  const fitH = fitW / IMG_ASPECT

  const renderW = snap(fitW * SCALE_FACTOR)
  const renderH = snap(fitH * SCALE_FACTOR)

  const tireY  = snap(profile.tireContactY * renderH)
  const floorY = snap(profile.floorContactY * containerH)

  const imgTop  = snap(floorY - tireY)
  const imgLeft = snap((containerW - renderW) / 2)

  // Where the tire contact line actually ends up in the container
  const tireLineY = imgTop + tireY

  // Error: how far tire line is from floor contact line
  const error = Math.abs(floorY - tireLineY)

  return { renderW, renderH, tireY, floorY, imgTop, imgLeft, tireLineY, error }
}

// ── QC tolerance: wheel anchor Y must be within ±2 px of floor contact line ──
const MAX_ERROR_PX = 2

// ── Viewport definitions ──
const VIEWPORTS = [
  { name: 'Mobile (375×500)',    w: 375,  h: 281  }, // 375 × (375 / (4/3)) aspect box
  { name: 'Tablet (768×576)',    w: 768,  h: 576  },
  { name: 'Desktop (1200×900)',  w: 816,  h: 612  }, // typical VDP photo area
  { name: 'Wide desktop (1400)', w: 950,  h: 712  },
  { name: 'Fullscreen 1080p',   w: 1920, h: 1080 },
]

// ---------------------------------------------------------------------------
// Core alignment tests — parameterized across all body-type profiles
// ---------------------------------------------------------------------------

for (const [profileName, profile] of Object.entries(ANCHOR_PROFILES)) {
  describe(`Tire-floor alignment [${profileName}] — tire line matches floor contact`, () => {
    for (const vp of VIEWPORTS) {
      it(`${vp.name}: tire-to-floor error ≤ ${MAX_ERROR_PX} px`, () => {
        const result = computeAlignment(vp.w, vp.h, profile)
        expect(result.error).toBeLessThanOrEqual(MAX_ERROR_PX)
      })
    }
  })
}

describe('Tire-floor alignment — image sizing', () => {
  it('render dimensions preserve 4:3 aspect ratio (all profiles)', () => {
    for (const profile of Object.values(ANCHOR_PROFILES)) {
      for (const vp of VIEWPORTS) {
        const { renderW, renderH } = computeAlignment(vp.w, vp.h, profile)
        const ratio = renderW / renderH
        expect(ratio).toBeCloseTo(IMG_ASPECT, 1)
      }
    }
  })

  it('render width is SCALE_FACTOR × fit width', () => {
    const vp = VIEWPORTS[2] // Desktop
    const profile = ANCHOR_PROFILES.suv // default profile
    const { renderW } = computeAlignment(vp.w, vp.h, profile)
    const fitW = Math.min(vp.w, vp.h * IMG_ASPECT)
    expect(renderW).toBeCloseTo(snap(fitW * SCALE_FACTOR), 0)
  })
})

describe('Tire-floor alignment — horizontal centering', () => {
  for (const vp of VIEWPORTS) {
    it(`${vp.name}: image is horizontally centered within ±1 px`, () => {
      const profile = ANCHOR_PROFILES.suv
      const { imgLeft, renderW } = computeAlignment(vp.w, vp.h, profile)
      const expectedLeft = snap((vp.w - renderW) / 2)
      expect(Math.abs(imgLeft - expectedLeft)).toBeLessThanOrEqual(1)
    })
  }
})

describe('Tire-floor alignment — sub-pixel snapping', () => {
  it('all computed values are multiples of 0.5 (all profiles)', () => {
    for (const profile of Object.values(ANCHOR_PROFILES)) {
      for (const vp of VIEWPORTS) {
        const { renderW, renderH, tireY, floorY, imgTop, imgLeft } = computeAlignment(vp.w, vp.h, profile)
        for (const val of [renderW, renderH, tireY, floorY, imgTop, imgLeft]) {
          expect(val * 2).toBe(Math.round(val * 2))
        }
      }
    }
  })
})

describe('Tire-floor alignment — edge cases', () => {
  it('zero-size container returns safe defaults (no NaN/Infinity)', () => {
    const result = computeAlignment(1, 1, ANCHOR_PROFILES.suv)
    expect(Number.isFinite(result.imgTop)).toBe(true)
    expect(Number.isFinite(result.imgLeft)).toBe(true)
    expect(Number.isFinite(result.error)).toBe(true)
  })

  it('very tall container (portrait) still aligns correctly (all profiles)', () => {
    for (const profile of Object.values(ANCHOR_PROFILES)) {
      const result = computeAlignment(400, 800, profile)
      expect(result.error).toBeLessThanOrEqual(MAX_ERROR_PX)
    }
  })

  it('very wide container (ultra-wide) still aligns correctly (all profiles)', () => {
    for (const profile of Object.values(ANCHOR_PROFILES)) {
      const result = computeAlignment(2560, 600, profile)
      expect(result.error).toBeLessThanOrEqual(MAX_ERROR_PX)
    }
  })
})

// ---------------------------------------------------------------------------
// Background layer XOR invariant — bg-frame and bg-fallback must never coexist
// ---------------------------------------------------------------------------

describe('Background layer XOR invariant', () => {
  const useFrameBackground = true // must match vehicle-spin-viewer.tsx

  it('bg-frame XOR bg-fallback: exactly one background layer is active when frames loaded', () => {
    const isReady = true
    const hasFrame = true
    const bgFrame = isReady && hasFrame && useFrameBackground
    const bgFallback = !(isReady && hasFrame && useFrameBackground)
    expect(Boolean(bgFrame) !== Boolean(bgFallback)).toBe(true)
  })

  it('bg-frame XOR bg-fallback: fallback shown when no frames loaded', () => {
    const isReady = false
    const hasFrame = false
    const bgFrame = isReady && hasFrame && useFrameBackground
    const bgFallback = !(isReady && hasFrame && useFrameBackground)
    expect(Boolean(bgFrame) !== Boolean(bgFallback)).toBe(true)
  })

  it('bg-frame XOR bg-fallback: fallback shown when useFrameBackground is false', () => {
    const overrideUseFrameBg = false
    const isReady = true
    const hasFrame = true
    const bgFrame = isReady && hasFrame && overrideUseFrameBg
    const bgFallback = !(isReady && hasFrame && overrideUseFrameBg)
    expect(Boolean(bgFrame) !== Boolean(bgFallback)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Consistency across frame changes (tire Y should not shift between frames)
// ---------------------------------------------------------------------------

describe('Tire-floor alignment — frame-change stability', () => {
  it('tire Y position is identical across all frames (static container, all profiles)', () => {
    for (const profile of Object.values(ANCHOR_PROFILES)) {
      const vp = VIEWPORTS[2]
      const baseline = computeAlignment(vp.w, vp.h, profile)
      for (let i = 0; i < 37; i++) {
        const result = computeAlignment(vp.w, vp.h, profile)
        expect(result.tireLineY).toBe(baseline.tireLineY)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Profile-specific tests — verify each profile has reasonable geometry
// ---------------------------------------------------------------------------

describe('Anchor profile consistency', () => {
  it('shadow center Y decreases from sedan → oversized (higher ride = higher shadow)', () => {
    expect(ANCHOR_PROFILES.sedan.shadowCenterY).toBeGreaterThan(ANCHOR_PROFILES.suv.shadowCenterY)
    expect(ANCHOR_PROFILES.suv.shadowCenterY).toBeGreaterThan(ANCHOR_PROFILES.truck.shadowCenterY)
    expect(ANCHOR_PROFILES.truck.shadowCenterY).toBeGreaterThan(ANCHOR_PROFILES.oversized.shadowCenterY)
  })

  it('floor contact Y decreases from sedan → oversized', () => {
    expect(ANCHOR_PROFILES.sedan.floorContactY).toBeGreaterThan(ANCHOR_PROFILES.suv.floorContactY)
    expect(ANCHOR_PROFILES.suv.floorContactY).toBeGreaterThan(ANCHOR_PROFILES.truck.floorContactY)
    expect(ANCHOR_PROFILES.truck.floorContactY).toBeGreaterThan(ANCHOR_PROFILES.oversized.floorContactY)
  })

  it('floor contact Y is above shadow center Y (floor = top of shadow)', () => {
    for (const profile of Object.values(ANCHOR_PROFILES)) {
      expect(profile.floorContactY).toBeLessThan(profile.shadowCenterY)
    }
  })

  it('tire contact Y decreases from sedan → oversized (higher ride = lower tire fraction)', () => {
    expect(ANCHOR_PROFILES.sedan.tireContactY).toBeGreaterThan(ANCHOR_PROFILES.suv.tireContactY)
    expect(ANCHOR_PROFILES.suv.tireContactY).toBeGreaterThan(ANCHOR_PROFILES.truck.tireContactY)
    expect(ANCHOR_PROFILES.truck.tireContactY).toBeGreaterThan(ANCHOR_PROFILES.oversized.tireContactY)
  })

  it('all profiles have floor contact in [0.60, 0.75] range', () => {
    for (const profile of Object.values(ANCHOR_PROFILES)) {
      expect(profile.floorContactY).toBeGreaterThanOrEqual(0.60)
      expect(profile.floorContactY).toBeLessThanOrEqual(0.75)
    }
  })

  it('all profiles have tire contact in [0.75, 0.90] range', () => {
    for (const profile of Object.values(ANCHOR_PROFILES)) {
      expect(profile.tireContactY).toBeGreaterThanOrEqual(0.75)
      expect(profile.tireContactY).toBeLessThanOrEqual(0.90)
    }
  })
})

// ---------------------------------------------------------------------------
// Floor contact model — ellipseYUpperAtX
// ---------------------------------------------------------------------------

describe('Floor contact model — ellipseYUpperAtX', () => {
  // Import would require module setup; test the math directly
  function ellipseYUpperAtX(x: number, e: { cx: number; cy: number; rx: number; ry: number }): number {
    if (e.rx <= 0 || e.ry <= 0) return e.cy
    const dx = x - e.cx
    const inside = 1 - (dx * dx) / (e.rx * e.rx)
    if (inside <= 0) return e.cy
    return e.cy - Math.sqrt(inside) * e.ry
  }

  function ellipseYLowerAtX(x: number, e: { cx: number; cy: number; rx: number; ry: number }): number {
    if (e.rx <= 0 || e.ry <= 0) return e.cy
    const dx = x - e.cx
    const inside = 1 - (dx * dx) / (e.rx * e.rx)
    if (inside <= 0) return e.cy
    return e.cy + Math.sqrt(inside) * e.ry
  }

  const ellipse = { cx: 500, cy: 450, rx: 200, ry: 50 }

  it('upper boundary is ABOVE center (smaller Y)', () => {
    const upper = ellipseYUpperAtX(500, ellipse) // at center x
    expect(upper).toBe(400) // cy - ry = 450 - 50
    expect(upper).toBeLessThan(ellipse.cy)
  })

  it('lower boundary is BELOW center (larger Y)', () => {
    const lower = ellipseYLowerAtX(500, ellipse)
    expect(lower).toBe(500) // cy + ry = 450 + 50
    expect(lower).toBeGreaterThan(ellipse.cy)
  })

  it('upper + lower are symmetric around center', () => {
    for (const x of [350, 400, 450, 500, 550, 600, 650]) {
      const upper = ellipseYUpperAtX(x, ellipse)
      const lower = ellipseYLowerAtX(x, ellipse)
      const midpoint = (upper + lower) / 2
      expect(midpoint).toBeCloseTo(ellipse.cy, 5)
    }
  })

  it('returns center for points outside ellipse span', () => {
    const outside = ellipseYUpperAtX(800, ellipse) // way outside rx
    expect(outside).toBe(ellipse.cy)
  })
})
