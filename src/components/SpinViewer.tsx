"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Play, Pause, RotateCw, Hand, Maximize2, Minimize2, Loader2 } from "lucide-react"
import {
  resolveSceneConstants,
  listProfiles,
  type SceneConstants,
} from "@/config/overlay/load-overlay"

/* ═══════════════════════════════════════════════════════════════════════════════
 * SINGLE-CANVAS 360° VEHICLE SPIN VIEWER
 *
 * Everything (background, shadow, car image) drawn on ONE canvas.
 * No separate HTML layers, no z-index conflicts, no alignment issues.
 *
 * Scene constants (floor colors, shadow opacity, reflection, horizon line)
 * are resolved from the overlay config system (src/config/overlay/overlay.json)
 * rather than hardcoded. Profile can be switched at runtime.
 *
 * Architecture:
 *   1. Canvas fills the container (4:3 aspect)
 *   2. Each frame: clear → draw background → draw shadow → draw car image
 *   3. Car image sized to fill ~90% of canvas width
 *   4. Tire bottom aligned to horizon line from overlay config
 *   5. Shadow drawn as soft radial gradient at tire contact
 *   6. Floor reflection with configurable opacity and fade
 * ═══════════════════════════════════════════════════════════════════════════ */

// Profiles available at runtime
const AVAILABLE_PROFILES = listProfiles()

interface SpinViewerProps {
  images: string[]
  alt: string
  embed?: boolean
  /** Override the default overlay profile */
  profileId?: string
  /** Show profile picker UI */
  showProfilePicker?: boolean
}

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

    // Alpha > 240 to detect solid tire rubber only (ignores semi-transparent
    // halo from background removal). Require 50 opaque pixels per row to avoid
    // compression artifacts. Skip bottom 2% to ignore turntable/platform noise.
    const stopRow = Math.floor(h * 0.98)
    for (let y = stopRow; y >= Math.floor(h * 0.5); y--) {
      let count = 0
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 240) {
          count++
          if (count >= 50) return y / h
        }
      }
    }
  } catch {
    // CORS or canvas tainted
  }
  return null
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  carImg: HTMLImageElement | null,
  tireY: number,
  sc: SceneConstants,
) {
  const tireLineY = sc.horizonY * height

  // Background: studio floor gradient from overlay profile colors
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
  bgGrad.addColorStop(0.00, sc.wallTop)
  bgGrad.addColorStop(0.30, sc.wallMid)
  bgGrad.addColorStop(0.55, sc.floorNear)
  bgGrad.addColorStop(1.00, sc.floorFar)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  if (!carImg || carImg.naturalWidth === 0) return

  const imgW = carImg.naturalWidth
  const imgH = carImg.naturalHeight
  const aspect = imgW / imgH
  let carW = width * sc.carFill
  let carH = carW / aspect
  if (carH > height * 0.92) {
    carH = height * 0.92
    carW = carH * aspect
  }
  const tireBottomInCar = tireY * carH
  const carTop = tireLineY - tireBottomInCar + sc.groundPush * carH
  const carLeft = (width - carW) / 2
  const shadowCenterX = width / 2
  const tireBottomY = carTop + tireY * carH

  // Shadow Layer A: large soft ambient pool (opacity from profile)
  const maxO = sc.shadowMaxOpacity
  ctx.save()
  const shadowRx = width * sc.shadowEllipseRx * 2
  const shadowRy = height * sc.shadowEllipseRy * 2
  ctx.translate(shadowCenterX, tireBottomY)
  ctx.scale(1, shadowRy / shadowRx)
  const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowRx)
  shadowGrad.addColorStop(0, `rgba(0,0,0,${maxO})`)
  shadowGrad.addColorStop(0.25, `rgba(0,0,0,${maxO * 0.71})`)
  shadowGrad.addColorStop(0.50, `rgba(0,0,0,${maxO * 0.43})`)
  shadowGrad.addColorStop(0.75, `rgba(0,0,0,${maxO * 0.17})`)
  shadowGrad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.arc(0, 0, shadowRx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Shadow Layer B: tight contact shadow at tire bottom
  const contactH = carH * 0.015
  const contactW = carW * 0.80
  const contactLeft = (width - contactW) / 2
  const contactGrad = ctx.createLinearGradient(contactLeft, 0, contactLeft + contactW, 0)
  contactGrad.addColorStop(0, "rgba(0,0,0,0)")
  contactGrad.addColorStop(0.08, `rgba(0,0,0,${maxO * 0.86})`)
  contactGrad.addColorStop(0.5, `rgba(0,0,0,${maxO})`)
  contactGrad.addColorStop(0.92, `rgba(0,0,0,${maxO * 0.86})`)
  contactGrad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = contactGrad
  ctx.fillRect(contactLeft, tireBottomY - contactH * 0.3, contactW, contactH)

  // Car image
  ctx.drawImage(carImg, carLeft, carTop, carW, carH)

  // Floor reflection (opacity from profile)
  ctx.save()
  ctx.globalAlpha = sc.reflectionMaxOpacity
  ctx.beginPath()
  ctx.rect(0, tireBottomY, width, height - tireBottomY)
  ctx.clip()
  ctx.translate(0, tireBottomY * 2)
  ctx.scale(1, -1)
  ctx.drawImage(carImg, carLeft, carTop, carW, carH)
  ctx.restore()

  // Fade reflection into floor (use floorNear for seamless blend)
  const fadeH = carH * sc.reflectionFadeDistance
  const reflFadeGrad = ctx.createLinearGradient(0, tireBottomY, 0, tireBottomY + fadeH)
  reflFadeGrad.addColorStop(0, hexToRgba(sc.floorNear, 0))
  reflFadeGrad.addColorStop(1, hexToRgba(sc.floorNear, 1))
  ctx.fillStyle = reflFadeGrad
  ctx.fillRect(carLeft, tireBottomY, carW, fadeH)
}

