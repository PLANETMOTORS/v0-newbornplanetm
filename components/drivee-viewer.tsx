"use client"

import { useState, useEffect, useRef } from "react"
import { RotateCw, Loader2 } from "lucide-react"
import { DRIVEE_DEALER_UID } from "@/lib/drivee"

interface DriveeViewerProps {
  /** Drivee media ID for this vehicle (required — from DRIVEE_VIN_MAP lookup) */
  mid: string
  /** Drivee dealer UID */
  uid?: string
  /** Vehicle name for accessibility */
  vehicleName: string
  /** Optional CSS class */
  className?: string
}

const DRIVEE_IFRAME_BASE = "https://iframe-b8b2c.web.app"

/**
 * Drivee background: neutral gray that matches the processed image backdrop.
 * This ensures the vehicle shadow blends naturally instead of appearing "pasted on".
 */
const DRIVEE_BG = "#e8e8e8"

/**
 * Premium 360° viewer powered by Drivee.ai
 *
 * Clean container for Drivee's fully self-contained iframe.
 * Drivee provides its own tabs, thumbnails, fullscreen control,
 * hotspots, and drag instructions — we just wrap it.
 *
 * Iframe params (per Drivee support):
 *  - style=style1  — uses the updated background with softer shadows
 *  - aspect=4:3    — proper vehicle proportions (not too zoomed)
 *  - device=gadget — responsive viewport handling
 *  - order=None    — let Drivee decide frame ordering
 */
export function DriveeViewer({
  mid,
  uid = DRIVEE_DEALER_UID,
  vehicleName,
  className = "",
}: DriveeViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const isLoadingRef = useRef(true)

  // Keep ref in sync with state so timeouts read the latest value
  useEffect(() => { isLoadingRef.current = isLoading }, [isLoading])

  // After the iframe's HTML shell loads, give Drivee a few more seconds to
  // render actual vehicle content before hiding the loading overlay.
  useEffect(() => {
    if (!iframeLoaded) return

    // Give Drivee 5 s after onLoad to populate content
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false)
    }, 5_000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [iframeLoaded])

  // Hard timeout: if the iframe never fires onLoad at all (network issue),
  // bail after 15 s.
  useEffect(() => {
    const hard = setTimeout(() => {
      if (isLoadingRef.current) {
        setHasError(true)
        setIsLoading(false)
      }
    }, 15_000)
    return () => clearTimeout(hard)
  }, [])

  // Drivee iframe only supports the `mid` parameter (media ID).
  // VIN-based lookup is NOT supported by Drivee's iframe.
  const iframeSrc = [
    `${DRIVEE_IFRAME_BASE}/`,
    `?mid=${mid}`,
    `&uid=${uid}`,
    `&style=style1`,
    `&aspect=4%3A3`,
    `&device=gadget`,
    `&order=None`,
  ].join("")

  if (hasError) {
    return (
      <div
        className={`relative h-[500px] md:h-[600px] rounded-xl overflow-hidden flex items-center justify-center ${className}`}
        style={{ backgroundColor: DRIVEE_BG }}
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
      className={`relative h-[500px] md:h-[600px] rounded-xl overflow-hidden ${className}`}
      style={{ backgroundColor: DRIVEE_BG }}
      role="region"
      aria-label={`360° Interactive View — ${vehicleName}`}
    >
      {/* Loading skeleton — matches Drivee background for seamless transition */}
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ backgroundColor: DRIVEE_BG }}
        >
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
        ref={iframeRef}
        onLoad={() => setIframeLoaded(true)}
        onError={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}
