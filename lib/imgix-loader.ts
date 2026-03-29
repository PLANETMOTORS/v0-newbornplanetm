// imgix Image Loader for Next.js 16
// Provides on-the-fly image transforms with CDN edge caching
//
// CLOUDFRONT DEPLOYMENT NOTE:
// When deploying with CloudFront, configure the Origin Request Policy to forward
// the "Accept" header to imgix. This enables proper content negotiation:
// - Browsers send Accept: image/avif,image/webp,... 
// - imgix uses this to serve the optimal format (AVIF/WebP/JPEG)
// - CloudFront caches each format variant separately via Vary: Accept
//
// CloudFront Origin Request Policy settings:
// - Headers: Include "Accept" header in cache key and forwarded to origin
// - This allows imgix to detect browser capabilities before CloudFront caches

interface ImageLoaderProps {
  src: string
  width: number
  quality?: number
}

const IMGIX_DOMAIN = process.env.NEXT_PUBLIC_IMGIX_DOMAIN || 'planetmotors.imgix.net'

export default function imgixLoader({ src, width, quality }: ImageLoaderProps): string {
  // Skip imgix for placeholder/fallback images
  if (src === '/placeholder.svg' || src.startsWith('data:')) {
    return src
  }

  // If already an imgix URL, just add params
  if (src.includes('imgix.net')) {
    const url = new URL(src)
    url.searchParams.set('w', width.toString())
    url.searchParams.set('q', (quality || 75).toString())
    // auto=format enables Accept header content negotiation for AVIF/WebP
    url.searchParams.set('auto', 'format,compress')
    url.searchParams.set('fit', 'max')
    url.searchParams.set('cs', 'srgb') // Consistent color space
    return url.toString()
  }

  // If external URL (unsplash, blob storage), proxy through imgix
  if (src.startsWith('http')) {
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: (quality || 75).toString(),
      auto: 'format,compress', // Enables Accept header content negotiation
      fit: 'max',
      cs: 'srgb',
    })
    return `https://${IMGIX_DOMAIN}/external?${params.toString()}`
  }

  // Local images - serve from imgix with path
  const params = new URLSearchParams({
    w: width.toString(),
    q: (quality || 75).toString(),
    auto: 'format,compress', // Enables Accept header content negotiation
    fit: 'max',
    cs: 'srgb',
  })
  
  // Remove leading slash for imgix path
  const path = src.startsWith('/') ? src.slice(1) : src
  return `https://${IMGIX_DOMAIN}/${path}?${params.toString()}`
}
