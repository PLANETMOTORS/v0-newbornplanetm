"use client"

import { useState } from "react"
import { RotateCw, Loader2 } from "lucide-react"

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
 * Clean container for Drivee's fully self-contained iframe.
 * Drivee provides its own tabs, thumbnails, fullscreen control,
 * hotspots, and drag instructions — we just wrap it.
 */
export function DriveeViewer({
  mid,
  uid = DRIVEE_DEALER_UID,
  vehicleName,
  className = "",
}: DriveeViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const iframeSrc = `${DRIVEE_IFRAME_BASE}/?mid=${mid}&uid=${uid}&order=36&style=1`

  if (hasError) {
    return (
      <div
        className={`relative h-[500px] md:h-[600px] rounded-xl overflow-hidden bg-gradient-to-br from-[#f0f4ff] to-[#e8eef5] flex items-center justify-center ${className}`}
        role="region"
        aria-label={`360° view unavailable for ${vehicleName}`}
      >
        <div className="text-center p-6">
          <RotateCw className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">360° view unavailable</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Interactive viewer could not be loaded</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative h-[500px] md:h-[600px] rounded-xl overflow-hidden bg-neutral-100 ${className}`}
      role="region"
      aria-label={`360° Interactive View — ${vehicleName}`}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] to-[#e8eef5]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Loading 360° experience…</p>
          </div>
        </div>
      )}

      {/* Drivee iframe — fully self-contained with its own UI */}
      <iframe
        src={iframeSrc}
        title={`360° Interactive View — ${vehicleName}`}
        className="border-0"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        allow="fullscreen; autoplay"
        onLoad={() => setIsLoading(false)}
        onError={() => { setHasError(true); setIsLoading(false) }}
      />
    </div>
  )
}
