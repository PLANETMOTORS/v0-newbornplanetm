"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, RotateCw, Hand } from "lucide-react"

interface SpinViewerProps {
  images: string[]
  alt: string
}

export function VehicleSpinViewer({ images, alt }: SpinViewerProps) {
  const [frame, setFrame] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragStartFrame = useRef(0)
  const lastX = useRef(0)
  const velocity = useRef(0)
  const momentumRef = useRef<number | null>(null)

  const totalFrames = images.length
  // Sensitivity: pixels per frame change
  const sensitivity = Math.max(3, Math.round(800 / totalFrames))

  // Auto-play at a comfortable speed
  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % totalFrames)
    }, 120)
    return () => clearInterval(interval)
  }, [isAutoPlaying, totalFrames])

  // Hide hint after first interaction
  const dismissHint = useCallback(() => {
    if (showHint) setShowHint(false)
  }, [showHint])

  // --- Mouse drag handlers ---
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
    // Momentum: continue spinning based on last velocity
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

  // Keyboard support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      setFrame((prev) => (prev + 1) % totalFrames)
      e.preventDefault()
    } else if (e.key === "ArrowLeft") {
      setFrame((prev) => (prev - 1 + totalFrames) % totalFrames)
      e.preventDefault()
    } else if (e.key === " ") {
      setIsAutoPlaying((p) => !p)
      e.preventDefault()
    }
  }, [totalFrames])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br from-[#f0f4ff] to-[#e8eef5] select-none touch-none focus:outline-none focus:ring-2 focus:ring-primary"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Current frame image */}
      {images[frame] && (
        <Image
          src={images[frame]}
          alt={`${alt} - angle ${frame + 1} of ${totalFrames}`}
          fill
          className="object-cover pointer-events-none"
          priority={frame === 0}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          draggable={false}
        />
      )}

      {/* Drag hint overlay */}
      {showHint && !isAutoPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity">
          <div className="flex flex-col items-center gap-2 text-white animate-pulse">
            <Hand className="h-10 w-10" />
            <span className="text-sm font-medium">Drag to rotate</span>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); setIsAutoPlaying(!isAutoPlaying); dismissHint() }}
          className="px-3 py-1.5 bg-background/80 backdrop-blur rounded-lg flex items-center gap-1.5 hover:bg-background transition text-sm font-medium shadow-sm"
        >
          {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isAutoPlaying ? "Pause" : "Auto Spin"}
        </button>

        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-background/70 backdrop-blur rounded text-xs text-muted-foreground">
            <RotateCw className="h-3 w-3 inline mr-1" />
            {frame + 1}/{totalFrames}
          </div>
        </div>
      </div>
    </div>
  )
}
