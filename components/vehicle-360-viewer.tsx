"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { use360Spin } from "@/hooks/use-360-spin"
import { imgix } from "@/lib/imgix"
import { Play, Pause, Maximize2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Spin-optimised frame config: motion hides compression artefacts at these lower settings,
// yielding ~4× smaller files vs 1280×720 q72 (AVIF auto-format via imgix default).
const FRAME_W = 960
const FRAME_H = 540
const FRAME_Q = 65
// How many frames ahead to prime in the browser image cache before the user reaches them.
const PRELOAD_AHEAD = 5

interface Vehicle360ViewerProps {
  stockNumber: string
  /** Default 36 frames halves bandwidth vs 72 with no perceptible quality loss at spin speed. */
  totalFrames?: number
  className?: string
}

export function Vehicle360Viewer({ 
  stockNumber, 
  totalFrames = 36,
  className = ""
}: Vehicle360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isActivated, setIsActivated] = useState(false)
  const hasAutoPlayed = useRef(false)

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

  // Auto-play on first activation
  useEffect(() => {
    if (isActivated && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true
      toggle()
    }
  }, [isActivated, toggle])

  // Prime browser cache for upcoming frames while user is watching
  useEffect(() => {
    if (!isActivated) return
    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const frame = (currentFrame + i) % totalFrames
      const img = new window.Image()
      img.src = imgix(
        `vehicles/${stockNumber}/360/frame-${String(frame).padStart(3, "0")}.jpg`,
        { w: FRAME_W, h: FRAME_H, q: FRAME_Q, chromasub: "420" }
      )
    }
  }, [isActivated, currentFrame, totalFrames, stockNumber])

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
  // chromasub 4:2:0 is imperceptible at spin speed and cuts chroma data in half.
  const frameUrl = imgix(`vehicles/${stockNumber}/360/frame-${String(currentFrame).padStart(3, '0')}.jpg`, {
    w: FRAME_W, h: FRAME_H, q: FRAME_Q, chromasub: "420"
  })

  const previewUrl = imgix(`vehicles/${stockNumber}/360/frame-000.jpg`, {
    w: 640, h: 360, q: 60
  })

  // Not visible - placeholder
  if (!isVisible) {
    return <div ref={containerRef} className={`aspect-[4/3] rounded-lg ${className}`} style={{ backgroundColor: "#e8e8e8" }} />
  }

  // Click-to-activate preview
  if (!isActivated) {
    return (
      <div
        ref={containerRef}
        className={`relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group ${className}`}
        style={{ backgroundColor: "#e8e8e8" }}
        onClick={() => setIsActivated(true)}
      >
        <Image src={previewUrl} alt={`${stockNumber} 360 preview`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" unoptimized />
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
      className={`relative aspect-[4/3] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none ${className}`}
      style={{ backgroundColor: "#e8e8e8" }}
      {...handlers}
      onPointerLeave={handlers.onPointerUp}
    >
      <Image src={frameUrl} alt={`${stockNumber} 360 frame ${currentFrame + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" draggable={false} unoptimized />
      
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
