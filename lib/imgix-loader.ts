// imgix Image Loader for Next.js 16
// AVIF-first delivery with automatic fallback to WebP/JPEG for older browsers
//
// ============================================================================
// CLOUDFRONT CONFIGURATION REQUIREMENTS
// ============================================================================
//
// 1. CACHE POLICY - Include Accept header in Cache Key:
//    - Go to CloudFront > Policies > Cache policies > Create policy
//    - Cache key settings > Headers: Include "Accept"
//    - This ensures CloudFront caches AVIF, WebP, and JPEG variants separately
//
// 2. ORIGIN REQUEST POLICY - Forward Accept header to imgix:
//    - Go to CloudFront > Policies > Origin request policies > Create policy  
//    - Headers: Include "Accept" header
//    - Attach this policy to your CloudFront distribution's behavior
//
// 3. RESPONSE HEADERS - imgix automatically adds "Vary: Accept"
//    - Verify in DevTools Network tab: Response Headers should show "Vary: Accept"
//    - This tells CloudFront to cache based on the Accept header value
//
// VERIFICATION (DevTools > Network > select image > Headers):
//    - Chrome/Edge: content-type: image/avif
//    - Firefox 93+: content-type: image/avif  
//    - Safari 16+: content-type: image/avif
//    - Older browsers: content-type: image/webp or image/jpeg
//    - Response should include: vary: Accept
//
// ============================================================================

interface ImageLoaderProps {
  src: string
  width: number
  quality?: number
}

const IMGIX_DOMAIN = process.env.NEXT_PUBLIC_IMGIX_DOMAIN || 'planetmotors.imgix.net'

// Common imgix params for AVIF-first optimization
const getImgixParams = (width: number, quality: number): URLSearchParams => {
  return new URLSearchParams({
    w: width.toString(),
    q: quality.toString(),
    // auto=format: AVIF-first, falls back to WebP, then JPEG based on Accept header
    // auto=compress: Applies optimal compression for the selected format
    auto: 'format,compress',
    // fit=max: Maintain aspect ratio, never upscale
    fit: 'max',
    // cs=srgb: Consistent color space across all formats
    cs: 'srgb',
    // chromasub=444: Higher color quality for vehicle photos (no chroma subsampling)
    chromasub: '444',
  })
}

export default function imgixLoader({ src, width, quality = 75 }: ImageLoaderProps): string {
  // Skip imgix for placeholder/fallback images
  if (src === '/placeholder.svg' || src.startsWith('data:')) {
    return src
  }

  // If already an imgix URL, just add/update params
  if (src.includes('imgix.net')) {
    const url = new URL(src)
    const params = getImgixParams(width, quality)
    params.forEach((value, key) => url.searchParams.set(key, value))
    return url.toString()
  }

  // If external URL (unsplash, blob storage), proxy through imgix Web Proxy
  if (src.startsWith('http')) {
    const params = getImgixParams(width, quality)
    params.set('url', src)
    return `https://${IMGIX_DOMAIN}/external?${params.toString()}`
  }

  // Local images - serve from imgix with path
  const params = getImgixParams(width, quality)
  const path = src.startsWith('/') ? src.slice(1) : src
  return `https://${IMGIX_DOMAIN}/${path}?${params.toString()}`
}

// Export for testing/debugging
export function getImageFormat(acceptHeader: string): 'avif' | 'webp' | 'jpeg' {
  if (acceptHeader.includes('image/avif')) return 'avif'
  if (acceptHeader.includes('image/webp')) return 'webp'
  return 'jpeg'
}
