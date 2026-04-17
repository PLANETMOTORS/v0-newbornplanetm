"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Maximize2, Minimize2, Loader2, Eye } from "lucide-react"

interface InteriorViewerProps {
  /** URL to the equirectangular panorama image (Insta360 output). */
  src: string
  /** Vehicle name for alt text / aria labels. */
  alt: string
}

/**
 * Interior 360° Panorama Viewer
 *
 * Renders an equirectangular Insta360 image as an interactive panorama
 * using Pannellum (lightweight, no Three.js dependency).
 *
 * Features:
 *  - Drag/swipe to look around
 *  - Pinch/scroll to zoom
 *  - Fullscreen mode
 *  - Auto-rotate on load
 *  - Keyboard: arrow keys to pan, +/- to zoom, F for fullscreen
 */
export function VehicleInteriorViewer({ src, alt }: InteriorViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerDivRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pannellumInstance = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ── Load Pannellum JS + CSS from CDN, then initialize ──
  useEffect(() => {
    if (!viewerDivRef.current) return
    setIsLoading(true)
    let cancelled = false

    const ensurePannellum = (): Promise<void> => {
      // Already loaded?
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).pannellum) return Promise.resolve()

      return new Promise((resolve, reject) => {
        // Inject CSS
        if (!document.getElementById("pannellum-css")) {
          const link = document.createElement("link")
          link.id = "pannellum-css"
          link.rel = "stylesheet"
          link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.css"
          document.head.appendChild(link)
        }
        // Inject JS
        if (!document.getElementById("pannellum-js")) {
          const script = document.createElement("script")
          script.id = "pannellum-js"
          script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js"
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("Failed to load Pannellum"))
          document.head.appendChild(script)
        } else {
          // Script tag exists but might still be loading — poll with timeout
          let attempts = 0
          const check = () => {
            if (cancelled) return
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).pannellum) resolve()
            else if (++attempts > 200) reject(new Error("Pannellum load timeout"))
            else setTimeout(check, 50)
          }
          check()
        }
      })
    }

    const init = async () => {
      try {
        await ensurePannellum()
      } catch {
        console.error("Pannellum failed to load")
        if (!cancelled) setIsLoading(false)
        return
      }

      if (cancelled || !viewerDivRef.current) return

      // Destroy existing instance
      if (pannellumInstance.current) {
        try { pannellumInstance.current.destroy() } catch { /* ignore */ }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pano = (window as any).pannellum
      pannellumInstance.current = pano.viewer(viewerDivRef.current, {
        type: "equirectangular",
        panorama: src,
        autoLoad: true,
        autoRotate: -2,
        autoRotateInactivityDelay: 3000,
        compass: false,
        showZoomCtrl: false,
        showFullscreenCtrl: false,
        showControls: false,
        mouseZoom: true,
        keyboardZoom: true,
        draggable: true,
        disableKeyboardCtrl: false,
        hfov: 100,
        minHfov: 50,
        maxHfov: 120,
        pitch: 0,
        yaw: 0,
        strings: { loadingLabel: "" },
      })

      pannellumInstance.current.on("load", () => {
        if (!cancelled) setIsLoading(false)
      })
    }

    init()

    return () => {
      cancelled = true
      if (pannellumInstance.current) {
        try { pannellumInstance.current.destroy() } catch { /* ignore */ }
        pannellumInstance.current = null
      }
    }
  }, [src])

  // ── Fullscreen ──
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen((f) => !f)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  // ── Keyboard: F for fullscreen ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen()
        e.preventDefault()
      }
    },
    [toggleFullscreen],
  )

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`relative w-full rounded-xl overflow-hidden select-none focus:outline-none focus:ring-2 focus:ring-primary ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "aspect-[4/3]"
      }`}
      role="region"
      aria-label={`Interior 360° Panorama — ${alt}`}
      aria-roledescription="360° panorama viewer"
    >
      {/* Pannellum container */}
      <div
        ref={viewerDivRef}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-neutral-900">
          <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-white/70 font-medium">Loading interior view…</p>
        </div>
      )}

      {/* Drag hint */}
      {!isLoading && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur rounded-lg text-xs text-white/80">
            <Eye className="h-3 w-3" />
            Drag to look around
          </div>
        </div>
      )}

      {/* Controls */}
      {!isLoading && (
        <div className="absolute bottom-3 right-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFullscreen()
            }}
            className="p-1.5 bg-background/80 backdrop-blur rounded-lg hover:bg-background transition shadow-sm"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
