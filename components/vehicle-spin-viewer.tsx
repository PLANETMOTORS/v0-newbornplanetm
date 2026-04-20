"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Play, Pause, RotateCw, Hand, Maximize2, Minimize2, Loader2 } from "lucide-react"

/* ═══════════════════════════════════════════════════════════════════════════════
 * SINGLE-CANVAS 360° VEHICLE SPIN VIEWER
 *
 * Inspired by Drivee's approach: everything (background, shadow, car image)
 * is drawn on ONE canvas. No separate HTML layers, no z-index conflicts,
 * no layer alignment issues.
 *
 * Architecture:
 *   1. Canvas fills the container (4:3 aspect)
 *   2. Each frame: clear → draw background → draw shadow → draw car image
 *   3. Car image sized to fill ~80% of canvas width
 *   4. Tire bottom aligned to a floor line at ~80% of canvas height
 *   5. Shadow drawn as soft radial gradient at tire contact
 *
 * This eliminates ALL previous issues:
 *   - No CSS overflow-hidden clipping
 *   - No layer z-index conflicts
 *   - No separate coordinate spaces
 *   - No misalignment between canvas shadow and HTML img
 * ══════════════════════════════════════════════════════════════════════════════ */

// ── Studio environment constants ──
// TIRE_LINE_Y: where the tire rubber sits and shadow is centered (the actual
//   "ground plane" for physics). The background gradient above this line
//   smoothly transitions from wall to floor — no sharp seam.
const TIRE_LINE_Y    = 0.78   // tires land here, shadow centered here (raised from 0.76 to push tires lower in canvas)
const CAR_FILL       = 0.90   // car fills 90% of canvas width
const TIRE_CONTACT_Y = 0.82   // default: tire bottom at 82% of image height
const REFLECTION_OPACITY = 0.04 // floor reflection strength (subtle on bright floor)
// Tire contact offset: pushes tire bottom below the shadow center line so
// tires visually press INTO the floor zone rather than hovering above it.
const GROUND_PUSH    = 0.06   // push (6% of carH ≈ 33px) embeds tires into floor zone

// Studio colors are defined inline in the single continuous background gradient
// inside drawScene() — no separate wall/floor constants needed.

interface SpinViewerProps {
  images: string[]
  alt: string
}

/**
 * Detect the lowest opaque row in a frame image (tire bottom position).
 * Returns a ratio (0–1) representing where the tire rubber ends vertically.
 */
function detectTireBottom(img: HTMLImageElement): number | null {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return null

  try {
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    const ctx = c.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null

    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, w, h).data

    // Use alpha > 200 to detect solid tire rubber only (ignores semi-transparent
    // halo from background removal that creates a visible gap against dark floor)
    for (let y = h - 1; y >= Math.floor(h * 0.5); y--) {
      let count = 0
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 200) {
          count++
          if (count >= 15) return y / h
        }
      }
    }
  } catch {
    // CORS or canvas tainted
  }
  return null
}

/**
 * Draw the complete studio scene on canvas:
 *   1. Background (Carvana-style bright studio floor)
 *   2. Contact shadow (subtle elliptical gradient)
 *   3. Car image (raw — no alpha cleaning needed on bright floor)
 *   4. Floor reflection with fade
 *
 * WHY BRIGHT FLOOR SOLVES THE FLOATING PROBLEM:
 * Semi-transparent halo pixels from background removal carry turntable color (br≈180).
 * On dark floor (br≈92):  composite = 180×0.5 + 92×0.5 = 136 → 44pt ABOVE floor → visible bright halo
 * On bright floor (br≈220): composite = 180×0.5 + 220×0.5 = 200 → 20pt BELOW floor → invisible
 * Bright floor also creates HIGH contrast with dark tires (200+ points) → crisp contact edge.
 * No alpha cleaning, no silhouette, no defringe needed — just physics of compositing.
 */
