// imgix URL builder for AVIF-first 4K image delivery
// Works with CloudFront cache policy that whitelists Accept header for content negotiation
// Target: <1s mobile load, 9,500+ vehicle inventory, 20,000 monthly visitors

interface ImgixParams {
  w?: number
  h?: number
  auto?: string
  q?: number
  fit?: string
  crop?: string
  dpr?: number
  cs?: string
  chromasub?: string
}

const IMGIX_DOMAIN = process.env.NEXT_PUBLIC_IMGIX_DOMAIN || "planetmotors.imgix.net"

export function imgix(path: string, params: ImgixParams = {}): string {
  const defaultParams: ImgixParams = {
    auto: "format,compress", // AVIF-first: serves AVIF/WebP/JPEG based on Accept header
    q: 85,
    cs: "srgb", // Consistent color space
    chromasub: "444", // No chroma subsampling for elite 4K quality
  }

  const mergedParams = { ...defaultParams, ...params }
  const queryString = Object.entries(mergedParams)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&")

  const querySuffix = queryString ? `?${queryString}` : ""
  return `https://${IMGIX_DOMAIN}/${path}${querySuffix}`
}

// Quality presets optimized for 4K vehicle galleries
export const imgixPresets = {
  thumbnail: { w: 400, h: 300, fit: "crop", q: 65 }, // Aggressive for mobile grid
  card: { w: 600, h: 400, fit: "crop", q: 72 }, // Inventory cards
  standard: { w: 1200, h: 800, q: 80 },
  hero: { w: 1920, h: 1080, q: 85 },
  "4k": { w: 3840, h: 2160, q: 90, chromasub: "444" }, // Elite 4K gallery
  spin: { w: 1920, h: 1080, q: 82 }, // Optimized for 360 spins (36 frames)
} as const

export function imgixWithPreset(path: string, preset: keyof typeof imgixPresets, overrides: ImgixParams = {}): string {
  return imgix(path, { ...imgixPresets[preset], ...overrides })
}

// Mobile-optimized URL generator for <1s load times
export function imgixMobile(path: string, width: number = 800): string {
  return imgix(path, { 
    w: width, 
    q: width <= 400 ? 65 : 72, // Adaptive quality for mobile
    fit: "max" 
  })
}
