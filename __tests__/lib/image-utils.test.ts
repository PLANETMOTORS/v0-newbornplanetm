import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const original: { NEXT_PUBLIC_IMAGE_BASE_URL?: string } = {}

beforeEach(() => {
  original.NEXT_PUBLIC_IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL
  delete process.env.NEXT_PUBLIC_IMAGE_BASE_URL
  vi.resetModules()
})

afterEach(() => {
  if (original.NEXT_PUBLIC_IMAGE_BASE_URL === undefined)
    delete process.env.NEXT_PUBLIC_IMAGE_BASE_URL
  else process.env.NEXT_PUBLIC_IMAGE_BASE_URL = original.NEXT_PUBLIC_IMAGE_BASE_URL
})

describe("getOptimizedImageUrl", () => {
  it("uses default base URL when env var is unset", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = getOptimizedImageUrl("vehicles/v1/img.jpg")
    expect(url).toMatch(/^https:\/\/images\.planetmotors\.com\/vehicles\/v1\/img\.jpg\?/)
  })

  it("respects NEXT_PUBLIC_IMAGE_BASE_URL", async () => {
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com"
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = getOptimizedImageUrl("a.jpg")
    expect(url.startsWith("https://cdn.example.com/a.jpg")).toBe(true)
  })

  it("includes width, height, quality, fit when provided", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOptimizedImageUrl("a.jpg", { width: 800, height: 600, quality: 90, fit: "max" }))
    expect(url.searchParams.get("w")).toBe("800")
    expect(url.searchParams.get("h")).toBe("600")
    expect(url.searchParams.get("q")).toBe("90")
    expect(url.searchParams.get("fit")).toBe("max")
  })

  it("uses default quality 80 when not provided", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOptimizedImageUrl("a.jpg"))
    expect(url.searchParams.get("q")).toBe("80")
  })

  it("uses default fit 'crop' when not provided", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOptimizedImageUrl("a.jpg"))
    expect(url.searchParams.get("fit")).toBe("crop")
  })

  it("sets fm=avif by default", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOptimizedImageUrl("a.jpg"))
    expect(url.searchParams.get("fm")).toBe("avif")
  })

  it("omits fm when format='auto'", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOptimizedImageUrl("a.jpg", { format: "auto" }))
    expect(url.searchParams.get("fm")).toBe(null)
  })

  it("emits 'auto' query string when default ['format','compress']", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOptimizedImageUrl("a.jpg"))
    expect(url.searchParams.get("auto")).toBe("format,compress")
  })

  it("omits 'auto' when array is empty", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOptimizedImageUrl("a.jpg", { auto: [] }))
    expect(url.searchParams.get("auto")).toBe(null)
  })

  it("includes dpr and blur when provided", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOptimizedImageUrl("a.jpg", { dpr: 2, blur: 5 }))
    expect(url.searchParams.get("dpr")).toBe("2")
    expect(url.searchParams.get("blur")).toBe("5")
  })

  it("does not include dpr/blur when 0 (falsy)", async () => {
    const { getOptimizedImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOptimizedImageUrl("a.jpg", { dpr: 0, blur: 0 }))
    expect(url.searchParams.get("dpr")).toBe(null)
    expect(url.searchParams.get("blur")).toBe(null)
  })
})

describe("getSpinFrameUrl", () => {
  it("zero-pads frame number to 3 digits", async () => {
    const { getSpinFrameUrl } = await import("@/lib/image-utils")
    expect(getSpinFrameUrl("v1", 5)).toMatch(/spin\/005\.jpg/)
    expect(getSpinFrameUrl("v1", 35)).toMatch(/spin\/035\.jpg/)
  })

  it("uses thumbnail dimensions when options.thumbnail=true", async () => {
    const { getSpinFrameUrl } = await import("@/lib/image-utils")
    const url = new URL(getSpinFrameUrl("v1", 0, { thumbnail: true }))
    expect(url.searchParams.get("w")).toBe("400")
    expect(url.searchParams.get("h")).toBe("267")
    expect(url.searchParams.get("blur")).toBe("20")
  })

  it("uses mobile dimensions when options.mobile=true", async () => {
    const { getSpinFrameUrl } = await import("@/lib/image-utils")
    const url = new URL(getSpinFrameUrl("v1", 0, { mobile: true }))
    expect(url.searchParams.get("w")).toBe("800")
    expect(url.searchParams.get("h")).toBe("533")
  })

  it("uses desktop dimensions by default", async () => {
    const { getSpinFrameUrl } = await import("@/lib/image-utils")
    const url = new URL(getSpinFrameUrl("v1", 0))
    expect(url.searchParams.get("w")).toBe("1200")
    expect(url.searchParams.get("h")).toBe("800")
  })
})

describe("getAllSpinFrameUrls", () => {
  it("returns 36 frames by default", async () => {
    const { getAllSpinFrameUrls } = await import("@/lib/image-utils")
    expect(getAllSpinFrameUrls("v1").length).toBe(36)
  })

  it("respects custom frameCount", async () => {
    const { getAllSpinFrameUrls } = await import("@/lib/image-utils")
    expect(getAllSpinFrameUrls("v1", 10).length).toBe(10)
  })

  it("respects mobile option", async () => {
    const { getAllSpinFrameUrls } = await import("@/lib/image-utils")
    const urls = getAllSpinFrameUrls("v1", 2, { mobile: true })
    expect(new URL(urls[0]).searchParams.get("w")).toBe("800")
  })
})

