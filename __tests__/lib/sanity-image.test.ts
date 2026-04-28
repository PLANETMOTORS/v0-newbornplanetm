import { describe, expect, it } from "vitest"
import {
  blogCoverImage,
  inventoryCardImage,
  lenderLogoImage,
  ogImage,
  sanityImage,
  vdpHeroImage,
  vdpThumbImage,
} from "@/lib/sanity/image"

const SANITY = "https://cdn.sanity.io/images/abc/dataset/img-1.jpg"
const EXTERNAL = "https://example.com/photo.jpg"

function paramsOf(url: string): URLSearchParams {
  const idx = url.indexOf("?")
  if (idx === -1) return new URLSearchParams()
  return new URLSearchParams(url.slice(idx + 1))
}

describe("lib/sanity/image sanityImage — base behaviour", () => {
  it("returns an empty string when url is null", () => {
    expect(sanityImage(null)).toBe("")
  })

  it("returns an empty string when url is undefined", () => {
    expect(sanityImage(undefined)).toBe("")
  })

  it("returns an empty string when url is empty", () => {
    expect(sanityImage("")).toBe("")
  })

  it("returns external URLs unchanged (only transforms cdn.sanity.io)", () => {
    expect(sanityImage(EXTERNAL, { w: 800 })).toBe(EXTERNAL)
  })

  it("appends ?q=80&fit=max&auto=format by default for a Sanity URL", () => {
    const out = sanityImage(SANITY)
    const p = paramsOf(out)
    expect(p.get("q")).toBe("80")
    expect(p.get("fit")).toBe("max")
    expect(p.get("auto")).toBe("format")
    expect(p.get("fm")).toBeNull()
  })

  it("uses '&' separator when the URL already contains a query string", () => {
    const withQuery = `${SANITY}?rect=10,10,100,100`
    const out = sanityImage(withQuery, { w: 100 })
    expect(out.startsWith(`${SANITY}?rect=10,10,100,100&`)).toBe(true)
  })

  it("uses '?' separator when the URL has no query string", () => {
    const out = sanityImage(SANITY, { w: 100 })
    expect(out.indexOf("?")).toBeGreaterThan(-1)
    expect(out.indexOf("?")).toBe(SANITY.length)
  })
})

describe("lib/sanity/image sanityImage — option matrix", () => {
  it("emits w/h when provided", () => {
    const p = paramsOf(sanityImage(SANITY, { w: 320, h: 240 }))
    expect(p.get("w")).toBe("320")
    expect(p.get("h")).toBe("240")
  })

  it("does NOT emit w/h when omitted", () => {
    const p = paramsOf(sanityImage(SANITY))
    expect(p.get("w")).toBeNull()
    expect(p.get("h")).toBeNull()
  })

  it("respects explicit q override", () => {
    expect(paramsOf(sanityImage(SANITY, { q: 50 })).get("q")).toBe("50")
  })

  it("respects explicit fit override", () => {
    expect(paramsOf(sanityImage(SANITY, { fit: "crop" })).get("fit")).toBe("crop")
  })

  it("emits fm and SUPPRESSES auto=format when an explicit format is requested", () => {
    const p = paramsOf(sanityImage(SANITY, { fm: "png" }))
    expect(p.get("fm")).toBe("png")
    expect(p.get("auto")).toBeNull()
  })

  it("emits blur when provided (and skips when 0/undefined)", () => {
    expect(paramsOf(sanityImage(SANITY, { blur: 10 })).get("blur")).toBe("10")
    expect(paramsOf(sanityImage(SANITY, { blur: 0 })).get("blur")).toBeNull()
    expect(paramsOf(sanityImage(SANITY)).get("blur")).toBeNull()
  })

  it("emits dpr when provided (and skips when 0/undefined)", () => {
    expect(paramsOf(sanityImage(SANITY, { dpr: 2 })).get("dpr")).toBe("2")
    expect(paramsOf(sanityImage(SANITY, { dpr: 0 })).get("dpr")).toBeNull()
    expect(paramsOf(sanityImage(SANITY)).get("dpr")).toBeNull()
  })
})

describe("lib/sanity/image presets", () => {
  it("inventoryCardImage → 600×400 crop", () => {
    const p = paramsOf(inventoryCardImage(SANITY))
    expect(p.get("w")).toBe("600")
    expect(p.get("h")).toBe("400")
    expect(p.get("fit")).toBe("crop")
  })

  it("vdpHeroImage → 1200×800 crop", () => {
    const p = paramsOf(vdpHeroImage(SANITY))
    expect(p.get("w")).toBe("1200")
    expect(p.get("h")).toBe("800")
    expect(p.get("fit")).toBe("crop")
  })

  it("vdpThumbImage → 200×133 crop, q=70", () => {
    const p = paramsOf(vdpThumbImage(SANITY))
    expect(p.get("w")).toBe("200")
    expect(p.get("h")).toBe("133")
    expect(p.get("q")).toBe("70")
  })

  it("blogCoverImage → 800×450 crop", () => {
    const p = paramsOf(blogCoverImage(SANITY))
    expect(p.get("w")).toBe("800")
    expect(p.get("h")).toBe("450")
    expect(p.get("fit")).toBe("crop")
  })

  it("ogImage → 1200×630 jpg q=90", () => {
    const p = paramsOf(ogImage(SANITY))
    expect(p.get("w")).toBe("1200")
    expect(p.get("h")).toBe("630")
    expect(p.get("fm")).toBe("jpg")
    expect(p.get("q")).toBe("90")
  })

  it("lenderLogoImage → 200w png with fit=max", () => {
    const p = paramsOf(lenderLogoImage(SANITY))
    expect(p.get("w")).toBe("200")
    expect(p.get("fit")).toBe("max")
    expect(p.get("fm")).toBe("png")
  })

  it("presets return empty string for null URLs", () => {
    expect(inventoryCardImage(null)).toBe("")
    expect(vdpHeroImage(undefined)).toBe("")
    expect(vdpThumbImage("")).toBe("")
    expect(blogCoverImage(null)).toBe("")
    expect(ogImage(undefined)).toBe("")
    expect(lenderLogoImage("")).toBe("")
  })
})
