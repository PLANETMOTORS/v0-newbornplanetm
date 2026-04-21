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
const TIRE_LINE_Y    = 0.84   // floor horizon — tires land here (84% of canvas height)
const CAR_FILL       = 0.92   // car fills 92% of canvas width
const TIRE_CONTACT_Y = 0.82   // default: tire bottom at 82% of image height (fallback)
const REFLECTION_OPACITY = 0.04 // floor reflection strength (subtle on bright floor)

// Studio colors are defined inline in the single continuous background gradient
// inside drawScene() — no separate wall/floor constants needed.

interface SpinViewerProps {
  images: string[]
  alt: string
}

interface TireDetectionResult {
  tireY: number        // ratio (0–1) — where the tire bottom is
  hasTransparency: boolean  // true if the image has meaningful alpha (background-removed)
}

/**
 * Detect the lowest opaque row in a frame image (tire bottom position).
 * Also detects whether the image has transparency (background-removed) or is
 * a fully opaque frame (original Drivee turntable with background).
 *
 * For opaque images, the studio floor/shadow rendering is skipped — the image
 * is drawn as-is, preserving the original Drivee turntable background.
 */
function detectTireBottom(img: HTMLImageElement): TireDetectionResult | null {
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

    // Quick transparency check: sample ~200 pixels along the top and bottom
    // edges. If ALL are fully opaque (alpha=255), the image has no transparency.
    let transparentPixels = 0
    const sampleRows = [0, 1, 2, h - 3, h - 2, h - 1]
    const step = Math.max(1, Math.floor(w / 40))
    for (const row of sampleRows) {
      for (let x = 0; x < w; x += step) {
        if (data[(row * w + x) * 4 + 3] < 250) transparentPixels++
      }
    }
    const hasTransparency = transparentPixels > 5

    if (!hasTransparency) {
      // Opaque image — return default positioning, flag as no transparency
      return { tireY: TIRE_CONTACT_Y, hasTransparency: false }
    }

    // Alpha > 200 to detect solid tire rubber (ignores semi-transparent
    // halo from background removal). Scan from very bottom — no skip,
    // since full-frame images have tires at 98-100% height.
    for (let y = h - 1; y >= Math.floor(h * 0.5); y--) {
      let count = 0
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 200) {
          count++
          if (count >= 15) return { tireY: y / h, hasTransparency: true }
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
  hasTransparency: boolean = true,
) {
  // ── OPAQUE MODE: image has its own background (Drivee turntable) ──
  // Use "cover" scaling — fill the entire canvas, crop overflow.
  // This eliminates gray gaps and naturally trims the turntable floor.
  if (!hasTransparency && carImg && carImg.naturalWidth > 0) {
    const imgW = carImg.naturalWidth
    const imgH = carImg.naturalHeight
    const imgAspect = imgW / imgH
    const canvasAspect = width / height
    let dw: number, dh: number, dx: number, dy: number
    if (imgAspect > canvasAspect) {
      // Image is wider than canvas — fit to height, crop sides
      dh = height
      dw = height * imgAspect
      dx = (width - dw) / 2
      dy = 0
    } else {
      // Image is taller than canvas — fit to width, crop top/bottom
      dw = width
      dh = width / imgAspect
      dx = 0
      dy = (height - dh) / 2
    }
    ctx.drawImage(carImg, dx, dy, dw, dh)
    return
  }
  const tireLineY = TIRE_LINE_Y * height

  // ── 1. Background: studio floor with visible ground plane ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
  bgGrad.addColorStop(0.00, "#FFFFFF")   // wall top — white
  bgGrad.addColorStop(0.40, "#F5F5F5")   // wall mid
  bgGrad.addColorStop(0.65, "#E8E8E8")   // wall-to-floor transition
  bgGrad.addColorStop(0.80, "#D0D0D0")   // floor near tires
  bgGrad.addColorStop(1.00, "#C8C8C8")   // floor bottom — darker for ground presence
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  if (!carImg || carImg.naturalWidth === 0) return

  // ── 2. Calculate car placement ──
  const imgW = carImg.naturalWidth
  const imgH = carImg.naturalHeight
  const aspect = imgW / imgH
  let carW = width * CAR_FILL
  let carH = carW / aspect
  if (carH > height * 0.95) {
    carH = height * 0.95
    carW = carH * aspect
  }

  const carTop = tireLineY - tireY * carH
  const carLeft = (width - carW) / 2
  const shadowCenterX = width / 2
  const tireBottomY = tireLineY

  // ── 3. Pre-car ambient shadow (wide soft pool under car) ──
  ctx.save()
  const shadowRx = carW * 0.50
  const shadowRy = carH * 0.14
  ctx.translate(shadowCenterX, tireBottomY + shadowRy * 0.15)
  ctx.scale(1, shadowRy / shadowRx)
  const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowRx)
  shadowGrad.addColorStop(0, "rgba(0,0,0,0.38)")
  shadowGrad.addColorStop(0.25, "rgba(0,0,0,0.28)")
  shadowGrad.addColorStop(0.55, "rgba(0,0,0,0.12)")
  shadowGrad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.arc(0, 0, shadowRx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── 4. Car image ──
  ctx.drawImage(carImg, carLeft, carTop, carW, carH)

  // ── 5. POST-CAR SHADOW: multiply-blended contact patch ──
  // Heavy dark ellipse drawn ON TOP of the tire zone using 'multiply'
  // compositing — visually anchors tires to ground, hides perspective issues.
  ctx.save()
  ctx.globalCompositeOperation = "multiply"
  const postShadowW = carW * 0.88
  const postShadowH = carH * 0.065
  const postShadowRx = postShadowW / 2
  ctx.translate(shadowCenterX, tireBottomY)
  ctx.scale(1, postShadowH / postShadowRx)
  const postGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, postShadowRx)
  postGrad.addColorStop(0, "rgba(40,40,40,0.90)")
  postGrad.addColorStop(0.30, "rgba(50,50,50,0.65)")
  postGrad.addColorStop(0.60, "rgba(70,70,70,0.30)")
  postGrad.addColorStop(1, "rgba(128,128,128,0)")
  ctx.fillStyle = postGrad
  ctx.beginPath()
  ctx.arc(0, 0, postShadowRx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── 6. Floor reflection ──
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
  reflFadeGrad.addColorStop(0, "rgba(216,216,216,0)")
  reflFadeGrad.addColorStop(1, "rgba(216,216,216,1)")
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
  const framesHaveTransparency = useRef<boolean>(true)

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
    // No clearRect needed — drawScene paints a full opaque background first.
    // Removing clearRect prevents a transparent-canvas flash that exposes
    // the container div background underneath (the "double layer" ghost).

    // Get the cached image for current frame
    const carImg = imageCache.current.get(frame) ?? null

    // Always use the stable median across all frames to eliminate inter-frame bounce
    const tireY = medianTireY.current

    drawScene(ctx, w, h, carImg, tireY, framesHaveTransparency.current)
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
    framesHaveTransparency.current = true // assume transparent until first frame proves otherwise

    let cancelled = false
    const preload = (src: string, idx: number) =>
      new Promise<void>((resolve) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          if (!cancelled) {
            imageCache.current.set(idx, img)
            const result = detectTireBottom(img)
            if (result !== null) {
              // First frame determines transparency mode for all frames
              if (idx === 0) {
                framesHaveTransparency.current = result.hasTransparency
              }
              if (result.hasTransparency) {
                perFrameTireY.current[idx] = result.tireY
                // Update median
                const detected = perFrameTireY.current.filter((v): v is number => v !== null)
                if (detected.length > 0) {
                  detected.sort((a, b) => a - b)
                  medianTireY.current = detected[Math.floor(detected.length / 2)]
                }
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
        background: "linear-gradient(to bottom, #FFFFFF 0%, #F5F5F5 40%, #E8E8E8 65%, #D0D0D0 80%, #C8C8C8 100%)", // must match canvas bgGrad exactly
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/planet-motors-logo.png"
            alt=""
            width={42}
            height={24}
            style={{ height: "24px", width: "auto" }}
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
