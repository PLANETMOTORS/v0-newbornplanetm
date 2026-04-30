import { describe, expect, it } from "vitest"
import {
  generateSEOMetadata,
  generateVehicleMetadata,
  generateArticleMetadata,
  pageMetadata,
} from "@/lib/seo/metadata"

describe("generateSEOMetadata", () => {
  it("uses 'Used EVs Canada — ...' title for the home page", () => {
    const m = generateSEOMetadata({ title: "Home" })
    expect(m.title).toMatch(/^Used EVs Canada — Aviloo Battery-Certified \| Planet Motors$/)
  })

  it("appends ' | Planet Motors' to non-home titles", () => {
    const m = generateSEOMetadata({ title: "About" })
    expect(m.title).toBe("About | Planet Motors")
  })

  it("uses default description and keywords when not specified", () => {
    const m = generateSEOMetadata({ title: "X" })
    expect(m.description).toMatch(/Aviloo battery health/)
    expect(m.keywords).toContain("used EVs Canada")
    expect(m.keywords).toContain("OMVIC licensed")
  })

  it("merges custom keywords with defaults", () => {
    const m = generateSEOMetadata({ title: "X", keywords: ["custom-key"] })
    expect(m.keywords).toContain("custom-key")
    expect(m.keywords).toContain("used EVs Canada")
  })

  it("constructs canonical URL from path", () => {
    const m = generateSEOMetadata({ title: "X", path: "/foo/bar" })
    expect(m.alternates?.canonical).toMatch(/\/foo\/bar$/)
    expect(m.alternates?.languages?.["en-CA"]).toMatch(/\/foo\/bar$/)
  })

  it("uses absolute image URL when provided as http(s)", () => {
    const m = generateSEOMetadata({ title: "X", image: "https://cdn.example.com/img.jpg" })
    expect(m.openGraph?.images).toEqual([
      expect.objectContaining({ url: "https://cdn.example.com/img.jpg" }),
    ])
    expect(m.twitter?.images).toEqual(["https://cdn.example.com/img.jpg"])
  })

  it("prepends BASE_URL when image is a relative path", () => {
    const m = generateSEOMetadata({ title: "X", image: "/foo.png" })
    const ogImg = (m.openGraph?.images as Array<{ url: string }>)[0]
    expect(ogImg.url).toMatch(/\/foo\.png$/)
    expect(ogImg.url).toMatch(/^https?:\/\//)
  })

  it("emits robots directive that blocks indexing when noIndex=true", () => {
    const m = generateSEOMetadata({ title: "X", noIndex: true })
    expect(m.robots).toEqual({ index: false, follow: false })
  })

  it("emits googleBot config that allows indexing by default", () => {
    const m = generateSEOMetadata({ title: "X" })
    expect(m.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: expect.objectContaining({ index: true, follow: true, "max-snippet": -1 }),
    })
  })

  it("sets formatDetection flags to true", () => {
    const m = generateSEOMetadata({ title: "X" })
    expect(m.formatDetection).toEqual({ telephone: true, email: true, address: true })
  })

  it("sets twitter card to summary_large_image with creator", () => {
    const m = generateSEOMetadata({ title: "X" })
    expect(m.twitter?.card).toBe("summary_large_image")
    expect(m.twitter?.creator).toBe("@planetmotors")
  })

  it("openGraph.locale is en_CA, type 'website'", () => {
    const m = generateSEOMetadata({ title: "X" })
    expect(m.openGraph?.locale).toBe("en_CA")
    expect(m.openGraph?.type).toBe("website")
    expect((m.openGraph?.images as Array<{ width: number; height: number }>)[0]).toMatchObject({
      width: 1200,
      height: 630,
    })
  })

  it("defaults openGraph image to the branded /brand/og-image.png", () => {
    const m = generateSEOMetadata({ title: "X" })
    const ogImg = (m.openGraph?.images as Array<{ url: string }>)[0]
    expect(ogImg.url).toMatch(/\/brand\/og-image\.png$/)
  })
})

