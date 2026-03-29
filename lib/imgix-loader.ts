// imgix Image Loader for Next.js 16
// Provides on-the-fly image transforms with CDN edge caching

interface ImageLoaderProps {
  src: string
  width: number
  quality?: number
}

const IMGIX_DOMAIN = 'planetmotors.imgix.net'

export default function imgixLoader({ src, width, quality }: ImageLoaderProps): string {
  // If already an imgix URL, just add params
  if (src.includes('imgix.net')) {
    const url = new URL(src)
    url.searchParams.set('w', width.toString())
    url.searchParams.set('q', (quality || 75).toString())
    url.searchParams.set('auto', 'format,compress')
    url.searchParams.set('fit', 'max')
    return url.toString()
  }

  // If external URL (unsplash, blob storage), proxy through imgix
  if (src.startsWith('http')) {
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: (quality || 75).toString(),
      auto: 'format,compress',
      fit: 'max',
    })
    return `https://${IMGIX_DOMAIN}/external?${params.toString()}`
  }

  // Local images - serve from imgix with path
  const params = new URLSearchParams({
    w: width.toString(),
    q: (quality || 75).toString(),
    auto: 'format,compress',
    fit: 'max',
  })
  
  // Remove leading slash for imgix path
  const path = src.startsWith('/') ? src.slice(1) : src
  return `https://${IMGIX_DOMAIN}/${path}?${params.toString()}`
}
