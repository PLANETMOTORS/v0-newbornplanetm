// imgix Image Loader for Next.js
// AVIF-first delivery with automatic fallback to WebP/JPEG for older browsers.
//
// When NEXT_PUBLIC_IMGIX_DOMAIN is set and the imgix source is configured as a
// "Web Proxy" type, external image URLs (HomenetIOL, Sanity, etc.) are routed
// through imgix for on-the-fly AVIF conversion, adaptive quality, and CDN caching.
//
// When the env var is unset, the loader returns the original src unchanged so
// Vercel's built-in image optimizer handles it transparently — zero breakage.

interface ImageLoaderProps {
  src: string
  width: number
  quality?: number
}

const IMGIX_DOMAIN = process.env.NEXT_PUBLIC_IMGIX_DOMAIN ?? ''

/** Whether imgix is actively configured (env var set and non-empty). */
const isImgixActive = (): boolean => IMGIX_DOMAIN.length > 0

// Adaptive quality based on image size for optimal mobile performance
// Smaller images (thumbnails) can use lower quality, larger hero images need higher
const getAdaptiveQuality = (width: number, baseQuality: number): number => {
  if (width <= 400) return Math.min(baseQuality, 65)  // Thumbnails: aggressive compression
  if (width <= 800) return Math.min(baseQuality, 72)  // Mobile: balanced
  if (width <= 1200) return baseQuality               // Tablet: default quality
  return Math.min(baseQuality + 5, 85)                // Desktop hero: higher quality
}

// Common imgix params for AVIF-first optimization
// Target: <1s mobile load time for 9,500+ vehicle inventory
const buildImgixParams = (width: number, quality: number): URLSearchParams => {
  const adaptiveQuality = getAdaptiveQuality(width, quality)

  return new URLSearchParams({
    w: width.toString(),
    q: adaptiveQuality.toString(),
    // auto=format: AVIF-first (up to 50% smaller than JPEG), WebP fallback, then JPEG
    // auto=compress: Applies optimal compression for the selected format
    auto: 'format,compress',
    // fit=max: Maintain aspect ratio, never upscale
    fit: 'max',
    // cs=srgb: Consistent color space across all formats
    cs: 'srgb',
    // chromasub=444: Higher color quality for vehicle photos (no chroma subsampling)
    chromasub: '444',
    // dpr=1: Prevent automatic DPR scaling (Next.js handles srcset)
    dpr: '1',
  })
}

/** Build a full imgix URL from an origin path and width/quality params. */
function buildImgixUrl(path: string, width: number, quality: number): string {
  const params = buildImgixParams(width, quality)
  return `https://${IMGIX_DOMAIN}/${path}?${params.toString()}`
}

export default function imgixLoader({ src, width, quality = 75 }: ImageLoaderProps): string {
  // Skip imgix for placeholder/fallback images
  if (src === '/placeholder.svg' || src.startsWith('data:')) {
    return src
  }

  // If already an imgix URL, always add/update params (regardless of config)
  if (src.includes('imgix.net')) {
    const url = new URL(src)
    const params = buildImgixParams(width, quality)
    params.forEach((value, key) => url.searchParams.set(key, value))
    return url.toString()
  }

  // If imgix is not configured, return src unchanged (Vercel optimizer handles it)
  if (!isImgixActive()) {
    return src
  }

  // Pass through Vercel Blob URLs directly (imgix can't proxy these)
  if (src.includes('blob.vercel-storage.com')) {
    return src
  }

  // Proxy external image URLs through imgix (HomenetIOL, Sanity, etc.)
  // imgix "Web Proxy" source type fetches the original and applies transforms.
  if (src.startsWith('http')) {
    return buildImgixUrl(src, width, quality)
  }

  // Local images — serve from imgix with the relative path
  const path = src.startsWith('/') ? src.slice(1) : src
  return buildImgixUrl(path, width, quality)
}

// Export for testing/debugging
export function getImageFormat(acceptHeader: string): 'avif' | 'webp' | 'jpeg' {
  if (acceptHeader.includes('image/avif')) return 'avif'
  if (acceptHeader.includes('image/webp')) return 'webp'
  return 'jpeg'
}
