/**
 * Frame-by-frame auto-calibration for tire-floor alignment.
 *
 * Uses visible wheel-bottom points and the floor shadow ellipse to compute
 * a smoothed vertical correction so tires sit on the floor during 360° rotation.
 *
 * Architecture:
 *   1. For each frame, get visible wheel-bottom points (from detector or static map)
 *   2. Compute expected floor Y at each wheel's X using ellipse equation
 *   3. Median delta = how far tires are from the floor
 *   4. Apply smoothed, clamped correction to car layer Y offset
 *
 * Safety rules:
 *   - If fewer than minWheelPoints visible: hold last offset (no correction)
 *   - Clamp per-frame step to maxStepPxPerFrame
 *   - Dead zone ignores sub-pixel jitter
 */

type Pt = { x: number; y: number }

type Ellipse = {
  cx: number // px
  cy: number // px
  rx: number // px
  ry: number // px
}

export type FrameInput = {
  wheelBottoms: Pt[] // 1..4 visible tire-bottom points in STAGE px
  floorEllipse: Ellipse
}

export type CalibParams = {
  deadZonePx: number // ignore tiny error
  maxStepPxPerFrame: number // clamp correction
  smoothingAlpha: number // 0..1, higher = faster response
  minWheelPoints: number // min visible wheels to calibrate
}

export type CalibState = {
  yOffsetPx: number // cumulative correction applied to car layer
  smoothedDeltaPx: number // internal smoothing state
}

export type CalibDebug = {
  appliedStepPx: number
  rawDeltaPx: number
  smoothedDeltaPx: number
  wheelDeltasPx: number[]
  skipped: boolean
  reason?: string
}

export const defaultCalibParams: CalibParams = {
  deadZonePx: 1.0,
  maxStepPxPerFrame: 3.0,
  smoothingAlpha: 0.35,
  minWheelPoints: 2,
}

export const initialCalibState: CalibState = {
  yOffsetPx: 0,
  smoothedDeltaPx: 0,
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function median(values: number[]): number {
  if (!values.length) return 0
  const arr = [...values].sort((a, b) => a - b)
  const mid = Math.floor(arr.length / 2)
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
}

/**
 * Lower-half Y on ellipse boundary for a given X.
 * Solves ((x-cx)²/rx²) + ((y-cy)²/ry²) = 1 for the bottom intersection.
 */
export function ellipseYLowerAtX(x: number, e: Ellipse): number {
  if (e.rx <= 0 || e.ry <= 0) return e.cy
  const dx = x - e.cx
  const inside = 1 - (dx * dx) / (e.rx * e.rx)
  if (inside <= 0) return e.cy // outside ellipse span
  return e.cy + Math.sqrt(inside) * e.ry
}

/**
 * Upper-half Y on ellipse boundary for a given X.
 * This is the FLOOR CONTACT LINE — where tires physically touch the ground.
 * The top of the shadow ellipse represents the floor surface; the shadow
 * extends below and around the contact points.
 */
export function ellipseYUpperAtX(x: number, e: Ellipse): number {
  if (e.rx <= 0 || e.ry <= 0) return e.cy
  const dx = x - e.cx
  const inside = 1 - (dx * dx) / (e.rx * e.rx)
  if (inside <= 0) return e.cy // outside ellipse span
  return e.cy - Math.sqrt(inside) * e.ry
}

/**
 * Returns updated calibration state and metrics for debug overlay.
 *
 * Positive rawDelta means wheel is ABOVE floor → move car DOWN.
 * The correction is smoothed and clamped for visual stability.
 */
export function autoCalibrateFrame(
  input: FrameInput,
  prev: CalibState,
  params: CalibParams = defaultCalibParams,
): { state: CalibState; debug: CalibDebug } {
  const { wheelBottoms, floorEllipse } = input

  // Not enough visible wheels → hold last state
  if (wheelBottoms.length < params.minWheelPoints) {
    return {
      state: prev,
      debug: {
        appliedStepPx: 0,
        rawDeltaPx: 0,
        smoothedDeltaPx: prev.smoothedDeltaPx,
        wheelDeltasPx: [],
        skipped: true,
        reason: "not-enough-wheel-points",
      },
    }
  }

  // Positive delta means wheel is ABOVE floor contact line → move car DOWN.
  // Floor contact is the UPPER boundary of the shadow ellipse (where tires
  // physically touch the ground), not the lower boundary or center.
  const wheelDeltas = wheelBottoms.map((w) => {
    const yFloor = ellipseYUpperAtX(w.x, floorEllipse)
    return yFloor - w.y
  })

  const rawDelta = median(wheelDeltas)

  // Dead-zone: ignore sub-pixel jitter
  const dz = params.deadZonePx
  const targetDelta = Math.abs(rawDelta) <= dz ? 0 : rawDelta

  // Exponential smoothing
  const smoothed =
    prev.smoothedDeltaPx +
    (targetDelta - prev.smoothedDeltaPx) * params.smoothingAlpha

  // Clamp per-frame step
  const step = clamp(smoothed, -params.maxStepPxPerFrame, params.maxStepPxPerFrame)

  // Clamp cumulative offset to sane bounds (±60px)
  const newOffset = clamp(prev.yOffsetPx + step, -60, 60)

  return {
    state: {
      yOffsetPx: newOffset,
      smoothedDeltaPx: smoothed,
    },
    debug: {
      appliedStepPx: step,
      rawDeltaPx: rawDelta,
      smoothedDeltaPx: smoothed,
      wheelDeltasPx: wheelDeltas,
      skipped: false,
    },
  }
}
