"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, RotateCw, Hand, Maximize2, Minimize2, Loader2 } from "lucide-react"
import { useOverlayRenderer } from "@/hooks/use-overlay-renderer"
import { overlayConfig } from "@/config/overlay/loader/loadOverlayConfig"

// ── Tire-floor alignment constants (used by the dynamic transform calc) ──
const SHADOW_CENTER_Y = 0.7556   // from overlay config (cy of shadow ellipse)
const TIRE_CONTACT_Y  = 0.823    // tire contact at 82.3 % from top of image
const TIRE_SCALE      = 1.25     // enlargement factor
const INNER_W_RATIO   = 0.90     // inner positioning div width ratio
const INNER_H_RATIO   = 0.85     // inner positioning div height ratio
const IMG_ASPECT      = 4 / 3    // 1200 × 900 source frames

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

  // ── Dynamic tire-floor alignment ──
  // The car frames have transparent padding below the tires (tire contact at
  // ~82.3 % of image height).  A fixed CSS translateY doesn't work across
  // viewports because object-contain renders the image at different sizes
  // depending on container aspect ratio.  We compute the exact translateY at
  // runtime so the tire line always lands on the shadow-ellipse centre.
  const [tireTransform, setTireTransform] = useState(`scale(${TIRE_SCALE})`)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const recalc = () => {
      const { width: cw, height: ch } = el.getBoundingClientRect()
      if (cw === 0 || ch === 0) return

      const iw = cw * INNER_W_RATIO          // inner div width
      const ih = ch * INNER_H_RATIO          // inner div height

      // Rendered image height inside the object-contain element
      const renderH = (iw / ih > IMG_ASPECT) ? ih : iw / IMG_ASPECT

      // Tire Y position inside the element (image centred vertically)
      const tireInElem = (ih - renderH) / 2 + TIRE_CONTACT_Y * renderH

      // Element is centred in the container
      const elemCenter = ch / 2
      const targetY    = ch * SHADOW_CENTER_Y

      // Solve: targetY = elemCenter + S*(tireInElem - ih/2) + S*T  →  T = …
      const T    = (targetY - elemCenter - TIRE_SCALE * (tireInElem - ih / 2)) / TIRE_SCALE
      const tPct = (T / ih) * 100

      setTireTransform(`scale(${TIRE_SCALE}) translateY(${tPct.toFixed(2)}%)`)
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(el)
    return () => ro.disconnect()
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

      {/* Current frame image — dynamically positioned so tires sit on the shadow
           ellipse at any viewport size.  See the tireTransform calculation above. */}
      {isReady && images[frame] && (
        <div className="absolute inset-0 flex items-center justify-center z-[2]">
          <div className="relative" style={{ width: "90%", height: "85%" }}>
            <Image
              src={images[frame]}
              alt={`${alt} — angle ${frame + 1} of ${totalFrames}`}
              fill
              className="object-contain pointer-events-none"
              style={{ transform: tireTransform }}
              priority={frame === 0}
              sizes={isFullscreen ? "100vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"}
              draggable={false}
              unoptimized
            />
          </div>
        </div>
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
