import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import imgixLoader, { getImageFormat } from "@/lib/imgix-loader"

describe("getImageFormat", () => {
  it("returns avif when AVIF is in Accept", () => {
    expect(getImageFormat("image/avif,image/webp,*/*")).toBe("avif")
  })

  it("returns webp when WebP is in Accept (no AVIF)", () => {
    expect(getImageFormat("image/webp,*/*")).toBe("webp")
  })

  it("returns jpeg when neither is supported", () => {
    expect(getImageFormat("text/html,*/*")).toBe("jpeg")
    expect(getImageFormat("")).toBe("jpeg")
  })
})

describe("imgixLoader", () => {
  it("passes through placeholder + data URLs unchanged", () => {
    expect(imgixLoader({ src: "/placeholder.svg", width: 100 })).toBe(
      "/placeholder.svg"
    )
    expect(imgixLoader({ src: "data:image/png;base64,abc", width: 100 })).toBe(
      "data:image/png;base64,abc"
    )
  })

  it("returns src unchanged when NEXT_PUBLIC_IMGIX_DOMAIN is not set", () => {
    expect(imgixLoader({ src: "/cars/foo.jpg", width: 400 })).toBe(
      "/cars/foo.jpg"
    )
    expect(imgixLoader({ src: "https://example.com/foo.jpg", width: 200 })).toBe(
      "https://example.com/foo.jpg"
    )
  })

  it("applies the adaptive quality cap when rewriting an imgix URL", () => {
    const small = imgixLoader({
      src: "https://x.imgix.net/x.jpg",
      width: 300,
      quality: 90,
    })
    const desktop = imgixLoader({
      src: "https://x.imgix.net/x.jpg",
      width: 1600,
      quality: 90,
    })
    expect(small).toContain("q=65")
    expect(desktop).toContain("q=85")
  })
})

describe("imgixLoader with NEXT_PUBLIC_IMGIX_DOMAIN configured", () => {
  let loader: typeof imgixLoader

  beforeEach(async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_IMGIX_DOMAIN = "test.imgix.net"
    const mod = await import("@/lib/imgix-loader")
    loader = mod.default
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_IMGIX_DOMAIN
  })

  it("rewrites local paths through imgix", () => {
    const result = loader({ src: "/cars/foo.jpg", width: 400 })
    expect(result).toContain("https://test.imgix.net/cars/foo.jpg")
    expect(result).toContain("w=400")
    expect(result).toContain("auto=format%2Ccompress")
    expect(result).toContain("chromasub=444")
  })

  it("handles local path without leading slash", () => {
    const result = loader({ src: "cars/foo.jpg", width: 400 })
    expect(result).toContain("https://test.imgix.net/cars/foo.jpg")
  })

  it("proxies HomenetIOL external URLs through imgix", () => {
    const result = loader({
      src: "https://content.homenetiol.com/2000001/2192x1460/abc.jpg",
      width: 600,
    })
    expect(result).toContain("https://test.imgix.net/")
    expect(result).toContain("content.homenetiol.com")
    expect(result).toContain("w=600")
  })

  it("proxies photos.homenetiol.com through imgix", () => {
    const result = loader({
      src: "https://photos.homenetiol.com/abc/123.jpg",
      width: 800,
    })
    expect(result).toContain("https://test.imgix.net/")
    expect(result).toContain("photos.homenetiol.com")
  })

  it("proxies other external URLs through imgix", () => {
    const result = loader({
      src: "https://cdn.sanity.io/images/abc/production/img.jpg",
      width: 1200,
    })
    expect(result).toContain("https://test.imgix.net/")
    expect(result).toContain("cdn.sanity.io")
    expect(result).toContain("w=1200")
  })

  it("still passes through Vercel Blob URLs directly", () => {
    const url = "https://abc.public.blob.vercel-storage.com/foo.jpg"
    expect(loader({ src: url, width: 200 })).toBe(url)
  })

  it("still passes through placeholder/data URLs", () => {
    expect(loader({ src: "/placeholder.svg", width: 100 })).toBe(
      "/placeholder.svg"
    )
    expect(loader({ src: "data:image/gif;base64,R0", width: 100 })).toBe(
      "data:image/gif;base64,R0"
    )
  })

  it("rewrites existing imgix URLs with updated params", () => {
    const result = loader({
      src: "https://existing.imgix.net/foo.jpg?w=10",
      width: 800,
      quality: 80,
    })
    expect(result).toContain("imgix.net")
    expect(result).toContain("w=800")
    expect(result).toContain("auto=format%2Ccompress")
  })

  it("uses adaptive quality tiers (thumbnail → q65, mobile → q72)", () => {
    const thumb = loader({ src: "/hero.jpg", width: 300, quality: 80 })
    expect(thumb).toContain("q=65")

    const mobile = loader({ src: "/hero.jpg", width: 700, quality: 80 })
    expect(mobile).toContain("q=72")

    const tablet = loader({ src: "/hero.jpg", width: 1000, quality: 80 })
    expect(tablet).toContain("q=80")

    const desktop = loader({ src: "/hero.jpg", width: 1500, quality: 80 })
    expect(desktop).toContain("q=85")
  })
})
