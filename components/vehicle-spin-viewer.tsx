"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Play, Pause, RotateCw, Hand, Maximize2, Minimize2, Loader2 } from "lucide-react"
import { useOverlayRenderer } from "@/hooks/use-overlay-renderer"
import { overlayConfig } from "@/config/overlay/loader/loadOverlayConfig"

// ── Tire-floor alignment constants ──
// Approach: absolute positioning (no CSS transforms) to avoid overflow-hidden clipping.
// The ResizeObserver computes exact pixel top/left/width/height so the tire contact
// line lands precisely on the shadow ellipse center at any viewport size.
const SHADOW_CENTER_Y = 0.7556   // from overlay config (cy of shadow ellipse)
const TIRE_CONTACT_Y  = 0.825    // measured tire contact at ~82.5% from top of image
const IMG_ASPECT      = 4 / 3    // 1200 × 900 source frames
const SCALE_FACTOR    = 1.25     // how much larger than "fit" the car should render

/** Snap to nearest 0.5 CSS-px to avoid sub-pixel rendering artefacts. */
const snap = (v: number) => Math.round(v * 2) / 2

interface SpinViewerProps {
  /** Ordered array of image URLs (walk-around frames). */
  images: string[]
  /** Vehicle name for alt text. */
  alt: string
}