function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  carImg: HTMLImageElement | null,
  tireY: number,
) {
  const tireLineY = TIRE_LINE_Y * height

  // ── 1. Background: Carvana-style BRIGHT studio floor ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
  bgGrad.addColorStop(0.00, "#FFFFFF")   // wall top — white
  bgGrad.addColorStop(0.30, "#F8F8F8")   // wall mid — near-white
  bgGrad.addColorStop(0.50, "#ECECEC")   // transition zone
  bgGrad.addColorStop(0.62, "#DCDCDC")   // floor start (br≈220)
  bgGrad.addColorStop(1.00, "#DCDCDC")   // UNIFORM bright floor
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  if (!carImg || carImg.naturalWidth === 0) return

  // ── Calculate car placement ──
  const imgW = carImg.naturalWidth
  const imgH = carImg.naturalHeight
  const aspect = imgW / imgH
  let carW = width * CAR_FILL
  let carH = carW / aspect
  // Constrain by height to prevent clipping in fullscreen/widescreen layouts
  if (carH > height * 0.92) {
    carH = height * 0.92
    carW = carH * aspect
  }
  const tireBottomInCar = tireY * carH
  const carTop = tireLineY - tireBottomInCar + GROUND_PUSH * carH
  const carLeft = (width - carW) / 2
  const shadowCenterX = width / 2

  // ── 2. Shadow: Carvana-style ground shadow ──
  // The shadow must be centered at the ACTUAL tire bottom (not tireLineY),
  // because GROUND_PUSH shifts the tire bottom ~33px below tireLineY.
  // If centered at tireLineY, the shadow fades to <4% by the time it reaches
  // the visible area below the tires — making it invisible.
  const tireBottomY = carTop + tireY * carH

  // Layer A: large soft ambient pool (visible dark area below and around car)
  ctx.save()
  const shadowRx = carW * 0.46
  const shadowRy = carH * 0.14   // tall ellipse — extends well below tire bottom
  ctx.translate(shadowCenterX, tireBottomY)
  ctx.scale(1, shadowRy / shadowRx)
  const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowRx)
  shadowGrad.addColorStop(0, "rgba(0,0,0,0.35)")     // strong dark center
  shadowGrad.addColorStop(0.25, "rgba(0,0,0,0.25)")
  shadowGrad.addColorStop(0.50, "rgba(0,0,0,0.15)")
  shadowGrad.addColorStop(0.75, "rgba(0,0,0,0.06)")
  shadowGrad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.arc(0, 0, shadowRx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Layer B: tight contact shadow at tire bottom (the "ground contact" strip)
  const contactH = carH * 0.015
  const contactW = carW * 0.80   // narrower than car — concentrated under wheels
  const contactLeft = (width - contactW) / 2
  const contactGrad = ctx.createLinearGradient(contactLeft, 0, contactLeft + contactW, 0)
  contactGrad.addColorStop(0, "rgba(0,0,0,0)")
  contactGrad.addColorStop(0.08, "rgba(0,0,0,0.30)")
  contactGrad.addColorStop(0.5, "rgba(0,0,0,0.35)")
  contactGrad.addColorStop(0.92, "rgba(0,0,0,0.30)")
  contactGrad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = contactGrad
  ctx.fillRect(contactLeft, tireBottomY - contactH * 0.3, contactW, contactH)

  // ── 3. Car image (raw — halo blends naturally with bright floor) ──
  ctx.drawImage(carImg, carLeft, carTop, carW, carH)

  // ── 4. Floor reflection (starts at tire bottom, not tireLineY) ──
  ctx.save()
  ctx.globalAlpha = REFLECTION_OPACITY
  ctx.beginPath()
  ctx.rect(0, tireBottomY, width, height - tireBottomY)
  ctx.clip()
  ctx.translate(0, tireBottomY * 2)
  ctx.scale(1, -1)
  ctx.drawImage(carImg, carLeft, carTop, carW, carH)
  ctx.restore()

  // Fade the reflection into the bright floor
  const reflFadeGrad = ctx.createLinearGradient(0, tireBottomY, 0, tireBottomY + carH * 0.20)
  reflFadeGrad.addColorStop(0, "rgba(220,220,220,0)")   // transparent at tire bottom
  reflFadeGrad.addColorStop(1, "rgba(220,220,220,1)")   // opaque floor color (#DCDCDC)
  ctx.fillStyle = reflFadeGrad
  ctx.fillRect(carLeft, tireBottomY, carW, carH * 0.20)
}

