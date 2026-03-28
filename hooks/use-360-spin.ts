"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface Use360SpinOptions {
  totalFrames: number
  sensitivity?: number
  autoPlaySpeed?: number
}

export function use360Spin({ totalFrames, sensitivity = 5, autoPlaySpeed = 50 }: Use360SpinOptions) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startFrame = useRef(0)

  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => setCurrentFrame(f => (f + 1) % totalFrames), autoPlaySpeed)
    return () => clearInterval(id)
  }, [isPlaying, totalFrames, autoPlaySpeed])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startFrame.current = currentFrame
    setIsPlaying(false)
  }, [currentFrame])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    let frame = (startFrame.current + Math.floor((e.clientX - startX.current) / sensitivity)) % totalFrames
    setCurrentFrame(frame < 0 ? frame + totalFrames : frame)
  }, [sensitivity, totalFrames])

  const onPointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return { 
    currentFrame, 
    isPlaying, 
    toggle: () => setIsPlaying(p => !p), 
    onPointerDown, 
    onPointerMove, 
    onPointerUp 
  }
}