/**
 * Native 360° Vehicle Spin Viewer
 *
 * Renders an image-sequence 360° spinner — the same technique Carvana uses.
 * Drag / swipe / arrow-key to rotate, with momentum physics.
 *
 * Features:
 *  - Progressive preloading with visual progress bar
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

  // ── Dynamic tire-floor alignment (absolute positioning) ──
  // Instead of CSS scale+translateY (which gets clipped by overflow-hidden),
  // we compute exact pixel position/size so the image renders with tires
  // sitting precisely on the shadow ellipse center. No transforms needed.
  //
  // Algorithm:
  //   1. Compute how large the image should render (SCALE_FACTOR × fit-to-container)
  //   2. Find where the tire contact line falls in that rendered image
  //   3. Position the image so that tire line = shadow center Y in the container
  //   4. Center horizontally
  const [carStyle, setCarStyle] = useState<React.CSSProperties>({
    position: "absolute",
    visibility: "hidden",
  })
  const [showDebug, setShowDebug] = useState(false)
  // Store computed layout values for the debug overlay
  const layoutRef = useRef({ floorY: 0, tireY: 0, imgTop: 0, imgLeft: 0, renderW: 0, renderH: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const recalc = () => {
      const { width: cw, height: ch } = el.getBoundingClientRect()
      if (cw === 0 || ch === 0) return

      // How large the image would be if it "fit" the container (object-contain)
      const fitW = Math.min(cw, ch * IMG_ASPECT)
      const fitH = fitW / IMG_ASPECT

      // Scale up for a more impactful presentation
      const renderW = snap(fitW * SCALE_FACTOR)
      const renderH = snap(fitH * SCALE_FACTOR)

      // Where the tire contact line falls in the rendered image (px from image top)
      const tireY = snap(TIRE_CONTACT_Y * renderH)

      // Where the shadow center is in the container (px from container top)
      const floorY = snap(SHADOW_CENTER_Y * ch)

      // Position image so tire line = floor line
      const imgTop = snap(floorY - tireY)
      const imgLeft = snap((cw - renderW) / 2)

      layoutRef.current = { floorY, tireY, imgTop, imgLeft, renderW, renderH }

      setCarStyle({
        position: "absolute",
        top: `${imgTop}px`,
        left: `${imgLeft}px`,
        width: `${renderW}px`,
        height: `${renderH}px`,
        visibility: "visible",
      })
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(el)

    // Also recalculate on DPR change (e.g. dragging window between monitors)
    // and orientation change (mobile rotation)
    const dprMedia = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    const onDprChange = () => recalc()
    dprMedia.addEventListener("change", onDprChange)

    const onOrientation = () => recalc()
    window.addEventListener("orientationchange", onOrientation)

    return () => {
      ro.disconnect()
      dprMedia.removeEventListener("change", onDprChange)
      window.removeEventListener("orientationchange", onOrientation)
    }
  }, [isFullscreen])

  const totalFrames = images.length
  const sensitivity = totalFrames > 0 ? Math.max(3, Math.round(800 / totalFrames)) : 3
  const loadProgress = totalFrames > 0 ? Math.round((loadedCount / totalFrames) * 100) : 0
  const isReady = loadedCount >= 1 // Show spinner once first frame loads

  // ── Progressive preloading ──
  // Load frame 0 first (hero), then preload the rest in background.
  useEffect(() => {
    if (images.length === 0) return
    setLoadedCount(0)

    let cancelled = false
    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new window.Image()
        img.onload = () => { if (!cancelled) setLoadedCount((c) => c + 1); resolve() }
        img.onerror = () => { if (!cancelled) setLoadedCount((c) => c + 1); resolve() }
        img.src = src
      })

    // Load first frame with priority, then rest in parallel batches
    preload(images[0]).then(() => {
      if (cancelled) return
      // Preload remaining frames in batches of 6 to avoid network congestion
      const remaining = images.slice(1)
      let idx = 0
      const batch = async () => {
        while (idx < remaining.length && !cancelled) {
          const chunk = remaining.slice(idx, idx + 6)
          await Promise.all(chunk.map(preload))
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
        // Fullscreen not supported — toggle CSS fallback
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
    } else if (e.key === "d" || e.key === "D") {
      setShowDebug((d) => !d)
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
      data-testid="vehicle-stage"
    >
      {/* ── Studio environment — canvas-based overlay renderer ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[0] pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* ── Shadow ellipse test anchor (invisible — used by E2E tests) ──
           Width/height must be the full diameter (2×rx, 2×ry), not the radius,
           so that E2E tests derive correct ellipse params from boundingBox. */}
      <div
        data-testid="shadow-ellipse"
        className="absolute pointer-events-none"
        style={{
          left: `${50 - 24.17}%`,
          top: `${SHADOW_CENTER_Y * 100 - 5.93}%`,
          width: "48.34%",
          height: "11.86%",
          borderRadius: "50%",
        }}
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

      {/* Current frame image — absolutely positioned so tires sit precisely on
           the shadow ellipse center. No CSS transforms — pure pixel positioning
           computed by ResizeObserver above. Overflow-hidden on the container
           cleanly clips the roof/bumper overflow without affecting tire placement. */}
      {isReady && images[frame] && (
        <div className="absolute inset-0 z-[2] pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[frame]}
            alt={`${alt} — angle ${frame + 1} of ${totalFrames}`}
            style={carStyle}
            draggable={false}
          />
          {/* ── Wheel anchor markers (invisible — used by E2E tests) ──
               Positions are approximate for a front 3/4 view (frame 0).
               FL/FR at ~88% of car height, RL/RR at ~92%. */}
          <div data-testid="wheel-FL" className="absolute" style={{ left: `${layoutRef.current.imgLeft + layoutRef.current.renderW * 0.20}px`, top: `${layoutRef.current.imgTop + layoutRef.current.renderH * 0.88}px`, width: 2, height: 2 }} />
          <div data-testid="wheel-FR" className="absolute" style={{ left: `${layoutRef.current.imgLeft + layoutRef.current.renderW * 0.80}px`, top: `${layoutRef.current.imgTop + layoutRef.current.renderH * 0.88}px`, width: 2, height: 2 }} />
          <div data-testid="wheel-RL" className="absolute" style={{ left: `${layoutRef.current.imgLeft + layoutRef.current.renderW * 0.30}px`, top: `${layoutRef.current.imgTop + layoutRef.current.renderH * 0.92}px`, width: 2, height: 2 }} />
          <div data-testid="wheel-RR" className="absolute" style={{ left: `${layoutRef.current.imgLeft + layoutRef.current.renderW * 0.70}px`, top: `${layoutRef.current.imgTop + layoutRef.current.renderH * 0.92}px`, width: 2, height: 2 }} />
        </div>
      )}



      {/* Contact shadow is now rendered by the canvas overlay renderer */}

      {/* ── Visual debug overlay (toggle with D key) ── */}
      {isReady && showDebug && (
        <div className="absolute inset-0 z-[5] pointer-events-none">
          {/* Shadow ellipse center (floor plane) — green line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-green-400 border-dashed"
            style={{ top: `${layoutRef.current.floorY}px` }}
          >
            <span className="absolute left-2 -top-5 text-[10px] font-mono text-green-400 bg-black/60 px-1 rounded">
              floor {layoutRef.current.floorY.toFixed(1)}px
            </span>
          </div>
          {/* Tire contact line — red line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-red-400 border-dashed"
            style={{ top: `${layoutRef.current.imgTop + layoutRef.current.tireY}px` }}
          >
            <span className="absolute right-2 -top-5 text-[10px] font-mono text-red-400 bg-black/60 px-1 rounded">
              tire {(layoutRef.current.imgTop + layoutRef.current.tireY).toFixed(1)}px
            </span>
          </div>
          {/* Image bounding box — blue dashed */}
          <div
            className="absolute border-2 border-blue-400 border-dashed"
            style={{
              top: `${layoutRef.current.imgTop}px`,
              left: `${layoutRef.current.imgLeft}px`,
              width: `${layoutRef.current.renderW}px`,
              height: `${layoutRef.current.renderH}px`,
            }}
          >
            <span className="absolute left-1 top-1 text-[10px] font-mono text-blue-400 bg-black/60 px-1 rounded">
              {layoutRef.current.renderW.toFixed(0)}×{layoutRef.current.renderH.toFixed(0)}
            </span>
          </div>
          {/* Error readout */}
          <div className="absolute top-2 left-2 text-[10px] font-mono text-yellow-300 bg-black/70 px-2 py-1 rounded">
            Δ tire→floor: {Math.abs(layoutRef.current.floorY - (layoutRef.current.imgTop + layoutRef.current.tireY)).toFixed(1)}px
          </div>
        </div>
      )}

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
