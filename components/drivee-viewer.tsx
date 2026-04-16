"use client"

import { useState, useRef, useEffect } from "react"
import { Maximize2, Minimize2, RotateCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DriveeViewerProps {
  /** Drivee media ID for this vehicle */
  mid: string
  /** Drivee dealer UID */
  uid?: string
  /** Vehicle name for accessibility */
  vehicleName: string
  /** Optional CSS class */
  className?: string
}

const DRIVEE_DEALER_UID = "AZYuEtjX9NUvWpqmUQcKyiGHbNg1"
const DRIVEE_IFRAME_BASE = "https://iframe-b8b2c.web.app"

/**
 * Premium 360° viewer powered by Drivee.ai
 * 
 * Embeds Drivee's responsive iframe with:
 * - Interactive drag-to-rotate exterior 360°
 * - Interior panoramic views
 * - Hotspot overlays (Drivee-managed)
 * - Fullscreen support
 * - Loading states with skeleton
 */
export function DriveeViewer({
  mid,
  uid = DRIVEE_DEALER_UID,
  vehicleName,
  className = "",
}: DriveeViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const iframeSrc = `${DRIVEE_IFRAME_BASE}/?mid=${mid}&uid=${uid}&order=36&style=1`

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // Fullscreen not supported
    }
  }

  // Listen for fullscreen changes (e.g. user presses Escape)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  if (hasError) {
    return (
      <div className={`relative aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br from-[#f0f4ff] to-[#e8eef5] flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <RotateCw className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">360° view unavailable</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Interactive viewer could not be loaded</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden bg-black group ${isFullscreen ? "fixed inset-0 z-50" : "aspect-[16/10]"} ${className}`}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] to-[#e8eef5]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Loading 360° experience...</p>
          </div>
        </div>
      )}

      {/* Drivee iframe */}
      <iframe
        src={iframeSrc}
        title={`360° Interactive View — ${vehicleName}`}
        className="absolute inset-0 w-full h-full border-0"
        allow="fullscreen; autoplay"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => { setHasError(true); setIsLoading(false) }}
      />

      {/* Premium badge */}
      <div className="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium pointer-events-none">
        <RotateCw className="w-3.5 h-3.5" />
        360° Interactive
      </div>

      {/* Fullscreen toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white rounded-lg h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>

      {/* Drag hint — fades after interaction */}
      {!isLoading && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Drag to rotate • Pinch to zoom • Tap hotspots
        </div>
      )}
    </div>
  )
}
