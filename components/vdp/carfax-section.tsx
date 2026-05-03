"use client"

/**
 * VDP Carfax section — driven by real per-VIN data from the Badging API v3.
 *
 * Variants
 * --------
 *  - "headline" — small claims strip for the highlights row.
 *  - "panel"    — Self-contained Power Bar: includes the full floating
 *    container with shadow, badge strip (or text fallback), and CTA.
 *    Returns NULL when there is nothing to display — no empty white box.
 *
 * The panel variant owns its entire container so the parent never renders
 * a white box that the child then leaves empty (the Safari/incognito
 * badge-image-blocked scenario).
 */

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  hasAccidentFreeBadge,
  hasLowKilometerBadge,
  hasOneOwnerBadge,
} from "@/lib/carfax/adapters"
import { useCarfaxSummary } from "@/hooks/use-carfax-summary"
import { proxyBadgeUrl } from "@/lib/carfax/proxy-url"

interface CarfaxSectionProps {
  vin: string | null
  variant?: "headline" | "panel"
  className?: string
}

export function CarfaxSection({
  vin,
  variant = "panel",
  className,
}: Readonly<CarfaxSectionProps>) {
  const state = useCarfaxSummary(vin)
  const [imgError, setImgError] = useState(false)

  if (state.status === "loading") {
    if (variant === "panel") {
      /* Panel loading: slim skeleton inside the Power Bar shape */
      return (
        <div className="w-full max-w-[850px] mx-auto mb-10 mt-4 px-4 md:px-0" data-testid="carfax-loading">
          <Skeleton className="h-[80px] w-full rounded-[20px]" />
        </div>
      )
    }
    return (
      <div className={className} data-testid="carfax-loading">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    )
  }

  if (state.status === "disabled" || state.status === "error") return null
  if (state.status === "no-report") return null

  const { summary, stale } = state

  // Build claims list used by both variants
  const claims: string[] = []
  if (hasAccidentFreeBadge(summary)) claims.push("No Accidents")
  if (hasOneOwnerBadge(summary)) claims.push("One Owner")
  if (hasLowKilometerBadge(summary)) claims.push("Low KM")

  /* ── Headline variant ───────────────────────────────────────────── */
  if (variant === "headline") {
    const headlineClaims: string[] = []
    if (hasAccidentFreeBadge(summary)) headlineClaims.push("No reported accidents")
    if (hasOneOwnerBadge(summary)) headlineClaims.push("One owner")
    if (hasLowKilometerBadge(summary)) headlineClaims.push("Low kilometres")
    if (headlineClaims.length === 0) return null
    return (
      <div className={className} data-testid="carfax-headline">
        <div className="flex flex-col justify-center gap-1">
          {headlineClaims.map((c) => (
            <p key={c} className="text-xs font-bold text-green-600">
              ✓ {c}
            </p>
          ))}
        </div>
      </div>
    )
  }

  /* ── Panel variant — self-contained Power Bar ───────────────────── */
  const hasBadgeImage = !!summary.badgesImageUrl && !imgError
  const hasContent = hasBadgeImage || claims.length > 0

  /* Nothing to show? Return NULL — no empty white box, ever. */
  if (!hasContent) return null

  const reportUrl = summary.vhrReportUrl
  const targetUrl = reportUrl ?? `https://www.carfax.ca/vehicle/${summary.vin}`
  const altText = claims.length > 0
    ? `CARFAX Canada: ${claims.join(", ")}`
    : "CARFAX Canada Vehicle History"

  return (
    <div className="w-full max-w-[850px] mx-auto mb-10 mt-4 px-4 md:px-0" data-testid="carfax-panel">
      <div className="flex flex-col md:flex-row items-center justify-between h-auto md:h-[80px] px-8 py-6 md:py-0 border border-slate-100 rounded-[20px] bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_50px_-12px_rgba(0,0,0,0.15)] transition-all duration-500">

        {/* HERO: Badge image or text fallback */}
        <div className="flex items-center">
          {hasBadgeImage ? (
            <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proxyBadgeUrl(summary.badgesImageUrl ?? "")}
                alt={altText}
                width="280"
                height="36"
                style={{ height: "36px", width: "auto" }}
                className="drop-shadow-sm brightness-105"
                onError={() => setImgError(true)}
              />
            </a>
          ) : (
            <div className="flex items-center gap-4">
              {claims.map((c) => (
                <span key={c} className="text-sm font-bold text-green-600">
                  ✓ {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA: View Full Report */}
        {reportUrl && (
          <div className="mt-6 md:mt-0 w-full md:w-auto">
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-10 py-4 bg-[#0f172a] text-white rounded-xl font-black text-xs md:text-sm uppercase tracking-[0.2em] hover:bg-black active:scale-95 transition-all shadow-lg w-full md:w-auto"
            >
              VIEW FULL REPORT
            </a>
          </div>
        )}
      </div>

      {stale && (
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Refreshing CARFAX data…
        </p>
      )}
    </div>
  )
}