describe("getPrioritySpinFrames", () => {
  it("returns 4 priority frames at 0/9/18/27", async () => {
    const { getPrioritySpinFrames } = await import("@/lib/image-utils")
    const urls = getPrioritySpinFrames("v1")
    expect(urls.length).toBe(4)
    expect(urls[0]).toMatch(/spin\/000\.jpg/)
    expect(urls[1]).toMatch(/spin\/009\.jpg/)
    expect(urls[2]).toMatch(/spin\/018\.jpg/)
    expect(urls[3]).toMatch(/spin\/027\.jpg/)
  })
})

describe("getInventoryCardUrl", () => {
  it("returns standard size by default", async () => {
    const { getInventoryCardUrl } = await import("@/lib/image-utils")
    const url = new URL(getInventoryCardUrl("v1"))
    expect(url.searchParams.get("w")).toBe("600")
    expect(url.searchParams.get("h")).toBe("400")
    expect(url.searchParams.get("q")).toBe("80")
  })

  it("returns retina size when retina=true", async () => {
    const { getInventoryCardUrl } = await import("@/lib/image-utils")
    const url = new URL(getInventoryCardUrl("v1", true))
    expect(url.searchParams.get("w")).toBe("1200")
    expect(url.searchParams.get("h")).toBe("800")
    expect(url.searchParams.get("q")).toBe("75")
  })
})

describe("getResponsiveSrcSet", () => {
  it("returns srcset with default 4 widths", async () => {
    const { getResponsiveSrcSet } = await import("@/lib/image-utils")
    const srcset = getResponsiveSrcSet("a.jpg")
    expect(srcset.split(",").length).toBe(4)
    expect(srcset).toMatch(/400w/)
    expect(srcset).toMatch(/1600w/)
  })

  it("respects custom widths", async () => {
    const { getResponsiveSrcSet } = await import("@/lib/image-utils")
    const srcset = getResponsiveSrcSet("a.jpg", [320, 640])
    expect(srcset.split(",").length).toBe(2)
    expect(srcset).toMatch(/320w/)
  })
})

describe("getOgImageUrl", () => {
  it("returns 1200x630 jpg image", async () => {
    const { getOgImageUrl } = await import("@/lib/image-utils")
    const url = new URL(getOgImageUrl("v1"))
    expect(url.searchParams.get("w")).toBe("1200")
    expect(url.searchParams.get("h")).toBe("630")
    expect(url.searchParams.get("fm")).toBe("jpg")
    expect(url.searchParams.get("q")).toBe("90")
  })
})

describe("preloadImage", () => {
  it("resolves with the loaded image", async () => {
    class FakeImage {
      onload: (() => void) | null = null
      onerror: ((err?: unknown) => void) | null = null
      crossOrigin = ""
      _src = ""
      get src() { return this._src }
      set src(v: string) {
        this._src = v
        // simulate async load
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal("Image", FakeImage as unknown as typeof Image)

    const { preloadImage } = await import("@/lib/image-utils")
    const img = await preloadImage("https://x.com/a.jpg")
    expect(img).toBeDefined()
    expect((img as unknown as { _src: string })._src).toBe("https://x.com/a.jpg")
    expect((img as unknown as { crossOrigin: string }).crossOrigin).toBe("anonymous")
  })

  it("rejects when the image errors", async () => {
    class FakeImage {
      onload: (() => void) | null = null
      onerror: ((err?: unknown) => void) | null = null
      crossOrigin = ""
      _src = ""
      get src() { return this._src }
      set src(v: string) {
        this._src = v
        queueMicrotask(() => this.onerror?.(new Error("load fail")))
      }
    }
    vi.stubGlobal("Image", FakeImage as unknown as typeof Image)
    const { preloadImage } = await import("@/lib/image-utils")
    await expect(preloadImage("https://x.com/a.jpg")).rejects.toBeDefined()
  })
})

describe("preloadImages", () => {
  it("preloads all and reports progress", async () => {
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      crossOrigin = ""
      _src = ""
      get src() { return this._src }
      set src(v: string) {
        this._src = v
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal("Image", FakeImage as unknown as typeof Image)
    const { preloadImages } = await import("@/lib/image-utils")
    const progress: Array<[number, number]> = []
    const imgs = await preloadImages(["a", "b", "c"], (l, t) => progress.push([l, t]))
    expect(imgs.length).toBe(3)
    expect(progress.length).toBe(3)
    expect(progress.at(-1)).toEqual([3, 3])
  })

  it("works without progress callback", async () => {
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      crossOrigin = ""
      _src = ""
      get src() { return this._src }
      set src(v: string) {
        this._src = v
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal("Image", FakeImage as unknown as typeof Image)
    const { preloadImages } = await import("@/lib/image-utils")
    const imgs = await preloadImages(["a"])
    expect(imgs.length).toBe(1)
  })
})

describe("supportsAVIF", () => {
  it("returns false in non-window environments", async () => {
    vi.stubGlobal("window", undefined)
    const { supportsAVIF } = await import("@/lib/image-utils")
    expect(await supportsAVIF()).toBe(false)
  })

  it("returns true when image loads (browser supports avif)", async () => {
    vi.stubGlobal("window", {} as unknown as Window)
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      _src = ""
      get src() { return this._src }
      set src(v: string) {
        this._src = v
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal("Image", FakeImage as unknown as typeof Image)
    const { supportsAVIF } = await import("@/lib/image-utils")
    expect(await supportsAVIF()).toBe(true)
  })

  it("returns false when image errors (browser lacks avif)", async () => {
    vi.stubGlobal("window", {} as unknown as Window)
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      _src = ""
      get src() { return this._src }
      set src(v: string) {
        this._src = v
        queueMicrotask(() => this.onerror?.())
      }
    }
    vi.stubGlobal("Image", FakeImage as unknown as typeof Image)
    const { supportsAVIF } = await import("@/lib/image-utils")
    expect(await supportsAVIF()).toBe(false)
  })
})
