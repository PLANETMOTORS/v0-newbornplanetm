"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Demo vehicle images (simulating 360 frames using different car angles)
const demoFrames = [
  "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&auto=format&fit=crop&q=80",
]

export function Vehicle360ViewerDemo() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadedFrames, setLoadedFrames] = useState<Set<number>>(new Set())
  
  const containerRef = useRef<HTMLDivElement>(null)
  const lastXRef = useRef(0)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const frameCount = demoFrames.length

  // Preload images
  useEffect(() => {
    demoFrames.forEach((src, index) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = src
      img.onload = () => {
        setLoadedFrames(prev => new Set([...prev, index]))
      }
    })
  }, [])

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % frameCount)
      }, 400)
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
    const sensitivity = 30

    if (Math.abs(deltaX) > sensitivity) {
      const direction = deltaX > 0 ? 1 : -1
      setCurrentFrame(prev => (prev + direction + frameCount) % frameCount)
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
    const sensitivity = 30

    if (Math.abs(deltaX) > sensitivity) {
      const direction = deltaX > 0 ? 1 : -1
      setCurrentFrame(prev => (prev + direction + frameCount) % frameCount)
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

  const goToPrevious = () => {
    setCurrentFrame(prev => (prev - 1 + frameCount) % frameCount)
    setIsPlaying(false)
  }

  const goToNext = () => {
    setCurrentFrame(prev => (prev + 1) % frameCount)
    setIsPlaying(false)
  }

  const loadProgress = Math.round((loadedFrames.size / frameCount) * 100)

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-card rounded-xl overflow-hidden select-none border border-border",
        isFullscreen && "fixed inset-0 z-50 rounded-none"
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
          "relative aspect-[16/10] cursor-grab overflow-hidden bg-muted",
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={demoFrames[currentFrame]}
            alt={`Vehicle view ${currentFrame + 1} of ${frameCount}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Arrow navigation */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="ml-4 bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full"
            onClick={goToPrevious}
            aria-label="Previous frame"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full"
            onClick={goToNext}
            aria-label="Next frame"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Drag hint overlay */}
        {!isDragging && !isPlaying && loadProgress === 100 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-foreground/70 flex items-center gap-2">
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

      {/* Vehicle info */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">2024 BMW M4 Competition</h2>
            <p className="text-muted-foreground text-sm">Demo vehicle with interactive 360° view</p>
          </div>
          <div className="text-right">
            <div className="font-serif text-2xl font-semibold text-primary">$84,900</div>
            <p className="text-muted-foreground text-sm">Starting MSRP</p>
          </div>
        </div>
      </div>
    </div>
  )
}
