"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Minimize2, Play, Pause, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QualityPreset = "preview" | "standard" | "4k"

interface Vehicle360ViewerProps {
  stockNumber: string
  totalFrames?: number
  quality?: QualityPreset
  className?: string
}

// Quality presets for imgix
const QUALITY_PRESETS: Record<QualityPreset, { width: number; quality: number }> = {
  preview: { width: 400, quality: 60 },
  standard: { width: 1200, quality: 80 },
  "4k": { width: 3840, quality: 85 },
}

// CDN base URL - uses CloudFront with imgix origin for AVIF auto-format
const CDN_BASE_URL = "https://cdn.planetmotors.ca"

// Generate imgix URL with AVIF-first optimization
function getFrameUrl(stockNumber: string, frame: number, quality: QualityPreset): string {
  const preset = QUALITY_PRESETS[quality]
  const params = new URLSearchParams({
    auto: "format,compress", // CloudFront + imgix handles AVIF/WebP/JPEG based on Accept header
    w: preset.width.toString(),
    q: preset.quality.toString(),
    fit: "crop",
  })
  return `${CDN_BASE_URL}/vehicles/${stockNumber}/360/${frame.toString().padStart(3, "0")}.jpg?${params}`
}

export function Vehicle360Viewer({
  stockNumber,
  totalFrames = 72,
  quality = "standard",
  className,
}: Vehicle360ViewerProps) {
  // State
  const [isActivated, setIsActivated] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadedFrames, setLoadedFrames] = useState<Set<number>>(new Set())
  const [isPreloading, setIsPreloading] = useState(false)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const lastXRef = useRef(0)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { rootMargin: "200px" } // Start loading when 200px from viewport
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Preload all frames when activated
  useEffect(() => {
    if (!isActivated || !isInView) return

    setIsPreloading(true)
    const preloadedSet = new Set<number>()

    const preloadFrame = (frame: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          preloadedSet.add(frame)
          setLoadedFrames(new Set(preloadedSet))
          resolve()
        }
        img.onerror = () => resolve() // Continue even if one fails
        img.src = getFrameUrl(stockNumber, frame, quality)
      })
    }

    // Preload frames with concurrency limit
    const preloadAllFrames = async () => {
      const concurrency = 6
      for (let i = 0; i < totalFrames; i += concurrency) {
        const batch = Array.from(
          { length: Math.min(concurrency, totalFrames - i) },
          (_, j) => preloadFrame(i + j)
        )
        await Promise.all(batch)
      }
      setIsPreloading(false)
    }

    preloadAllFrames()
  }, [isActivated, isInView, stockNumber, totalFrames, quality])

  // Auto-play at 20fps (50ms interval)
  useEffect(() => {
    if (isPlaying && !isPreloading) {
      playIntervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % totalFrames)
      }, 50)
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, isPreloading, totalFrames])

  // Keyboard navigation
  useEffect(() => {
    if (!isActivated) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          setCurrentFrame((prev) => (prev - 1 + totalFrames) % totalFrames)
          break
        case "ArrowRight":
          e.preventDefault()
          setCurrentFrame((prev) => (prev + 1) % totalFrames)
          break
        case " ":
          e.preventDefault()
          setIsPlaying((prev) => !prev)
          break
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActivated, isFullscreen, totalFrames])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setIsPlaying(false)
    lastXRef.current = e.clientX
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - lastXRef.current
      const sensitivity = 5

      if (Math.abs(deltaX) > sensitivity) {
        const direction = deltaX > 0 ? 1 : -1
        setCurrentFrame((prev) => (prev + direction + totalFrames) % totalFrames)
        lastXRef.current = e.clientX
      }
    },
    [isDragging, totalFrames]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    setIsPlaying(false)
    lastXRef.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const deltaX = e.touches[0].clientX - lastXRef.current
      const sensitivity = 5

      if (Math.abs(deltaX) > sensitivity) {
        const direction = deltaX > 0 ? 1 : -1
        setCurrentFrame((prev) => (prev + direction + totalFrames) % totalFrames)
        lastXRef.current = e.touches[0].clientX
      }
    },
    [isDragging, totalFrames]
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 1))

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  // Load progress
  const loadProgress = Math.round((loadedFrames.size / totalFrames) * 100)

  // Preview image URL (frame 0 in preview quality)
  const previewUrl = getFrameUrl(stockNumber, 0, "preview")

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-card rounded-lg overflow-hidden select-none",
        isFullscreen && "fixed inset-0 z-50 rounded-none bg-black",
        className
      )}
      tabIndex={isActivated ? 0 : -1}
    >
      {/* Click-to-activate preview */}
      {!isActivated && (
        <div className="relative aspect-[16/10]">
          {isInView && (
            <img
              src={previewUrl}
              alt="360 vehicle preview"
              className="w-full h-full object-contain"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Button
              size="lg"
              onClick={() => setIsActivated(true)}
              className="gap-2"
            >
              <RotateCw className="w-5 h-5" />
              View 360 Spin
            </Button>
          </div>
        </div>
      )}

      {/* Active 360 viewer */}
      {isActivated && (
        <>
          {/* Loading progress */}
          {isPreloading && (
            <div className="absolute top-4 left-4 z-20 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading: {loadProgress}%
            </div>
          )}

          {/* Main viewer area */}
          <div
            className={cn(
              "relative aspect-[16/10] cursor-grab overflow-hidden",
              isDragging && "cursor-grabbing",
              isFullscreen && "aspect-auto h-full"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Vehicle image */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                src={getFrameUrl(stockNumber, currentFrame, quality)}
                alt={`360 view - frame ${currentFrame + 1} of ${totalFrames}`}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </div>

            {/* Drag hint */}
            {!isDragging && !isPlaying && loadProgress === 100 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-foreground/70 flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  Drag to rotate • Arrow keys • Space to play
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isPreloading}
              aria-label={isPlaying ? "Pause rotation" : "Play rotation"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <div className="w-px h-6 bg-border" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <span className="text-xs text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Frame indicator */}
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-muted-foreground">
            {currentFrame + 1} / {totalFrames}
          </div>
        </>
      )}
    </div>
  )
}