describe("pageMetadata", () => {
  it("contains all expected keys", () => {
    expect(Object.keys(pageMetadata).sort()).toEqual(
      [
        "about",
        "blog",
        "contact",
        "delivery",
        "evBatteryHealth",
        "faq",
        "financing",
        "home",
        "inventory",
        "protectionPlans",
        "tradeIn",
      ].sort(),
    )
  })

  it("home metadata uses the 'Used EVs Canada' title", () => {
    expect(pageMetadata.home.title).toMatch(/Used EVs Canada/)
  })

  it("inventory canonical points to /inventory", () => {
    expect(pageMetadata.inventory.alternates?.canonical).toMatch(/\/inventory$/)
  })

  it("contact metadata embeds the dealership address and phone", () => {
    expect(pageMetadata.contact.description).toMatch(/Major Mackenzie/)
    expect(pageMetadata.contact.description).toMatch(/1-866-797-3332/)
  })
})

describe("generateVehicleMetadata", () => {
  const vehicle = {
    id: "v1",
    year: 2024,
    make: "Toyota",
    model: "Camry",
    trim: "LE",
    price: 28000,
    mileage: 12345,
    image: "/img/v1.jpg",
  }

  it("builds title from year/make/model/trim and trims trailing space", () => {
    const m = generateVehicleMetadata(vehicle)
    expect(m.title).toBe("2024 Toyota Camry LE | Planet Motors")
  })

  it("omits trim cleanly when missing", () => {
    const m = generateVehicleMetadata({ ...vehicle, trim: undefined })
    expect(m.title).toBe("2024 Toyota Camry | Planet Motors")
  })

  it("auto-generates description with mileage and price when description is missing", () => {
    const m = generateVehicleMetadata(vehicle)
    expect(m.description).toMatch(/12,345 km/)
    expect(m.description).toMatch(/\$28,000/)
    expect(m.description).toMatch(/CARFAX/)
  })

  it("uses provided description when available", () => {
    const m = generateVehicleMetadata({ ...vehicle, description: "custom desc" })
    expect(m.description).toBe("custom desc")
  })

  it("canonical url contains /vehicles/{id}", () => {
    const m = generateVehicleMetadata(vehicle)
    expect(m.alternates?.canonical).toMatch(/\/vehicles\/v1$/)
  })

  it("includes make/model in keywords", () => {
    const m = generateVehicleMetadata(vehicle)
    expect(m.keywords).toContain("Toyota")
    expect(m.keywords).toContain("Camry")
    expect(m.keywords).toContain("2024 Toyota")
    expect(m.keywords).toContain("used Toyota Camry")
  })
})

describe("generateArticleMetadata", () => {
  const article = {
    title: "Top 10 EVs",
    slug: "top-10-evs",
    excerpt: "A list of the best EVs",
    coverImage: "/img/cover.jpg",
    publishedAt: "2024-01-15T00:00:00Z",
  }

  it("changes openGraph.type to 'article'", () => {
    const m = generateArticleMetadata(article)
    expect(m.openGraph?.type).toBe("article")
  })

  it("attaches publishedTime from input", () => {
    const m = generateArticleMetadata(article)
    expect((m.openGraph as { publishedTime?: string }).publishedTime).toBe(article.publishedAt)
  })

  it("uses Planet Motors as author when none specified", () => {
    const m = generateArticleMetadata(article)
    expect((m.openGraph as { authors?: string[] }).authors).toEqual(["Planet Motors"])
  })

  it("uses custom author when specified", () => {
    const m = generateArticleMetadata({ ...article, author: "Jane Doe" })
    expect((m.openGraph as { authors?: string[] }).authors).toEqual(["Jane Doe"])
  })

  it("canonical points to /blog/{slug}", () => {
    const m = generateArticleMetadata(article)
    expect(m.alternates?.canonical).toMatch(/\/blog\/top-10-evs$/)
  })

  it("description is the article excerpt", () => {
    const m = generateArticleMetadata(article)
    expect(m.description).toBe(article.excerpt)
  })
})
