"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Play, Pause, RotateCw, Hand, Maximize2, Minimize2, Loader2 } from "lucide-react"
import { useOverlayRenderer } from "@/hooks/use-overlay-renderer"
import { overlayConfig } from "@/config/overlay/loader/loadOverlayConfig"

// ── Tire-floor alignment ──
// The shadow ellipse center (from overlay config) defines the visual floor
// contact line.  Each frame's tire-bottom ratio is detected during preload
// by scanning the alpha channel.  The fallback constant is only used before
// detection completes.
const SHADOW_CENTER_Y = 0.87    // from overlay config (cy of shadow ellipse)
const TIRE_CONTACT_Y  = 0.80    // fallback: mean tire-bottom across Jeep frames
const CAR_SCALE       = 1.25    // enlargement factor so the car fills the viewport

interface CarStyle {
  position: "absolute"
  top: string
  left: string
  width: string
  height: string
  maxWidth: string
  maxHeight: string
}

interface SpinViewerProps {
  /** Ordered array of image URLs (walk-around frames). */
  images: string[]
  /** Vehicle name for alt text. */
  alt: string
}

/**
 * Detect the lowest opaque row in a frame image (tire bottom position).
 * Returns a ratio (0–1) representing where the tire rubber ends vertically.
 * Uses an offscreen canvas to read the alpha channel.
 */
function detectTireBottom(img: HTMLImageElement): number | null {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return null

  try {
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null

    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, w, h).data

    // Scan from bottom up — find last row with significant opaque content
    // (at least 15 pixels with alpha > 128 to ignore stray artifacts)
    for (let y = h - 1; y >= Math.floor(h * 0.5); y--) {
      let opaqueCount = 0
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 128) {
          opaqueCount++
          if (opaqueCount >= 15) return y / h
        }
      }
    }
  } catch {
    // CORS or canvas tainted — fall back to constant
  }
  return null
}

/**
 * Native 360° Vehicle Spin Viewer
 *
 * Renders an image-sequence 360° spinner — the same technique Carvana uses.
 * Drag / swipe / arrow-key to rotate, with momentum physics.
 *
 * Features:
 *  - Progressive preloading with visual progress bar
 *  - Per-frame tire-bottom detection for jitter-free alignment
 *  - Fullscreen mode (Escape to exit)
 *  - Auto-spin with play/pause
 *  - Keyboard: ← → to rotate, Space to toggle auto-spin, F for fullscreen
 *  - Smooth momentum on release
 *  - "Drag to explore" hint on first view
 */
