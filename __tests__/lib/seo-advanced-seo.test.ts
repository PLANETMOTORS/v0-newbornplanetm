import { describe, expect, it } from "vitest"
import {
  BASE_URL,
  DOMAIN,
  blogTopics,
  generateEventSchema,
  generateHowToSchema,
  generateLocationSlugs,
  generateProductAggregateSchema,
  generateReviewSchema,
  generateServiceSchema,
  generateVideoSchema,
  geoKeywords,
  keywordClusters,
  keywordOpportunities,
  performanceOptimizations,
} from "@/lib/seo/advanced-seo"

describe("lib/seo/advanced-seo constants", () => {
  it("exposes the production domain and base URL", () => {
    expect(DOMAIN).toBe("www.planetmotors.ca")
    expect(BASE_URL).toBe("https://www.planetmotors.ca")
  })

  it("groups keywords into the expected buyer clusters", () => {
    expect(Object.keys(keywordClusters)).toEqual([
      "evBuyers",
      "luxuryBuyers",
      "valueSeeker",
      "financing",
      "tradeIn",
      "delivery",
    ])
    for (const list of Object.values(keywordClusters)) {
      expect(Array.isArray(list)).toBe(true)
      expect(list.length).toBeGreaterThan(0)
    }
  })

  it("groups geo keywords into primary/secondary/provincial/national", () => {
    expect(geoKeywords.primary).toContain("Toronto")
    expect(geoKeywords.secondary).toContain("Markham")
    expect(geoKeywords.provincial).toContain("Quebec")
    expect(geoKeywords.national).toContain("Canada")
  })

  it("exposes a non-empty list of high-value keyword opportunities", () => {
    expect(keywordOpportunities.length).toBeGreaterThan(0)
  })

  it("exposes blog topics across all four guide categories", () => {
    expect(Object.keys(blogTopics)).toEqual([
      "evGuides",
      "buyingGuides",
      "financingGuides",
      "tradeInGuides",
    ])
  })

  it("locks performance optimization recommendations", () => {
    expect(performanceOptimizations.images.format).toBe("webp")
    expect(performanceOptimizations.fonts.display).toBe("swap")
    expect(performanceOptimizations.scripts.async).toContain("gtm")
  })
})

