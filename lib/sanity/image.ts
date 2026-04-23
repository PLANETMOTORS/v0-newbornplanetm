/**
 * lib/sanity/image.ts
 *
 * Sanity Image Pipeline helpers.
 *
 * Sanity's Image API (cdn.sanity.io) supports on-the-fly transformations via
 * URL query parameters — the same interface as imgix. We use this instead of
 * raw `asset->url` so every Sanity-hosted image is:
 *   • Auto-converted to WebP/AVIF based on Accept header  (auto=format)
 *   • Resized to the requested width                       (w=)
 *   • Compressed at quality 80                             (q=80)
 *   • Cropped to fit the requested dimensions              (fit=max)
 *
 * Docs: https://www.sanity.io/docs/image-urls
 *
 * Usage:
 *   import { sanityImage } from "@/lib/sanity/image"
 *   <img src={sanityImage(vehicle.mainImage, { w: 800, h: 600 })} />
 */

export interface SanityImageOptions {
  /** Target width in pixels */
  w?: number
  /** Target height in pixels */
  h?: number
  /** Quality 1–100 (default: 80) */
  q?: number
  /**
   * Fit mode (default: "max" — never upscale, preserve aspect ratio)
   * "crop" — crop to exact dimensions
   * "fill" — fill with background color
   * "min"  — like max but may upscale
   */
  fit?: "max" | "crop" | "fill" | "min" | "clip" | "scale"
  /**
   * Output format override.
   * Leave unset to use auto=format (browser-negotiated WebP/AVIF).
   */
  fm?: "webp" | "avif" | "jpg" | "png"
  /** Blur radius 0–2000 */
  blur?: number
  /** Device pixel ratio multiplier (1–5) */
  dpr?: number
}

/**
 * Append Sanity Image API transformation params to a raw Sanity CDN URL.
 *
 * If `url` is null/undefined/empty, returns an empty string so components
 * can safely use `src={sanityImage(vehicle.mainImage) || "/placeholder.jpg"}`.
 */
export function sanityImage(url: string | null | undefined, options: SanityImageOptions = {}): string {
  if (!url) return ""

  // Only transform cdn.sanity.io URLs — leave external URLs untouched
  if (!url.includes("cdn.sanity.io")) return url

  const {
    w,
    h,
    q = 80,
    fit = "max",
    fm,
    blur,
    dpr,
  } = options

  const params = new URLSearchParams()

  if (w) params.set("w", String(w))
  if (h) params.set("h", String(h))
  params.set("q", String(q))
  params.set("fit", fit)

  if (fm) {
    params.set("fm", fm)
  } else {
    // Let Sanity negotiate the best format (WebP on most browsers, AVIF where supported)
    params.set("auto", "format")
  }

  if (blur) params.set("blur", String(blur))
  if (dpr) params.set("dpr", String(dpr))

  // Preserve any existing query params (e.g. crop/hotspot from Sanity)
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}${params.toString()}`
}

// ─── Preset helpers ──────────────────────────────────────────────────────────

/** Inventory card thumbnail — 600×400, WebP/AVIF auto */
export const inventoryCardImage = (url: string | null | undefined) =>
  sanityImage(url, { w: 600, h: 400, fit: "crop" })

/** VDP hero — 1200×800, WebP/AVIF auto */
export const vdpHeroImage = (url: string | null | undefined) =>
  sanityImage(url, { w: 1200, h: 800, fit: "crop" })

/** VDP gallery thumbnail — 200×133 */
export const vdpThumbImage = (url: string | null | undefined) =>
  sanityImage(url, { w: 200, h: 133, fit: "crop", q: 70 })

/** Blog cover — 800×450, WebP/AVIF auto */
export const blogCoverImage = (url: string | null | undefined) =>
  sanityImage(url, { w: 800, h: 450, fit: "crop" })

/** Open Graph / social — 1200×630, JPG (best social compat) */
export const ogImage = (url: string | null | undefined) =>
  sanityImage(url, { w: 1200, h: 630, fit: "crop", fm: "jpg", q: 90 })

/** Lender logo — 200px wide, transparent-safe PNG */
export const lenderLogoImage = (url: string | null | undefined) =>
  sanityImage(url, { w: 200, fit: "max", fm: "png" })
