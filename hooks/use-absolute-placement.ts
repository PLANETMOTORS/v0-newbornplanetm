import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type NormalizedRect = { x: number; y: number; w: number; h: number } // 0..1
type Point = { x: number; y: number }

export type UseAbsolutePlacementArgs = {
  containerRef: React.RefObject<HTMLElement | null>
  carRectNorm: NormalizedRect // desired vehicle box within container
  wheelAnchorsInCarNorm: {
    FL: Point // wheel centers inside car image bounds (0..1)
    FR: Point
    RL: Point
    RR: Point
  }
  shadowEllipseNorm: { cx: number; cy: number; rx: number; ry: number } // in container coords
  tolerancePx?: number // default 2
  debounceMs?: number // default 16
}

export type Placement = {
  top: number
  left: number
  width: number
  height: number
}

export type AnchorDebug = {
  id: "FL" | "FR" | "RL" | "RR"
  wheelPx: Point
  expectedYOnEllipse: number
  deltaY: number
  pass: boolean
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/**
 * y on ellipse boundary at x:
 * ((x-cx)^2/rx^2) + ((y-cy)^2/ry^2) = 1
 * pick lower half (positive sqrt) for floor contact zone.
 */
function ellipseYAtXLower(
  x: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
) {
  const dx = x - cx
  const inside = 1 - (dx * dx) / (rx * rx)
  if (inside <= 0) return cy
  return cy + Math.sqrt(inside) * ry
}

export function useAbsolutePlacement({
  containerRef,
  carRectNorm,
  wheelAnchorsInCarNorm,
  shadowEllipseNorm,
  tolerancePx = 2,
  debounceMs = 16,
}: UseAbsolutePlacementArgs) {
  const [placement, setPlacement] = useState<Placement>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  })

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [debug, setDebug] = useState<AnchorDebug[]>([])
  const timerRef = useRef<number | null>(null)

  const compute = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const cw = rect.width
    const ch = rect.height
    if (!cw || !ch) return

    setContainerSize({ width: cw, height: ch })

    // Compute absolute car box from normalized rect
    const left = round2(clamp01(carRectNorm.x) * cw)
    const top = round2(clamp01(carRectNorm.y) * ch)
    const width = round2(clamp01(carRectNorm.w) * cw)
    const height = round2(clamp01(carRectNorm.h) * ch)

    setPlacement({ top, left, width, height })

    // Debug anchor checks against shadow ellipse
    const cx = shadowEllipseNorm.cx * cw
    const cy = shadowEllipseNorm.cy * ch
    const rx = shadowEllipseNorm.rx * cw
    const ry = shadowEllipseNorm.ry * ch

    const anchors = (["FL", "FR", "RL", "RR"] as const).map((id) => {
      const a = wheelAnchorsInCarNorm[id]
      const wheelPx = {
        x: left + a.x * width,
        y: top + a.y * height,
      }
      const expectedYOnEllipse = ellipseYAtXLower(wheelPx.x, cx, cy, rx, ry)
      const deltaY = wheelPx.y - expectedYOnEllipse
      return {
        id,
        wheelPx,
        expectedYOnEllipse,
        deltaY,
        pass: Math.abs(deltaY) <= tolerancePx,
      }
    })

    setDebug(anchors)
  }, [containerRef, carRectNorm, shadowEllipseNorm, wheelAnchorsInCarNorm, tolerancePx])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const schedule = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => compute(), debounceMs)
    }

    const ro = new ResizeObserver(schedule)
    ro.observe(el)

    // first paint
    compute()

    const onResize = () => schedule()
    window.addEventListener("resize", onResize)

    // DPR change (e.g. dragging between monitors)
    const dprMedia = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    )
    const onDprChange = () => schedule()
    dprMedia.addEventListener("change", onDprChange)

    // Orientation change (mobile rotation)
    const onOrientation = () => schedule()
    window.addEventListener("orientationchange", onOrientation)

    return () => {
      ro.disconnect()
      window.removeEventListener("resize", onResize)
      dprMedia.removeEventListener("change", onDprChange)
      window.removeEventListener("orientationchange", onOrientation)
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [containerRef, compute, debounceMs])

  const allAnchorsPass = useMemo(
    () => debug.length === 4 && debug.every((d) => d.pass),
    [debug]
  )

  return {
    placement, // apply to car layer style
    containerSize, // debug/telemetry
    anchorDebug: debug,
    allAnchorsPass,
    recompute: compute,
  }
}

/** Production assertion helper — call after placement to verify tolerance */
export function assertAnchorTolerance(
  deltas: Array<{ id: string; deltaY: number }>,
  tolerancePx = 2
) {
  const failed = deltas.filter((d) => Math.abs(d.deltaY) > tolerancePx)
  return {
    pass: failed.length === 0,
    failed,
  }
}
