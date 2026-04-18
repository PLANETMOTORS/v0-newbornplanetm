"use client"

import { useCallback, useMemo, useRef } from "react"
import type { OverlayConfig, WheelId } from "@/config/overlay/overlay-types"

type DrawOptions = {
  /** Show debug guides (horizon line, safe box, wheel anchors). Default: false */
  showGuides?: boolean
  showShadow?: boolean
  showReflection?: boolean
  showTireMergeSpots?: boolean
}

type WheelObservation = Partial<
  Record<WheelId, { xPx: number; yPx: number }>
>

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v))

/**
 * Canvas-based overlay renderer for the 360° vehicle viewer.
 *
 * Draws studio background (wall + floor gradients), contact shadow,
 * reflection zone, and optional debug guides from the overlay config.
 *
 * Bug fixes vs original spec:
 * 1. verticalOffsetPx uses useRef (not useState) for frame-by-frame stability
 * 2. drawOptions memoized to prevent unnecessary draw recreations
 * 3. showGuides defaults to false for production
 */
export function useOverlayRenderer(
  config: OverlayConfig,
  drawOptions: DrawOptions = {},
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // FIX #1: useRef instead of useState — prevents stale reads during rapid
  // frame-by-frame tire merge corrections (React batches setState).
  const verticalOffsetRef = useRef(0)

  // FIX #2: memoize opts so `draw` dependency is stable across renders
  // eslint-disable-next-line react-hooks/exhaustive-deps -- individual props are listed
  const opts = useMemo<Required<DrawOptions>>(
    () => ({
      showGuides: false, // FIX #3: default false for production
      showShadow: true,
      showReflection: true,
      showTireMergeSpots: false,
      ...drawOptions,
    }),
    [
      drawOptions.showGuides,
      drawOptions.showShadow,
      drawOptions.showReflection,
      drawOptions.showTireMergeSpots,
    ],
  )

  const profile = useMemo(
    () =>
      config.profiles[config.activeProfile] ??
      Object.values(config.profiles)[0],
    [config.profiles, config.activeProfile],
  )

  const toPx = useCallback(
    (nx: number, ny: number, width: number, height: number) => {
      return { x: nx * width, y: ny * height + verticalOffsetRef.current }
    },
    [],
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const width = rect.width
    const height = rect.height

    ctx.clearRect(0, 0, width, height)

    // Background wall
    const horizonY = config.global.horizonY * height
    const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
    wallGrad.addColorStop(0, profile.colors.wallTop)
    wallGrad.addColorStop(1, profile.colors.wallMid)
    ctx.fillStyle = wallGrad
    ctx.fillRect(0, 0, width, horizonY)

    // Floor
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height)
    floorGrad.addColorStop(0, profile.colors.floorFar)
    floorGrad.addColorStop(1, profile.colors.floorNear)
    ctx.fillStyle = floorGrad
    ctx.fillRect(0, horizonY, width, height - horizonY)

    // Hotspot — subtle studio light reflection on the floor
    const hotspot = ctx.createRadialGradient(
      width * 0.5,
      horizonY + 40,
      10,
      width * 0.5,
      horizonY + 40,
      width * 0.22,
    )
    hotspot.addColorStop(0, "rgba(255,255,255,0.18)")
    hotspot.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = hotspot
    ctx.fillRect(0, 0, width, height)

    // Shadow zone
    if (opts.showShadow) {
      const sh = config.global.shadowEllipse
      const c = toPx(sh.cx, sh.cy, width, height)
      const rx = sh.rx * width
      const ry = sh.ry * height

      ctx.save()
      ctx.beginPath()
      ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,0,0,${profile.shadow.maxOpacity})`
      ctx.fill()

      const featherPx = (profile.shadow.featherPxAt4K / 4096) * width
      ctx.lineWidth = Math.max(1.5, featherPx)
      ctx.strokeStyle = "rgba(0,0,0,0.2)"
      ctx.stroke()
      ctx.restore()
    }

    // Reflection zone
    if (opts.showReflection) {
      const sh = config.global.shadowEllipse
      const c = toPx(sh.cx, sh.cy, width, height)
      const rx = sh.rx * width * 1.1
      const ry = sh.ry * height * 1.6
      const r = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rx)
      r.addColorStop(
        0,
        `rgba(255,255,255,${profile.reflection.maxOpacity})`,
      )
      r.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = r
      ctx.beginPath()
      ctx.ellipse(c.x, c.y + ry * 0.2, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Debug guides (only when showGuides is explicitly enabled)
    if (opts.showGuides) {
      // Horizon
      ctx.strokeStyle = "#ff3b30"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, horizonY)
      ctx.lineTo(width, horizonY)
      ctx.stroke()

      // Safe Box
      const sb = config.global.safeBox
      ctx.save()
      ctx.setLineDash([8, 6])
      ctx.strokeStyle = "#007aff"
      ctx.strokeRect(
        sb.x * width,
        sb.y * height,
        sb.w * width,
        sb.h * height,
      )
      ctx.restore()

      // Wheel anchors
      ctx.fillStyle = "#007aff"
      ctx.font = "12px sans-serif"
      for (const a of config.global.wheelAnchors) {
        const p = toPx(a.x, a.y, width, height)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillText(a.id, p.x + 7, p.y - 7)
      }
    }

    // Tire merge spots (debug)
    if (opts.showTireMergeSpots && config.global.tireMerge.enabled) {
      for (const spot of config.global.tireMerge.spots) {
        const p = toPx(spot.x, spot.y, width, height)
        const r = (spot.radiusPxAt1200w / 1200) * width

        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(0,200,83,0.9)"
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }
  }, [config, profile, opts, toPx])

  /**
   * Auto tire merge / contact correction:
   * Pass current detected tire pixel points from tracker each frame.
   * Returns suggested vertical correction (px) and updates internal offset.
   */
  const applyTireMergeCorrection = useCallback(
    (obs: WheelObservation) => {
      const currentOffset = verticalOffsetRef.current

      if (
        !config.global.tireMerge.enabled ||
        !config.runtimeRules.autoVerticalCorrection.enabled
      ) {
        return { applied: 0, nextOffset: currentOffset }
      }

      const canvas = canvasRef.current
      if (!canvas) return { applied: 0, nextOffset: currentOffset }
      const rect = canvas.getBoundingClientRect()
      const height = rect.height

      const deltas: number[] = []
      for (const anchor of config.global.wheelAnchors) {
        const ob = obs[anchor.id]
        if (!ob) continue
        const targetY = anchor.y * height + currentOffset
        const dy = targetY - ob.yPx // positive => car should go down
        deltas.push(dy)
      }

      if (!deltas.length)
        return { applied: 0, nextOffset: currentOffset }

      const sorted = [...deltas].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const deadZone =
        config.runtimeRules.autoVerticalCorrection.deadZonePx
      if (Math.abs(median) <= deadZone)
        return { applied: 0, nextOffset: currentOffset }

      const gain = config.runtimeRules.autoVerticalCorrection.gain
      const maxStep =
        config.runtimeRules.autoVerticalCorrection.maxCorrectionPxPerFrame
      const step = clamp(median * gain, -maxStep, maxStep)

      const next = currentOffset + step
      verticalOffsetRef.current = next
      return { applied: step, nextOffset: next }
    },
    [config],
  )

  const api = useMemo(
    () => ({
      canvasRef,
      draw,
      applyTireMergeCorrection,
      getVerticalOffsetPx: () => verticalOffsetRef.current,
      setVerticalOffsetPx: (v: number) => {
        verticalOffsetRef.current = v
      },
    }),
    [draw, applyTireMergeCorrection],
  )

  return api
}