export function VehicleSpinViewer({ images, alt }: SpinViewerProps) {
  const [frame, setFrame] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const { canvasRef, draw } = useOverlayRenderer(overlayConfig)
  const dragStartX = useRef(0)
  const dragStartFrame = useRef(0)
  const lastX = useRef(0)
  const velocity = useRef(0)
  const momentumRef = useRef<number | null>(null)

  // ── Per-frame tire detection ──
  // Stores the detected tire-bottom ratio for each frame index.
  // Populated during preload; used in placement calculation.
  const perFrameTireY = useRef<(number | null)[]>([])

  // ── Absolute-positioning placement ──
  const [frameAspect, setFrameAspect] = useState(4 / 3)
  const [carStyle, setCarStyle] = useState<CarStyle>({
    position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%",
    maxWidth: "none", maxHeight: "none",
  })

  // Recalculate placement whenever container resizes, fullscreen toggles, or frame changes
  const recalcPlacement = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const { width: cw, height: ch } = el.getBoundingClientRect()
    if (cw === 0 || ch === 0) return

    const aspect = frameAspect

    // Fit the image to the container (contain), then scale up
    let fitW: number, fitH: number
    if (cw / ch > aspect) {
      fitH = ch;  fitW = ch * aspect
    } else {
      fitW = cw;  fitH = cw / aspect
    }
    const rw = fitW * CAR_SCALE
    const rh = fitH * CAR_SCALE

    // Use per-frame tire Y if available, otherwise fall back to constant
    const tireY = perFrameTireY.current[frame] ?? TIRE_CONTACT_Y

    // Target: tire bottom in rendered image lands on shadow-ellipse center
    const floorY       = SHADOW_CENTER_Y * ch
    const tireBottomPx = tireY * rh

    const top  = floorY - tireBottomPx
    const left = (cw - rw) / 2

    setCarStyle({
      position: "absolute",
      top:    `${Math.round(top)}px`,
      left:   `${Math.round(left)}px`,
      width:  `${Math.round(rw)}px`,
      height: `${Math.round(rh)}px`,
      maxWidth: "none",
      maxHeight: "none",
    })
  }, [frameAspect, frame])

  // Re-run placement on resize and fullscreen
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    recalcPlacement()
    const ro = new ResizeObserver(recalcPlacement)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isFullscreen, recalcPlacement])

  const totalFrames = images.length
  const sensitivity = totalFrames > 0 ? Math.max(3, Math.round(800 / totalFrames)) : 3
  const loadProgress = totalFrames > 0 ? Math.round((loadedCount / totalFrames) * 100) : 0
  const isReady = loadedCount >= 1

  // ── Progressive preloading with tire detection ──
  useEffect(() => {
    if (images.length === 0) return
    setLoadedCount(0)
    perFrameTireY.current = new Array(images.length).fill(null)

    let cancelled = false
    const preload = (src: string, idx: number, isFirst = false) =>
      new Promise<void>((resolve) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous" // needed for canvas pixel access
        img.onload = () => {
          if (!cancelled) {
            // Capture aspect ratio from first frame
            if (isFirst && img.naturalWidth > 0 && img.naturalHeight > 0) {
              setFrameAspect(img.naturalWidth / img.naturalHeight)
            }
            // Detect tire bottom position for this frame
            const tireY = detectTireBottom(img)
            if (tireY !== null) {
              perFrameTireY.current[idx] = tireY
            }
            setLoadedCount((c) => c + 1)
          }
          resolve()
        }
        img.onerror = () => { if (!cancelled) setLoadedCount((c) => c + 1); resolve() }
        img.src = src
      })

    // Load first frame with priority, then rest in batches
    preload(images[0], 0, true).then(() => {
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
  }, [images])

  // ── Overlay canvas draw ──
  useEffect(() => {
    draw()
    const onResize = () => draw()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [draw, isFullscreen])

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

  // ── Pointer (mouse + touch) handlers ──
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
      className={`relative w-full rounded-xl overflow-hidden select-none touch-none focus:outline-none focus:ring-2 focus:ring-primary ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "aspect-[4/3]"
      }`}
      style={{
        cursor: !isReady ? "default" : isDragging ? "grabbing" : "grab",
      }}
      role="region"
      aria-label={`360° Interactive View — ${alt}`}
      aria-roledescription="360° image spinner"
    >
      {/* ── Studio environment — canvas-based overlay renderer ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[0] pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Empty state — no frames available */}
      {totalFrames === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <RotateCw className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground font-medium">360° view not available</p>
        </div>
      )}

      {/* Loading state — show spinner + progress bar until first frame loads */}
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

      {/* Current frame — positioned with pixel-precise absolute coordinates
           so the tire-bottom line lands exactly on the shadow-ellipse center.
           No CSS transforms are used, avoiding overflow-hidden clipping. */}
      {isReady && images[frame] && (
        <img
          src={images[frame]}
          alt={`${alt} — angle ${frame + 1} of ${totalFrames}`}
          className="z-[2] pointer-events-none"
          style={carStyle}
          draggable={false}
        />
      )}



      {/* Contact shadow is now rendered by the canvas overlay renderer */}

      {/* Planet Motors logo — subtle branding in bottom-right corner */}
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

      {/* Preload progress bar — shows during background loading after first frame */}
      {isReady && loadProgress < 100 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted/50 z-10">
          <div
            className="h-full bg-primary/60 transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      )}

      {/* 360° floating badge (like Clutch/Carvana) */}
      {isReady && !isDragging && !isAutoPlaying && (
        <div className="absolute left-4 z-10 pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)" }}>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200">
            <span className="text-xs font-bold text-gray-700">360°</span>
          </div>
        </div>
      )}

      {/* Drag hint overlay */}
      {isReady && showHint && !isAutoPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity z-10">
          <div className="flex flex-col items-center gap-2 text-white animate-pulse">
            <Hand className="h-10 w-10" />
            <span className="text-sm font-medium">Drag to explore</span>
          </div>
        </div>
      )}

      {/* Controls bar */}
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
