import { describe, it, expect, vi } from "vitest"
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

  it("passes through Vercel Blob URLs unchanged", () => {
    const url = "https://abc.public.blob.vercel-storage.com/foo.jpg"
    expect(imgixLoader({ src: url, width: 200 })).toBe(url)
  })

  it("passes through other external https URLs unchanged", () => {
    const url = "https://example.com/foo.jpg"
    expect(imgixLoader({ src: url, width: 200 })).toBe(url)
  })

  it("rewrites existing imgix URLs with the new params", () => {
    const out = imgixLoader({
      src: "https://existing.imgix.net/foo.jpg?w=10",
      width: 800,
      quality: 80,
    })
    expect(out).toContain("imgix.net")
    expect(out).toContain("w=800")
    expect(out).toContain("auto=format%2Ccompress")
  })

  it("falls back to local path when imgix domain is not configured", () => {
    expect(imgixLoader({ src: "/cars/foo.jpg", width: 400 })).toBe(
      "/cars/foo.jpg"
    )
  })

  it("rewrites local path through custom imgix domain when configured", async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_IMGIX_DOMAIN = "custom-cdn.imgix.net"
    const mod = await import("@/lib/imgix-loader")
    const result = mod.default({ src: "/cars/foo.jpg", width: 400 })
    expect(result).toContain("https://custom-cdn.imgix.net/cars/foo.jpg")
    expect(result).toContain("w=400")
    delete process.env.NEXT_PUBLIC_IMGIX_DOMAIN
  })

  it("handles local path without leading slash", async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_IMGIX_DOMAIN = "custom-cdn.imgix.net"
    const mod = await import("@/lib/imgix-loader")
    const result = mod.default({ src: "cars/foo.jpg", width: 400 })
    expect(result).toContain("https://custom-cdn.imgix.net/cars/foo.jpg")
    delete process.env.NEXT_PUBLIC_IMGIX_DOMAIN
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
