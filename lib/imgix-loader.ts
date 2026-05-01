// imgix Image Loader for Next.js
// AVIF-first delivery with automatic fallback to WebP/JPEG for older browsers.
//
// The imgix source is configured as "Web Folder" with base URL
// https://content.homenetiol.com/ — so vehicle image URLs from HomenetIOL
// are stripped to relative paths before being sent to imgix.
//
// The custom loader is only activated at build time when NEXT_PUBLIC_IMGIX_DOMAIN
// is set (see next.config.mjs). When unset, Vercel's built-in optimizer is used.

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

  // HomenetIOL vehicle images — strip base URL to get relative path for Web Folder source.
  // e.g. https://content.homenetiol.com/2003873/2291843/0x0/abc.jpg → 2003873/2291843/0x0/abc.jpg
  if (src.includes('homenetiol.com')) {
    const path = src.replace(/^https?:\/\/(?:content|photos)\.homenetiol\.com\//, '')
    return buildImgixUrl(path, width, quality)
  }

  // Other external URLs can't be served through a Web Folder source — pass through unchanged
  if (src.startsWith('http')) {
    return src
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
