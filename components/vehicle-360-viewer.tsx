"use client"

import { useRef, useEffect, useState } from "react"
import { use360Spin } from "@/hooks/use-360-spin"
import { imgix } from "@/lib/imgix"
import { Play, Pause, Maximize2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Vehicle360ViewerProps {
  stockNumber: string
  totalFrames?: number
  className?: string
}

export function Vehicle360Viewer({ 
  stockNumber, 
  totalFrames = 72,
  className = ""
}: Vehicle360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isActivated, setIsActivated] = useState(false)

  const { currentFrame, isPlaying, toggle, handlers } = use360Spin({ 
    totalFrames,
    sensitivity: 5,
    autoPlaySpeed: 50
  })

  // Lazy load with IntersectionObserver (200px rootMargin)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "200px" }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // AVIF-first frame URL via imgix + CloudFront
  const frameUrl = imgix(`vehicles/${stockNumber}/360/frame-${String(currentFrame).padStart(3, '0')}.jpg`, {
    w: 1920, h: 1080, q: 85
  })

  const previewUrl = imgix(`vehicles/${stockNumber}/360/frame-000.jpg`, {
    w: 800, h: 600, q: 75
  })

  // Not visible - placeholder
  if (!isVisible) {
    return <div ref={containerRef} className={`aspect-video bg-muted rounded-lg ${className}`} />
  }

  // Click-to-activate preview
  if (!isActivated) {
    return (
      <div 
        ref={containerRef}
        className={`relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group ${className}`}
        onClick={() => setIsActivated(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt={`${stockNumber} 360 preview`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
          <div className="text-center text-white">
            <RotateCcw className="w-12 h-12 mx-auto mb-2 animate-spin" style={{ animationDuration: "3s" }} />
            <p className="font-semibold">View 360 Spin</p>
          </div>
        </div>
        <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">360</div>
      </div>
    )
  }

  // Active viewer
  return (
    <div 
      ref={containerRef}
      className={`relative aspect-video bg-black rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none ${className}`}
      {...handlers}
      onPointerLeave={handlers.onPointerUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frameUrl} alt={`${stockNumber} 360 frame ${currentFrame + 1}`} className="w-full h-full object-cover" draggable={false} />
      
      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggle} className="text-white hover:bg-white/20 h-8 w-8">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <span className="text-white text-sm">{currentFrame + 1} / {totalFrames}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20 h-8 w-8">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">360</div>
      {!isPlaying && <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">Drag to rotate</div>}
    </div>
  )
}