export function VehicleSpinViewer({ images, alt }: SpinViewerProps) {
  const [frame, setFrame] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragStartX = useRef(0)
  const dragStartFrame = useRef(0)
  const lastX = useRef(0)
  const velocity = useRef(0)
  const momentumRef = useRef<number | null>(null)
  const drawFrameRef = useRef<() => void>(() => {})

  // ── Image cache ──
  // Stores loaded Image objects for instant canvas drawing
  // (No alpha cleaning needed — bright Carvana-style floor blends halo naturally)
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map())
  const perFrameTireY = useRef<(number | null)[]>([])
  const medianTireY = useRef<number>(TIRE_CONTACT_Y)

  const totalFrames = images.length
  const sensitivity = totalFrames > 0 ? Math.max(3, Math.round(800 / totalFrames)) : 3
  const loadProgress = totalFrames > 0 ? Math.round((loadedCount / totalFrames) * 100) : 0
  const isReady = loadedCount >= 1

  // Stable key: only re-run preload when actual URLs change, not just array reference
  const imagesKey = useMemo(() => images.join('\n'), [images])

  // ── Draw current frame on canvas ──
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    // Size canvas to match container at device pixel ratio
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // Get the cached image for current frame
    const carImg = imageCache.current.get(frame) ?? null

    // Use per-frame tire Y, or median of detected values, or fallback
    const tireY = perFrameTireY.current[frame] ?? medianTireY.current

    drawScene(ctx, w, h, carImg, tireY)
  }, [frame])

  // Keep ref always pointing to the latest drawFrame
  drawFrameRef.current = drawFrame

  // Redraw on frame change or resize
  useEffect(() => {
    drawFrame()
  }, [drawFrame, isFullscreen, loadedCount])

  // ResizeObserver for responsive redraw — uses component-level ref
  // so the callback always invokes the latest drawFrame closure
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => drawFrameRef.current())
    ro.observe(el)
    return () => ro.disconnect()
  }, [isFullscreen])

  // ── Progressive preloading ──
  useEffect(() => {
    if (images.length === 0) return
    setLoadedCount(0)
    setFrame(0)
    imageCache.current.clear()
    perFrameTireY.current = new Array(images.length).fill(null)

    let cancelled = false
    const preload = (src: string, idx: number) =>
      new Promise<void>((resolve) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          if (!cancelled) {
            imageCache.current.set(idx, img)
            const tireY = detectTireBottom(img)
            if (tireY !== null) {
              perFrameTireY.current[idx] = tireY
              // Update median
              const detected = perFrameTireY.current.filter((v): v is number => v !== null)
              if (detected.length > 0) {
                detected.sort((a, b) => a - b)
                medianTireY.current = detected[Math.floor(detected.length / 2)]
              }
            }
            setLoadedCount((c) => c + 1)
          }
          resolve()
        }
        img.onerror = () => {
          if (!cancelled) setLoadedCount((c) => c + 1)
          resolve()
        }
        img.src = src
      })

    // Load first frame with priority, then rest in batches
    preload(images[0], 0).then(() => {
      if (cancelled) return
      const remaining = images.slice(1)
      let idx = 0
      const batch = async () => {
        while (idx < remaining.length && !cancelled) {
          const chunk = remaining.slice(idx, idx + 6)
          await Promise.all(chunk.map((src, i) => preload(src, idx + i + 1)))
          idx += 6
        }
      }
      batch()
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesKey])

  // ── Auto-play ──
  useEffect(() => {
    if (!isAutoPlaying || !isReady || totalFrames === 0) return
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % totalFrames)
    }, 120)
    return () => clearInterval(interval)
  }, [isAutoPlaying, totalFrames, isReady])

  // ── Fullscreen API ──
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen((f) => !f)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  // ── Hint dismiss ──
  const dismissHint = useCallback(() => {
    if (showHint) setShowHint(false)
  }, [showHint])

  // ── Pointer handlers ──
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dismissHint()
    setIsAutoPlaying(false)
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartFrame.current = frame
    lastX.current = e.clientX
    velocity.current = 0
    if (momentumRef.current) cancelAnimationFrame(momentumRef.current)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [frame, dismissHint])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragStartX.current
    velocity.current = e.clientX - lastX.current
    lastX.current = e.clientX
    const frameDelta = Math.round(deltaX / sensitivity)
    const newFrame = ((dragStartFrame.current + frameDelta) % totalFrames + totalFrames) % totalFrames
    setFrame(newFrame)
  }, [isDragging, sensitivity, totalFrames])

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    const startVelocity = velocity.current
    if (Math.abs(startVelocity) > 2) {
      let v = startVelocity * 0.5
      const tick = () => {
        if (Math.abs(v) < 0.3) return
        v *= 0.92
        setFrame((prev) => {
          const dir = v > 0 ? 1 : -1
          return ((prev + dir) % totalFrames + totalFrames) % totalFrames
        })
        momentumRef.current = requestAnimationFrame(tick)
      }
      momentumRef.current = requestAnimationFrame(tick)
    }
  }, [isDragging, totalFrames])

  // ── Keyboard ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (totalFrames === 0) return
    if (e.key === "ArrowRight") {
      setFrame((prev) => (prev + 1) % totalFrames)
      e.preventDefault()
    } else if (e.key === "ArrowLeft") {
      setFrame((prev) => (prev - 1 + totalFrames) % totalFrames)
      e.preventDefault()
    } else if (e.key === " ") {
      setIsAutoPlaying((p) => !p)
      e.preventDefault()
    } else if (e.key === "f" || e.key === "F") {
      toggleFullscreen()
      e.preventDefault()
    } else if (e.key === "Escape" && isFullscreen) {
      document.exitFullscreen().catch(() => setIsFullscreen(false))
    }
  }, [totalFrames, toggleFullscreen, isFullscreen])

  // ── Render ──
  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={isReady ? handlePointerDown : undefined}
      onPointerMove={isReady ? handlePointerMove : undefined}
      onPointerUp={isReady ? handlePointerUp : undefined}
      onPointerCancel={isReady ? handlePointerUp : undefined}
      className={`w-full overflow-hidden select-none touch-none focus:outline-none focus:ring-2 focus:ring-primary ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none"
          : "relative aspect-[4/3] rounded-xl"
      }`}
      style={{
        cursor: !isReady ? "default" : isDragging ? "grabbing" : "grab",
        background: "#505458", // fallback color while canvas renders (matches dark floor)
      }}
      role="region"
      aria-label={`360° Interactive View — ${alt}`}
      aria-roledescription="360° image spinner"
    >
      {/* ── Single canvas — draws background + shadow + car image ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Empty state */}
      {totalFrames === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <RotateCw className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground font-medium">360° view not available</p>
        </div>
      )}

      {/* Loading state */}
      {totalFrames > 0 && !isReady && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground font-medium">Loading 360° view…</p>
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Preload progress bar */}
      {isReady && loadProgress < 100 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted/50 z-10">
          <div
            className="h-full bg-primary/60 transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      )}

      {/* 360° badge */}
      {isReady && !isDragging && !isAutoPlaying && (
        <div className="absolute left-4 z-10 pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)" }}>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200">
            <span className="text-xs font-bold text-gray-700">360°</span>
          </div>
        </div>
      )}

      {/* Planet Motors logo */}
      {isReady && (
        <div className="absolute bottom-3 right-14 z-[3] pointer-events-none opacity-40">
          <img
            src="/images/planet-motors-logo.png"
            alt=""
            width={42}
            height={24}
            style={{ height: '24px', width: 'auto' }}
            draggable={false}
          />
        </div>
      )}

      {/* Drag hint */}
      {isReady && showHint && !isAutoPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity z-10">
          <div className="flex flex-col items-center gap-2 text-white animate-pulse">
            <Hand className="h-10 w-10" />
            <span className="text-sm font-medium">Drag to explore</span>
          </div>
        </div>
      )}

      {/* Controls */}
      {isReady && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          <button
            onClick={(e) => { e.stopPropagation(); setIsAutoPlaying(!isAutoPlaying); dismissHint() }}
            className="px-3 py-1.5 bg-background/80 backdrop-blur rounded-lg flex items-center gap-1.5 hover:bg-background transition text-sm font-medium shadow-sm"
            aria-label={isAutoPlaying ? "Pause auto-spin" : "Start auto-spin"}
          >
            {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAutoPlaying ? "Pause" : "Auto Spin"}
          </button>

          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-background/70 backdrop-blur rounded text-xs text-muted-foreground">
              <RotateCw className="h-3 w-3 inline mr-1" />
              {frame + 1}/{totalFrames}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
              className="p-1.5 bg-background/80 backdrop-blur rounded-lg hover:bg-background transition shadow-sm"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
