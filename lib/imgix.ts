// imgix URL builder for AVIF-first image delivery
// Works with CloudFront cache policy that whitelists Accept header for content negotiation

interface ImgixParams {
  w?: number
  h?: number
  auto?: string
  q?: number
  fit?: string
  crop?: string
  dpr?: number
}

const IMGIX_DOMAIN = "cdn.planetmotors.ca"

export function imgix(path: string, params: ImgixParams = {}): string {
  const defaultParams: ImgixParams = {
    auto: "format,compress", // AVIF-first: serves AVIF/WebP/JPEG based on Accept header
    q: 85,
  }

  const mergedParams = { ...defaultParams, ...params }
  const queryString = Object.entries(mergedParams)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&")

  return `https://${IMGIX_DOMAIN}/${path}${queryString ? `?${queryString}` : ""}`
}

// Quality presets for different use cases
export const imgixPresets = {
  thumbnail: { w: 400, h: 300, fit: "crop", q: 75 },
  standard: { w: 1200, h: 800, q: 85 },
  hero: { w: 1920, h: 1080, q: 90 },
  "4k": { w: 3840, h: 2160, q: 95 },
  spin: { w: 1920, h: 1080, q: 85 }, // Optimized for 360 spins
} as const

export function imgixWithPreset(path: string, preset: keyof typeof imgixPresets, overrides: ImgixParams = {}): string {
  return imgix(path, { ...imgixPresets[preset], ...overrides })
}