/** Convert #RRGGBB to rgba(r,g,b,a) */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function SpinViewer({
  images,
  alt,
  embed = false,
  profileId,
  showProfilePicker = false,
}: SpinViewerProps) {
  const [frame, setFrame] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)
  const [activeProfile, setActiveProfile] = useState(profileId)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragStartX = useRef(0)
  const dragStartFrame = useRef(0)
  const lastX = useRef(0)
  const velocity = useRef(0)
  const momentumRef = useRef<number | null>(null)
  const drawFrameRef = useRef<() => void>(() => {})

  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map())
  const perFrameTireY = useRef<(number | null)[]>([])

  // Resolve scene constants from the active overlay profile
  const sc = useMemo(() => resolveSceneConstants(activeProfile), [activeProfile])
  const medianTireY = useRef<number>(sc.tireContactY)

  const totalFrames = images.length
  const sensitivity = totalFrames > 0 ? Math.max(3, Math.round(800 / totalFrames)) : 3
  const loadProgress = totalFrames > 0 ? Math.round((loadedCount / totalFrames) * 100) : 0
  const isReady = loadedCount >= 1

  const imagesKey = useMemo(() => images.join("\n"), [images])

  // Draw current frame on canvas
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const carImg = imageCache.current.get(frame) ?? null
    // Use median tire Y across all frames to prevent per-frame bouncing
    const tireY = medianTireY.current

    drawScene(ctx, w, h, carImg, tireY, sc)
  }, [frame, sc])

  useEffect(() => {
    drawFrameRef.current = drawFrame
  })

  useEffect(() => {
    drawFrame()
  }, [drawFrame, isFullscreen, loadedCount])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => drawFrameRef.current())
    ro.observe(el)
    return () => ro.disconnect()
  }, [isFullscreen])

  // Progressive preloading
  const loadGenRef = useRef(0)

  useEffect(() => {
    if (images.length === 0) return
    const gen = ++loadGenRef.current
    imageCache.current.clear()
    perFrameTireY.current = new Array(images.length).fill(null)
    let count = 0

    const preload = (src: string, idx: number) =>
      new Promise<void>((resolve) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          if (loadGenRef.current === gen) {
            imageCache.current.set(idx, img)
            const tireYDetected = detectTireBottom(img)
            if (tireYDetected !== null) {
              perFrameTireY.current[idx] = tireYDetected
              const detected = perFrameTireY.current.filter((v): v is number => v !== null)
              if (detected.length > 0) {
                detected.sort((a, b) => a - b)
                medianTireY.current = detected[Math.floor(detected.length / 2)]
              }
            }
            count++
            setLoadedCount(count)
          }
          resolve()
        }
        img.onerror = () => {
          if (loadGenRef.current === gen) {
            count++
            setLoadedCount(count)
          }
          resolve()
        }
        img.src = src
      })

    preload(images[0], 0).then(() => {
      if (loadGenRef.current !== gen) return
      const remaining = images.slice(1)
      let idx = 0
      const batch = async () => {
        while (idx < remaining.length && loadGenRef.current === gen) {
          const chunk = remaining.slice(idx, idx + 6)
          await Promise.all(chunk.map((src, i) => preload(src, idx + i + 1)))
          idx += 6
        }
      }
      batch()
    })

    return () => {
      const nextGen = loadGenRef.current + 1
      loadGenRef.current = nextGen
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesKey])

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || !isReady || totalFrames === 0) return
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % totalFrames)
    }, 120)
    return () => clearInterval(interval)
  }, [isAutoPlaying, totalFrames, isReady])

  // Fullscreen
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

  const dismissHint = useCallback(() => {
    if (showHint) setShowHint(false)
  }, [showHint])

  // Pointer handlers with momentum
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

  // Keyboard navigation
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
          : embed
            ? "relative h-full"
            : "relative aspect-[4/3] rounded-xl"
      }`}
      style={{
        cursor: !isReady ? "default" : isDragging ? "grabbing" : "grab",
        background: "#DCDCDC",
      }}
      role="region"
      aria-label={`360° Interactive View — ${alt}`}
      aria-roledescription="360° image spinner"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {totalFrames === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <RotateCw className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground font-medium">360° view not available</p>
        </div>
      )}

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

      {isReady && loadProgress < 100 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted/50 z-10">
          <div
            className="h-full bg-primary/60 transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      )}

      {isReady && !isDragging && !isAutoPlaying && (
        <div className="absolute left-4 z-10 pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)" }}>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200">
            <span className="text-xs font-bold text-gray-700">360°</span>
          </div>
        </div>
      )}

      {isReady && showHint && !isAutoPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity z-10">
          <div className="flex flex-col items-center gap-2 text-white animate-pulse">
            <Hand className="h-10 w-10" />
            <span className="text-sm font-medium">Drag to explore</span>
          </div>
        </div>
      )}

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
            {showProfilePicker && (
              <select
                value={activeProfile ?? ""}
                onChange={(e) => { e.stopPropagation(); setActiveProfile(e.target.value || undefined) }}
                className="px-2 py-1 bg-background/80 backdrop-blur rounded-lg text-xs font-medium shadow-sm border-0 outline-none cursor-pointer"
                aria-label="Select studio profile"
              >
                {AVAILABLE_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            )}

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
