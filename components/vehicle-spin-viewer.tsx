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
// FLOOR_START_Y: where the dark floor COLOR begins (high enough so undercar
//   transparent pixels show dark floor, not light wall — the #1 grounding cue)
// TIRE_LINE_Y: where the tire rubber sits and shadow is centered (the actual
//   "ground plane" for physics). These are intentionally decoupled: floor color
//   starts well ABOVE tire contact so the entire undercar area reads as ground.
const FLOOR_START_Y  = 0.62   // floor color begins at 62% — under car body is dark
const TIRE_LINE_Y    = 0.76   // tires land here, shadow centered here
const CAR_FILL       = 0.90   // car fills 90% of canvas width
const TIRE_CONTACT_Y = 0.82   // default: tire bottom at 82% of image height
const REFLECTION_OPACITY = 0.08 // floor reflection strength (subtle but effective)

// ── Studio colors (Carvana showroom: bright wall, medium-dark floor) ──
const WALL_TOP     = "#F5F2EF"
const WALL_BOTTOM  = "#E8E5E0"
const FLOOR_NEAR   = "#7A7E83"
const FLOOR_FAR    = "#5A5E63"

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
 *   1. Background (wall gradient + floor gradient)
 *   2. Contact shadow (soft radial gradient at floor line)
 *   3. Car image (positioned so tires sit on floor line)
 */
function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  carImg: HTMLImageElement | null,
  tireY: number,
) {
  // ── 1. Background ──
  // floorStartY: where dark floor color begins (high, so undercar area is dark)
  // tireLineY:   where tires rest and shadow is drawn (the visual "ground")
  const floorStartY = FLOOR_START_Y * height
  const tireLineY   = TIRE_LINE_Y * height

  // Wall gradient (top section — ends at floorStartY)
  const wallGrad = ctx.createLinearGradient(0, 0, 0, floorStartY)
  wallGrad.addColorStop(0, WALL_TOP)
  wallGrad.addColorStop(1, WALL_BOTTOM)
  ctx.fillStyle = wallGrad
  ctx.fillRect(0, 0, width, floorStartY)

  // Floor gradient (starts at floorStartY — covers undercar area + visible floor)
  const floorGrad = ctx.createLinearGradient(0, floorStartY, 0, height)
  floorGrad.addColorStop(0, FLOOR_NEAR)
  floorGrad.addColorStop(1, FLOOR_FAR)
  ctx.fillStyle = floorGrad
  ctx.fillRect(0, floorStartY, width, height - floorStartY)

  // Subtle hotspot (studio light reflection on floor, centered at tire line)
  const hs = ctx.createRadialGradient(
    width * 0.5, tireLineY + 10, 5,
    width * 0.5, tireLineY + 10, width * 0.25,
  )
  hs.addColorStop(0, "rgba(255,255,255,0.08)")
  hs.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = hs
  ctx.fillRect(0, floorStartY, width, height - floorStartY)

  if (!carImg || carImg.naturalWidth === 0) return

  // ── Calculate car placement ──
  const imgW = carImg.naturalWidth
  const imgH = carImg.naturalHeight
  const aspect = imgW / imgH

  // Car fills CAR_FILL of canvas width, maintaining aspect ratio
  const carW = width * CAR_FILL
  const carH = carW / aspect

  // Position: tire bottom lands on the TIRE LINE (not floor start)
  const tireBottomInCar = tireY * carH
  const carTop = tireLineY - tireBottomInCar
  const carLeft = (width - carW) / 2

  // ── 2. Shadow system ──
  // All shadow layers are drawn BEFORE the car image, so the car body and
  // wheels render ON TOP. Shadow only shows through transparent areas of
  // the car image (the undercar gap between body and ground).
  const shadowCenterX = width / 2

  // Layer 0: Ambient occlusion — large, tall, soft darkening under the car.
  // This bridges the gap between car body bottom and tire contact line.
  // Centered slightly above tire line so it covers the undercar gap area.
  const aoRx = carW * 0.46
  const aoRy = height * 0.10             // tall: covers ~60px of undercar gap
  const aoCenterY = tireLineY - aoRy * 0.3  // shifted up into undercar area
  ctx.save()
  ctx.translate(shadowCenterX, aoCenterY)
  ctx.scale(1, aoRy / aoRx)
  const aoGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, aoRx)
  aoGrad.addColorStop(0, "rgba(0,0,0,0.25)")
  aoGrad.addColorStop(0.4, "rgba(0,0,0,0.15)")
  aoGrad.addColorStop(0.7, "rgba(0,0,0,0.05)")
  aoGrad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = aoGrad
  ctx.beginPath()
  ctx.arc(0, 0, aoRx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Layer 1: Broad contact shadow (medium height, centered at tire line)
  const shadowRx = carW * 0.48
  const shadowRy = height * 0.04          // taller than before (was 0.025)
  ctx.save()
  ctx.translate(shadowCenterX, tireLineY + 2)
  ctx.scale(1, shadowRy / shadowRx)
  const ambientGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowRx)
  ambientGrad.addColorStop(0, "rgba(0,0,0,0.35)")
  ambientGrad.addColorStop(0.3, "rgba(0,0,0,0.22)")
  ambientGrad.addColorStop(0.6, "rgba(0,0,0,0.08)")
  ambientGrad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = ambientGrad
  ctx.beginPath()
  ctx.arc(0, 0, shadowRx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Layer 2: Tight contact line (very dark, narrow — visual ground anchor)
  ctx.save()
  ctx.translate(shadowCenterX, tireLineY + 1)
  const contactRx = carW * 0.42
  const contactRy = height * 0.005
  ctx.scale(1, contactRy / contactRx)
  const contactGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, contactRx)
  contactGrad.addColorStop(0, "rgba(0,0,0,0.65)")
  contactGrad.addColorStop(0.5, "rgba(0,0,0,0.40)")
  contactGrad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = contactGrad
  ctx.beginPath()
  ctx.arc(0, 0, contactRx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── 3. Car image ──
  ctx.drawImage(carImg, carLeft, carTop, carW, carH)

  // ── 4. Floor reflection (professional showroom effect) ──
  // Draw a vertically-flipped, faded copy of the car below the tire line.
  // This is the #1 visual cue used by BMW/Mercedes/Carvana configurators
  // to make a car look "on the ground" rather than floating.
  ctx.save()
  ctx.globalAlpha = REFLECTION_OPACITY
  // Clip to area below tire line (reflection shouldn't bleed upward)
  ctx.beginPath()
  ctx.rect(0, tireLineY, width, height - tireLineY)
  ctx.clip()
  // Flip vertically around the tire line
  ctx.translate(0, tireLineY * 2)
  ctx.scale(1, -1)
  ctx.drawImage(carImg, carLeft, carTop, carW, carH)
  ctx.restore()

  // Fade the reflection out with distance from tire line
  const reflFadeGrad = ctx.createLinearGradient(0, tireLineY, 0, tireLineY + carH * 0.30)
  reflFadeGrad.addColorStop(0, "rgba(122,126,131,0)")  // transparent (keep reflection)
  reflFadeGrad.addColorStop(1, "rgba(122,126,131,1)")  // opaque floor color
  ctx.fillStyle = reflFadeGrad
  ctx.fillRect(carLeft, tireLineY, carW, carH * 0.30)
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
        background: FLOOR_FAR, // fallback color while canvas renders
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
