/**
 * Planet Motors Image Utilities
 * 
 * Helper functions for generating optimized image URLs using imgix + CloudFront
 * with AVIF-first delivery for 360 vehicle spin images.
 */

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://images.planetmotors.com'

interface ImageParams {
  width?: number
  height?: number
  quality?: number
  format?: 'avif' | 'webp' | 'jpg' | 'png' | 'auto'
  fit?: 'crop' | 'clip' | 'fill' | 'max' | 'min' | 'scale'
  auto?: ('format' | 'compress')[]
  dpr?: number
  blur?: number
}

/**
 * Generate an optimized imgix URL with AVIF support
 */
export function getOptimizedImageUrl(path: string, params: ImageParams = {}): string {
  const {
    width,
    height,
    quality = 80,
    format = 'avif',
    fit = 'crop',
    auto = ['format', 'compress'],
    dpr,
    blur,
  } = params

  const searchParams = new URLSearchParams()

  if (width) searchParams.set('w', width.toString())
  if (height) searchParams.set('h', height.toString())
  searchParams.set('q', quality.toString())
  searchParams.set('fit', fit)
  
  if (format !== 'auto') {
    searchParams.set('fm', format)
  }
  
  if (auto.length > 0) {
    searchParams.set('auto', auto.join(','))
  }
  
  if (dpr) searchParams.set('dpr', dpr.toString())
  if (blur) searchParams.set('blur', blur.toString())

  return `${IMAGE_BASE_URL}/${path}?${searchParams.toString()}`
}

/**
 * Generate URL for a specific 360 spin frame
 */
export function getSpinFrameUrl(
  vehicleId: string, 
  frame: number, 
  options: { mobile?: boolean; thumbnail?: boolean } = {}
): string {
  const paddedFrame = frame.toString().padStart(3, '0')
  const path = `vehicles/${vehicleId}/spin/${paddedFrame}.jpg`

  if (options.thumbnail) {
    return getOptimizedImageUrl(path, {
      width: 400,
      height: 267,
      quality: 60,
      blur: 20,
    })
  }

  if (options.mobile) {
    return getOptimizedImageUrl(path, {
      width: 800,
      height: 533,
      quality: 80,
    })
  }

  return getOptimizedImageUrl(path, {
    width: 1200,
    height: 800,
    quality: 85,
  })
}

/**
 * Generate URLs for all 36 frames of a vehicle 360 spin
 */
export function getAllSpinFrameUrls(
  vehicleId: string,
  frameCount: number = 36,
  options: { mobile?: boolean } = {}
): string[] {
  return Array.from({ length: frameCount }, (_, i) => 
    getSpinFrameUrl(vehicleId, i, options)
  )
}

/**
 * Get priority frames for preloading (every 9th frame for smooth initial experience)
 */
export function getPrioritySpinFrames(vehicleId: string): string[] {
  const priorityIndices = [0, 9, 18, 27]
  return priorityIndices.map(i => getSpinFrameUrl(vehicleId, i))
}

/**
 * Generate inventory card image URL
 */
export function getInventoryCardUrl(vehicleId: string, retina: boolean = false): string {
  const path = `vehicles/${vehicleId}/primary.jpg`
  
  return getOptimizedImageUrl(path, {
    width: retina ? 1200 : 600,
    height: retina ? 800 : 400,
    quality: retina ? 75 : 80,
  })
}

/**
 * Generate srcset for responsive images
 */
export function getResponsiveSrcSet(
  path: string,
  widths: number[] = [400, 800, 1200, 1600]
): string {
  return widths
    .map(w => `${getOptimizedImageUrl(path, { width: w })} ${w}w`)
    .join(', ')
}

/**
 * Generate Open Graph / social media image URL
 */
export function getOgImageUrl(vehicleId: string): string {
  const path = `vehicles/${vehicleId}/primary.jpg`
  
  return getOptimizedImageUrl(path, {
    width: 1200,
    height: 630,
    quality: 90,
    format: 'jpg', // JPG for better social media compatibility
  })
}

/**
 * Preload image with proper crossOrigin for canvas usage
 */
export async function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Preload multiple images with progress callback
 */
export async function preloadImages(
  urls: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<HTMLImageElement[]> {
  let loaded = 0
  const total = urls.length

  const promises = urls.map(async (url) => {
    const img = await preloadImage(url)
    loaded++
    onProgress?.(loaded, total)
    return img
  })

  return Promise.all(promises)
}

/**
 * Check if browser supports AVIF format
 */
export async function supportsAVIF(): Promise<boolean> {
  if (globalThis.window === undefined) return false
  const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIyH+/JAAAKAAoHOAAGkBDQAjIfDQ=='
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = avifData
  })
}