describe("lib/seo/advanced-seo generateLocationSlugs", () => {
  it("generates a city × category cartesian product", () => {
    const slugs = generateLocationSlugs()
    // 15 cities × 4 categories
    expect(slugs).toHaveLength(15 * 4)
  })

  it("produces well-formed paths starting with /<category>/<city>", () => {
    const slugs = generateLocationSlugs()
    for (const s of slugs) {
      expect(s.startsWith("/")).toBe(true)
      expect(s.split("/")).toHaveLength(3)
    }
  })

  it("includes specific known combinations", () => {
    const slugs = generateLocationSlugs()
    expect(slugs).toContain("/used-cars/toronto")
    expect(slugs).toContain("/electric-vehicles/montreal")
    expect(slugs).toContain("/car-financing/calgary")
    expect(slugs).toContain("/trade-in/edmonton")
  })

  it("produces no duplicates", () => {
    const slugs = generateLocationSlugs()
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe("lib/seo/advanced-seo generateProductAggregateSchema", () => {
  it("emits a JSON-LD ItemList with offer + aggregateRating", () => {
    const schema = generateProductAggregateSchema({
      totalCount: 250,
      minPrice: 9_999,
      maxPrice: 99_999,
      avgRating: 4.7,
      reviewCount: 1_234,
    })
    expect(schema["@context"]).toBe("https://schema.org")
    expect(schema["@type"]).toBe("ItemList")
    expect(schema.numberOfItems).toBe(250)
    expect(schema.url).toBe(`${BASE_URL}/inventory`)
    expect(schema.offers.lowPrice).toBe(9_999)
    expect(schema.offers.highPrice).toBe(99_999)
    expect(schema.offers.priceCurrency).toBe("CAD")
    expect(schema.aggregateRating.ratingValue).toBe(4.7)
    expect(schema.aggregateRating.reviewCount).toBe(1_234)
    expect(schema.aggregateRating.bestRating).toBe(5)
    expect(schema.aggregateRating.worstRating).toBe(1)
  })

  it("interpolates totalCount into the description", () => {
    const schema = generateProductAggregateSchema({
      totalCount: 7,
      minPrice: 1,
      maxPrice: 2,
      avgRating: 5,
      reviewCount: 3,
    })
    expect(schema.description).toContain("7+")
  })
})

describe("lib/seo/advanced-seo generateVideoSchema", () => {
  it("emits a VideoObject with the correct embedUrl built from BASE_URL + vehicleId", () => {
    const schema = generateVideoSchema({
      name: "2023 Tesla Model 3 walkaround",
      description: "360° tour",
      thumbnailUrl: "https://img.example.com/thumb.jpg",
      uploadDate: "2026-04-01",
      duration: "PT3M21S",
      contentUrl: "https://video.example.com/v.mp4",
      vehicleId: "veh-123",
    })
    expect(schema["@type"]).toBe("VideoObject")
    expect(schema.embedUrl).toBe(`${BASE_URL}/vehicles/veh-123#video`)
    expect(schema.publisher.name).toBe("Planet Motors")
    expect(schema.publisher.logo.url).toBe(`${BASE_URL}/images/planet-motors-logo.png`)
  })
})

describe("lib/seo/advanced-seo generateReviewSchema", () => {
  it("returns one schema entry per review", () => {
    const out = generateReviewSchema([
      { author: "Alice", datePublished: "2026-04-01", reviewBody: "Great!", ratingValue: 5 },
      { author: "Bob", datePublished: "2026-04-02", reviewBody: "Good", ratingValue: 4, vehiclePurchased: "Model 3" },
    ])
    expect(out).toHaveLength(2)
    expect(out[0].author.name).toBe("Alice")
    expect(out[0].reviewRating.ratingValue).toBe(5)
    expect(out[0].itemReviewed.url).toBe(BASE_URL)
    expect(out[1].author.name).toBe("Bob")
  })

  it("returns an empty array when given no reviews", () => {
    expect(generateReviewSchema([])).toEqual([])
  })
})

describe("lib/seo/advanced-seo generateHowToSchema", () => {
  it("emits HowToStep entries with 1-based positions", () => {
    const schema = generateHowToSchema({
      name: "Trade-in 101",
      description: "How to maximize value",
      totalTime: "PT15M",
      steps: [
        { name: "Step A", text: "Do A", image: "https://img/a.png" },
        { name: "Step B", text: "Do B" },
      ],
    })
    expect(schema["@type"]).toBe("HowTo")
    expect(schema.totalTime).toBe("PT15M")
    expect(schema.step).toHaveLength(2)
    expect(schema.step[0].position).toBe(1)
    expect(schema.step[0].image).toBe("https://img/a.png")
    expect(schema.step[1].position).toBe(2)
    expect(schema.step[1].image).toBeUndefined()
  })

  it("supports omitted totalTime", () => {
    const schema = generateHowToSchema({
      name: "x",
      description: "y",
      steps: [{ name: "s", text: "t" }],
    })
    expect(schema.totalTime).toBeUndefined()
  })
})

describe("lib/seo/advanced-seo generateServiceSchema", () => {
  it("emits a Service schema with all four offerings", () => {
    const s = generateServiceSchema()
    expect(s["@type"]).toBe("Service")
    expect(s.areaServed.name).toBe("Canada")
    expect(s.hasOfferCatalog.itemListElement).toHaveLength(4)
    const names = s.hasOfferCatalog.itemListElement.map((o: { itemOffered: { name: string } }) => o.itemOffered.name)
    expect(names).toEqual([
      "Vehicle Sales",
      "Auto Financing",
      "Trade-In Valuation",
      "Nationwide Delivery",
    ])
  })
})

describe("lib/seo/advanced-seo generateEventSchema", () => {
  it("emits SaleEvent with offers when offers payload is provided", () => {
    const s = generateEventSchema({
      name: "Spring Sale",
      description: "Big discounts",
      startDate: "2026-05-01",
      endDate: "2026-05-15",
      offers: { price: "1000", description: "Off MSRP" },
    })
    expect(s["@type"]).toBe("SaleEvent")
    expect(s.offers).toEqual({
      "@type": "Offer",
      price: "1000",
      description: "Off MSRP",
      priceCurrency: "CAD",
    })
    expect(s.location.name).toBe("Planet Motors")
    expect(s.location.address.addressCountry).toBe("CA")
  })

  it("uses a custom location name when provided", () => {
    const s = generateEventSchema({
      name: "Pop-up",
      description: "x",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      location: "Toronto Convention Centre",
    })
    expect(s.location.name).toBe("Toronto Convention Centre")
    expect(s.offers).toBeUndefined()
  })
})
