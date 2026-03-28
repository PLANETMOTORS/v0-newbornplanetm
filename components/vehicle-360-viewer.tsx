"use client"

import { useState, useRef, useCallback, useEffect, useTransition } from "react"
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Vehicle360ViewerProps {
  vehicleId: string
  vehicleName: string
  baseUrl?: string
  frameCount?: number
  className?: string
}

// Generate imgix URL with AVIF optimization
function getOptimizedImageUrl(baseUrl: string, vehicleId: string, frame: number): string {
  // Using imgix auto-format with AVIF preference
  const params = new URLSearchParams({
    auto: "format,compress",
    fm: "avif",
    q: "80",
    w: "1200",
    fit: "crop",
  })
  return `${baseUrl}/vehicles/${vehicleId}/spin/${frame.toString().padStart(3, "0")}.jpg?${params}`
}

export function Vehicle360Viewer({
  vehicleId,
  vehicleName,
  baseUrl = "https://images.planetmotors.com",
  frameCount = 36,
  className,
}: Vehicle360ViewerProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadedFrames, setLoadedFrames] = useState<Set<number>>(new Set())
  const [isPending, startTransition] = useTransition()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const lastXRef = useRef(0)
  const animationRef = useRef<number | null>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Preload images for smooth interaction
  useEffect(() => {
    const preloadImages = async () => {
      const imagesToPreload = Array.from({ length: frameCount }, (_, i) => i)
      
      for (const frame of imagesToPreload) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = getOptimizedImageUrl(baseUrl, vehicleId, frame)
        img.onload = () => {
          setLoadedFrames(prev => new Set([...prev, frame]))
        }
      }
    }
    
    preloadImages()
  }, [vehicleId, baseUrl, frameCount])

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        startTransition(() => {
          setCurrentFrame(prev => (prev + 1) % frameCount)
        })
      }, 80)
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, frameCount])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setIsPlaying(false)
    lastXRef.current = e.clientX
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - lastXRef.current
    const sensitivity = 5

    if (Math.abs(deltaX) > sensitivity) {
      const direction = deltaX > 0 ? 1 : -1
      startTransition(() => {
        setCurrentFrame(prev => (prev + direction + frameCount) % frameCount)
      })
      lastXRef.current = e.clientX
    }
  }, [isDragging, frameCount])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    setIsPlaying(false)
    lastXRef.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()

    const deltaX = e.touches[0].clientX - lastXRef.current
    const sensitivity = 5

    if (Math.abs(deltaX) > sensitivity) {
      const direction = deltaX > 0 ? 1 : -1
      startTransition(() => {
        setCurrentFrame(prev => (prev + direction + frameCount) % frameCount)
      })
      lastXRef.current = e.touches[0].clientX
    }
  }, [isDragging, frameCount])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 1))

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const loadProgress = Math.round((loadedFrames.size / frameCount) * 100)

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-card rounded-lg overflow-hidden select-none",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
    >
      {/* Loading indicator */}
      {loadProgress < 100 && (
        <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-muted-foreground">
          Loading: {loadProgress}%
        </div>
      )}

      {/* Main viewer area */}
      <div
        className={cn(
          "relative aspect-[16/10] cursor-grab overflow-hidden",
          isDragging && "cursor-grabbing"
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
          className="absolute inset-0 flex items-center justify-center transition-transform duration-100"
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={getOptimizedImageUrl(baseUrl, vehicleId, currentFrame)}
            alt={`${vehicleName} - View ${currentFrame + 1} of ${frameCount}`}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        </div>

        {/* Drag hint overlay */}
        {!isDragging && !isPlaying && loadProgress === 100 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-foreground/70 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
              <RotateCw className="w-4 h-4" />
              Drag to rotate
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
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Frame indicator */}
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-muted-foreground">
        {currentFrame + 1} / {frameCount}
      </div>
    </div>
  )
}
