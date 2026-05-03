/**
 * Tests for helper functions in app/inventory/layout.tsx.
 *
 * We can't easily render the full Server Component in Vitest,
 * but we can test the exported utility logic by extracting the
 * pure functions. Since they are module-private, we test them
 * indirectly via the module's behaviour or replicate them here.
 */
import { describe, it, expect, vi } from "vitest"

/* ── withTimeout (replicated — same logic as in layout.tsx) ──────── */
function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

describe("withTimeout helper", () => {
  it("resolves with the promise value when it finishes before the timeout", async () => {
    const result = await withTimeout(
      Promise.resolve("fast"),
      "fallback",
      1000,
    )
    expect(result).toBe("fast")
  })

  it("resolves with the fallback when the promise is slower than the timeout", async () => {
    vi.useFakeTimers()
    const slow = new Promise<string>((resolve) =>
      setTimeout(() => resolve("slow"), 5000),
    )
    const racePromise = withTimeout(slow, "fallback", 100)
    vi.advanceTimersByTime(150)
    const result = await racePromise
    expect(result).toBe("fallback")
    vi.useRealTimers()
  })

  it("resolves with the fallback when the promise rejects after timeout", async () => {
    vi.useFakeTimers()
    const failing = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("boom")), 5000),
    )
    const racePromise = withTimeout(failing, "safe", 100)
    vi.advanceTimersByTime(150)
    const result = await racePromise
    expect(result).toBe("safe")
    vi.useRealTimers()
  })
})

/* ── isRealImage (replicated — same logic as in layout.tsx) ──────── */
const REAL_IMG = ['.jpg', '.png', '.webp', 'cdn.planetmotors.ca', 'imgix.net', 'homenetiol.com', 'cpsimg.com']

function isRealImage(url: string | null | undefined): url is string {
  if (!url) return false
  if (url.includes('unsplash.com') || url.includes('planetmotors.ca/inventory')) return false
  return REAL_IMG.some(ind => url.includes(ind))
}

describe("isRealImage filter", () => {
  it("accepts image URLs with known extensions", () => {
    expect(isRealImage("https://cdn.example.com/car.jpg")).toBe(true)
    expect(isRealImage("https://cdn.example.com/car.png")).toBe(true)
    expect(isRealImage("https://cdn.example.com/car.webp")).toBe(true)
  })

  it("accepts URLs from known CDN hosts", () => {
    expect(isRealImage("https://cdn.planetmotors.ca/img/1.jpg")).toBe(true)
    expect(isRealImage("https://foo.imgix.net/bar")).toBe(true)
    expect(isRealImage("https://homenetiol.com/veh/123.jpg")).toBe(true)
    expect(isRealImage("https://cpsimg.com/photo.jpg")).toBe(true)
  })

  it("rejects null/undefined/empty", () => {
    expect(isRealImage(null)).toBe(false)
    expect(isRealImage(undefined)).toBe(false)
    expect(isRealImage("")).toBe(false)
  })

  it("rejects unsplash placeholders", () => {
    expect(isRealImage("https://images.unsplash.com/photo-123.jpg")).toBe(false)
  })

  it("rejects planetmotors.ca/inventory self-links", () => {
    expect(isRealImage("https://www.planetmotors.ca/inventory")).toBe(false)
  })
})

/* ── buildSrcSet (replicated) ────────────────────────────────────── */
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920]

function buildSrcSet(src: string): string {
  return DEVICE_SIZES.map(
    w => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75 ${w}w`
  ).join(', ')
}

describe("buildSrcSet", () => {
  it("returns a srcset string with all device widths", () => {
    const srcSet = buildSrcSet("https://cdn.example.com/car.jpg")
    for (const w of DEVICE_SIZES) {
      expect(srcSet).toContain(`${w}w`)
    }
  })

  it("encodes the source URL", () => {
    const srcSet = buildSrcSet("https://cdn.example.com/car photo.jpg")
    expect(srcSet).toContain(encodeURIComponent("https://cdn.example.com/car photo.jpg"))
  })
})
