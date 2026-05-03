"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { RotateCw, Loader2, Maximize2, Pause, Play } from "lucide-react"
import { FRAME_MANIFEST, frameUrl } from "@/lib/drivee-frames"

interface SpinViewerProps {
  /** Drivee media ID — used to resolve Supabase Storage frame URLs */
  mid: string
  /** Vehicle name for accessibility */
  vehicleName: string
  /** Optional CSS class */
  className?: string
}

/**
 * Carvana-style studio backdrop — warm gray cyc wall fading to darker floor.
 * Sampled from Carvana.com 360° viewer (2026-05-03).
 */
const SPIN_BG = "#dcdcdc"
const SPIN_BG_TOP = "#e6e6e6"    // warm light gray (studio cyc wall)
const SPIN_BG_BOTTOM = "#c2c2c2" // darker gray (studio floor)

/**
 * Native 360° Spin Viewer — loads WebP frames directly from Supabase Storage.
 *
 * Replaces the legacy Drivee iframe — used for all vehicles with Supabase frames.
 * Performance: first paint < 1 s, full interactive < 5 s (vs 40-50 s iframe).
 *
 * Features:
 *  - Progressive loading: shows frame 1 instantly, preloads rest in background
 *  - Drag / swipe to rotate (pointer events)
 *  - Optional auto-spin with play/pause
 *  - Fullscreen via native Fullscreen API
 *  - Frame counter overlay
 */
export function SpinViewer({ mid, vehicleName, className = "" }: Readonly<SpinViewerProps>) {
  const frameCount = FRAME_MANIFEST[mid] ?? 0
  const [currentFrame, setCurrentFrame] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [isAutoSpin, setIsAutoSpin] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const containerRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<(HTMLImageElement | null)[]>([])
  const dragStartX = useRef(0)
  const dragStartFrame = useRef(0)
  const autoSpinTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Preload all frames ──
  useEffect(() => {
    if (frameCount === 0) { setHasError(true); return }

    const images: (HTMLImageElement | null)[] = new Array(frameCount).fill(null)
    let loaded = 0

    // Load frame 1 first (hero), then the rest
    const loadOrder = [0, ...Array.from({ length: frameCount - 1 }, (_, i) => i + 1)]

    for (const idx of loadOrder) {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.src = frameUrl(mid, idx + 1) // frameUrl is 1-indexed
      img.onload = () => {
        images[idx] = img
        loaded++
        framesRef.current = images
        setLoadedCount(loaded)
        // Draw first frame immediately
        if (idx === 0) drawFrame(img)
      }
      img.onerror = () => { loaded++; setLoadedCount(loaded) }
    }

    return () => { images.forEach(img => { if (img) img.src = "" }) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mid, frameCount])

  // ── Draw a frame on canvas ──
  const drawFrame = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Match canvas size to container
    const rect = canvas.parentElement?.getBoundingClientRect()
    if (rect) {
      canvas.width = rect.width * (window.devicePixelRatio || 1)
      canvas.height = rect.height * (window.devicePixelRatio || 1)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    // Paint a subtle gradient background (hides nobg transparency artifacts)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, SPIN_BG_TOP)
    grad.addColorStop(0.55, SPIN_BG)
    grad.addColorStop(1, SPIN_BG_BOTTOM)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Fit image centered (contain)
    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    const x = (canvas.width - w) / 2
    const y = (canvas.height - h) / 2
    ctx.drawImage(img, x, y, w, h)
  }, [])

  // ── Redraw when frame changes ──
  useEffect(() => {
    const img = framesRef.current[currentFrame]
    if (img) drawFrame(img)
  }, [currentFrame, drawFrame])

  // ── Auto-spin ──
  useEffect(() => {
    if (isAutoSpin && loadedCount >= frameCount && frameCount > 0) {
      autoSpinTimer.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % frameCount)
      }, 80) // ~12.5 fps for smooth rotation
    }
    return () => { if (autoSpinTimer.current) clearInterval(autoSpinTimer.current) }
  }, [isAutoSpin, loadedCount, frameCount])

  // ── Pointer drag to rotate ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true)
    setIsAutoSpin(false)
    dragStartX.current = e.clientX
    dragStartFrame.current = currentFrame
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [currentFrame])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || frameCount === 0) return
    const dx = e.clientX - dragStartX.current
    const sensitivity = 5 // pixels per frame
    const frameDelta = Math.round(dx / sensitivity)
    const newFrame = ((dragStartFrame.current + frameDelta) % frameCount + frameCount) % frameCount
    setCurrentFrame(newFrame)
  }, [isDragging, frameCount])

  const onPointerUp = useCallback(() => { setIsDragging(false) }, [])

  // ── Fullscreen ──
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) { document.exitFullscreen() }
    else { containerRef.current.requestFullscreen() }
  }, [])

  const isFullyLoaded = loadedCount >= frameCount && frameCount > 0
  const loadPct = frameCount > 0 ? Math.round((loadedCount / frameCount) * 100) : 0
  const firstFrameReady = framesRef.current[0] != null

  if (hasError) {
    return (
      <section
        className={`relative h-[500px] md:h-[600px] rounded-xl overflow-hidden flex items-center justify-center ${className}`}
        style={{ backgroundColor: SPIN_BG }}
        aria-label={`360° view unavailable for ${vehicleName}`}
      >
        <div className="text-center p-6">
          <RotateCw className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">360° view unavailable</p>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={containerRef}
      className={`relative h-[500px] md:h-[600px] rounded-xl overflow-hidden select-none ${className}`}
      style={{ backgroundColor: SPIN_BG, cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
      aria-label={`360° Interactive View — ${vehicleName}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Canvas where frames are drawn */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Loading overlay — visible until first frame paints */}
      {!firstFrameReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ backgroundColor: SPIN_BG }}>
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Loading 360° experience…</p>
          </div>
        </div>
      )}

      {/* Progress bar — shows while remaining frames load */}
      {firstFrameReady && !isFullyLoaded && (
        <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-black/20">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${loadPct}%` }}
          />
        </div>
      )}

      {/* Controls overlay */}
      {firstFrameReady && (
        <>
          {/* 360° badge + drag hint */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 pointer-events-none">
            <RotateCw className="h-3 w-3" aria-hidden="true" />
            {isAutoSpin ? "Auto-Spin 360°" : "Drag to Rotate 360°"}
          </div>

          {/* Frame counter */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white px-2 py-1 rounded text-xs pointer-events-none">
            {currentFrame + 1} / {frameCount}
          </div>

          {/* Auto-spin toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsAutoSpin(prev => !prev) }}
            disabled={!isFullyLoaded}
            className="absolute bottom-4 right-16 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition shadow-lg disabled:opacity-40"
            aria-label={isAutoSpin ? "Pause auto-spin" : "Start auto-spin"}
            type="button"
          >
            {isAutoSpin
              ? <Pause className="h-4 w-4 text-black" />
              : <Play className="h-4 w-4 text-black ml-0.5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
            className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition shadow-lg"
            aria-label="Toggle fullscreen"
            type="button"
          >
            <Maximize2 className="h-4 w-4 text-black" />
          </button>
        </>
      )}
    </section>
  )
}
