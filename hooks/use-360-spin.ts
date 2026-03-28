"use client"

import { useState, useRef, useEffect } from "react"

interface Use360SpinOptions {
  totalFrames: number
  sensitivity?: number
  autoPlaySpeed?: number
  loop?: boolean
}

export function use360Spin({ 
  totalFrames, 
  sensitivity = 5, 
  autoPlaySpeed = 50,
  loop = true 
}: Use360SpinOptions) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartFrame = useRef(0)

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => {
      setCurrentFrame(prev => (prev + 1 >= totalFrames ? (loop ? 0 : prev) : prev + 1))
    }, autoPlaySpeed)
    return () => clearInterval(id)
  }, [isPlaying, totalFrames, autoPlaySpeed, loop])

  // Pointer handlers
  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setIsPlaying(false)
    dragStartX.current = e.clientX
    dragStartFrame.current = currentFrame
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    let newFrame = (dragStartFrame.current + Math.floor((e.clientX - dragStartX.current) / sensitivity)) % totalFrames
    setCurrentFrame(newFrame < 0 ? newFrame + totalFrames : newFrame)
  }

  const onPointerUp = () => setIsDragging(false)

  return {
    currentFrame,
    isPlaying,
    isDragging,
    toggle: () => setIsPlaying(p => !p),
    handlers: { onPointerDown, onPointerMove, onPointerUp }
  }
}
