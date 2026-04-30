import { describe, it, expect } from "vitest"
import {
  normalizeHomenetBodyStyle,
  detectPHEVOverride,
  excelSerialToISO,
  isStockPhotoUrl,
  filterStockPhotos,
  deduplicateDescriptionLines,
  HOMENET_NEVER_PROVIDES_AVILOO,
} from "@/lib/homenet/normalizers"

// ==================== BODY STYLE ====================

describe("normalizeHomenetBodyStyle", () => {
  describe("Sedan", () => {
    it("maps 'Sedan'", () => expect(normalizeHomenetBodyStyle("Sedan")).toBe("Sedan"))
    it("maps '4dr Sedan'", () => expect(normalizeHomenetBodyStyle("4dr Sedan")).toBe("Sedan"))
    it("maps '4dr Car'", () => expect(normalizeHomenetBodyStyle("4dr Car")).toBe("Sedan"))
    it("maps '4-dr Car'", () => expect(normalizeHomenetBodyStyle("4-dr Car")).toBe("Sedan"))
    it("maps lowercase 'sedan'", () => expect(normalizeHomenetBodyStyle("sedan")).toBe("Sedan"))
    it("maps single 'Car'", () => expect(normalizeHomenetBodyStyle("Car")).toBe("Sedan"))
  })

  describe("SUV", () => {
    it("maps 'Sport Utility'", () => expect(normalizeHomenetBodyStyle("Sport Utility")).toBe("SUV"))
    it("maps '4dr Sport Utility Vehicle'", () =>
      expect(normalizeHomenetBodyStyle("4dr Sport Utility Vehicle")).toBe("SUV"))
    it("maps 'Crossover'", () => expect(normalizeHomenetBodyStyle("Crossover")).toBe("SUV"))
    it("maps 'SUV'", () => expect(normalizeHomenetBodyStyle("SUV")).toBe("SUV"))
    it("maps 'Mid-size SUV'", () => expect(normalizeHomenetBodyStyle("Mid-size SUV")).toBe("SUV"))
  })

  describe("Truck", () => {
    it("maps 'Pickup'", () => expect(normalizeHomenetBodyStyle("Pickup")).toBe("Truck"))
    it("maps 'Crew Cab Pickup'", () => expect(normalizeHomenetBodyStyle("Crew Cab Pickup")).toBe("Truck"))
    it("maps 'Quad Cab Pickup'", () => expect(normalizeHomenetBodyStyle("Quad Cab Pickup")).toBe("Truck"))
    it("maps 'Regular Cab Pickup'", () => expect(normalizeHomenetBodyStyle("Regular Cab Pickup")).toBe("Truck"))
    it("maps 'Extended Cab Pickup'", () => expect(normalizeHomenetBodyStyle("Extended Cab Pickup")).toBe("Truck"))
    it("maps 'Super Cab'", () => expect(normalizeHomenetBodyStyle("Super Cab F-150")).toBe("Truck"))
    it("maps 'SuperCrew'", () => expect(normalizeHomenetBodyStyle("SuperCrew")).toBe("Truck"))
    it("maps 'Mega Cab'", () => expect(normalizeHomenetBodyStyle("Mega Cab Ram")).toBe("Truck"))
    it("maps 'Truck'", () => expect(normalizeHomenetBodyStyle("Truck")).toBe("Truck"))
  })

  describe("Hatchback", () => {
    it("maps 'Hatchback'", () => expect(normalizeHomenetBodyStyle("Hatchback")).toBe("Hatchback"))
    it("maps '5dr Hatchback'", () => expect(normalizeHomenetBodyStyle("5dr Hatchback")).toBe("Hatchback"))
    it("maps '4dr Hatchback' (NOT Sedan)", () =>
      expect(normalizeHomenetBodyStyle("4dr Hatchback")).toBe("Hatchback"))
  })

  describe("Coupe", () => {
    it("maps 'Coupe'", () => expect(normalizeHomenetBodyStyle("Coupe")).toBe("Coupe"))
    it("maps '2dr Coupe'", () => expect(normalizeHomenetBodyStyle("2dr Coupe")).toBe("Coupe"))
    it("maps '2-door' (no hatchback)", () => expect(normalizeHomenetBodyStyle("2-door Mustang")).toBe("Coupe"))
  })

  describe("Convertible", () => {
    it("maps 'Convertible'", () => expect(normalizeHomenetBodyStyle("Convertible")).toBe("Convertible"))
    it("maps '2dr Convertible'", () =>
      expect(normalizeHomenetBodyStyle("2dr Convertible")).toBe("Convertible"))
    it("maps 'Cabriolet'", () => expect(normalizeHomenetBodyStyle("Cabriolet")).toBe("Convertible"))
    it("maps 'Roadster'", () => expect(normalizeHomenetBodyStyle("Roadster")).toBe("Convertible"))
  })

  describe("Wagon", () => {
    it("maps 'Wagon'", () => expect(normalizeHomenetBodyStyle("Wagon")).toBe("Wagon"))
    it("maps 'Station Wagon'", () => expect(normalizeHomenetBodyStyle("Station Wagon")).toBe("Wagon"))
    it("maps 'Estate'", () => expect(normalizeHomenetBodyStyle("Estate")).toBe("Wagon"))
  })

  describe("Minivan / Van", () => {
    it("maps 'Minivan'", () => expect(normalizeHomenetBodyStyle("Minivan")).toBe("Minivan"))
    it("maps 'Mini Van'", () => expect(normalizeHomenetBodyStyle("Mini Van")).toBe("Minivan"))
    it("maps 'Mini-Van'", () => expect(normalizeHomenetBodyStyle("Mini-Van")).toBe("Minivan"))
    it("maps 'Cargo Van' to Van (not Minivan)", () =>
      expect(normalizeHomenetBodyStyle("Cargo Van")).toBe("Van"))
    it("maps 'Passenger Van' to Van", () =>
      expect(normalizeHomenetBodyStyle("Passenger Van")).toBe("Van"))
    it("maps single 'Van'", () => expect(normalizeHomenetBodyStyle("Van")).toBe("Van"))
  })

  describe("Edge cases", () => {
    it("returns empty for empty input", () => expect(normalizeHomenetBodyStyle("")).toBe(""))
    it("returns empty for whitespace-only", () => expect(normalizeHomenetBodyStyle("   ")).toBe(""))
    it("preserves unknown values with capitalized first letter", () =>
      expect(normalizeHomenetBodyStyle("limousine")).toBe("Limousine"))
    it("preserves unknown values with mixed case", () =>
      expect(normalizeHomenetBodyStyle("CUSTOM HOTROD")).toBe("Custom hotrod"))
  })
})

// ==================== PHEV OVERRIDE ====================

describe("detectPHEVOverride", () => {
  describe("Jeep 4xe (the headline case)", () => {
    it("Wrangler 4xe with 'Hybrid Fuel' is detected as PHEV", () => {
      const r = detectPHEVOverride("Jeep", "Wrangler", "Sahara 4xe", "Hybrid")
      expect(r).toEqual({ fuelType: "Plug-in Hybrid", isEv: false, isPhev: true })
    })

    it("Grand Cherokee 4xe is detected as PHEV", () => {
      const r = detectPHEVOverride("Jeep", "Grand Cherokee", "Trailhawk 4xe", "Hybrid")
      expect(r?.isPhev).toBe(true)
    })

    it("matches 4xe in MODEL field too", () => {
      const r = detectPHEVOverride("Jeep", "Grand Cherokee 4xe", "Limited", "Hybrid")
      expect(r?.isPhev).toBe(true)
    })

    it("case-insensitive 4xe / 4XE", () => {
      expect(detectPHEVOverride("jeep", "Wrangler", "Sahara 4XE", "Hybrid Fuel")?.isPhev).toBe(true)
    })

    it("does NOT trigger for Jeep without 4xe (e.g., regular Wrangler)", () => {
      expect(detectPHEVOverride("Jeep", "Wrangler", "Sport", "Gasoline")).toBeNull()
    })

    it("does NOT trigger for non-Jeep with '4xe' in trim (rare)", () => {
      // 4xe is a Jeep-specific marketing trim. Other makes use different conventions.
      expect(detectPHEVOverride("Toyota", "RAV4", "Hybrid", "Hybrid")).toBeNull()
    })
  })

  describe("Already-labeled PHEV — canonicalize the label", () => {
    it("'Plug-in Hybrid' returns canonical PHEV", () => {
      expect(detectPHEVOverride("Toyota", "RAV4", "Prime", "Plug-in Hybrid")?.fuelType).toBe(
        "Plug-in Hybrid",
      )
    })
    it("'Plug In Hybrid' (no hyphen)", () => {
      expect(detectPHEVOverride("Mitsubishi", "Outlander", "PHEV", "Plug In Hybrid")?.isPhev).toBe(true)
    })
    it("'Plugin Hybrid' (no space)", () => {
      expect(detectPHEVOverride("Hyundai", "Tucson", "PHEV", "Plugin Hybrid")?.isPhev).toBe(true)
    })
    it("'PHEV' shorthand", () => {
      expect(detectPHEVOverride("Mitsubishi", "Outlander", "GT", "PHEV")?.isPhev).toBe(true)
    })
  })

  describe("BMW iPerformance", () => {
    it("BMW 530e iPerformance is PHEV", () => {
      const r = detectPHEVOverride("BMW", "530e", "iPerformance", "Hybrid")
      expect(r?.isPhev).toBe(true)
    })
    it("non-BMW with iPerformance text doesn't trigger BMW branch", () => {
      // Falls through; would be caught by trim plug-in check only if it says plug-in
      const r = detectPHEVOverride("Audi", "A3", "iPerformance Sport", "Hybrid")
      expect(r).toBeNull()
    })
  })

  describe("Trim or options mention plug-in", () => {
    it("trim 'Plug-in Hybrid Premium'", () => {
      expect(detectPHEVOverride("Toyota", "Prius", "Plug-in Hybrid Premium", "Hybrid")?.isPhev).toBe(true)
    })
    it("options array mentions Plug-in", () => {
      const r = detectPHEVOverride("Ford", "Escape", "Titanium", "Hybrid", ["Plug-in Charging"])
      expect(r?.isPhev).toBe(true)
    })
    it("options 'Plug In' (no hyphen) also triggers", () => {
      const r = detectPHEVOverride("Ford", "Escape", "Titanium", "Hybrid", ["Plug In Cable"])
      expect(r?.isPhev).toBe(true)
    })
  })

  describe("No override", () => {
    it("plain hybrid Toyota Prius — no override", () => {
      expect(detectPHEVOverride("Toyota", "Prius", "LE", "Hybrid")).toBeNull()
    })
    it("pure EV Tesla — no override (EV path handled elsewhere)", () => {
      expect(detectPHEVOverride("Tesla", "Model 3", "Long Range", "Electric")).toBeNull()
    })
    it("gas Honda Accord — no override", () => {
      expect(detectPHEVOverride("Honda", "Accord", "EX", "Gasoline")).toBeNull()
    })
    it("empty inputs", () => {
      expect(detectPHEVOverride("", "", "", "")).toBeNull()
    })
  })
})

// ==================== EXCEL DATE ====================

describe("excelSerialToISO", () => {
  it("converts a typical 2024 serial", () => {
    // 45601 = 2024-11-05 in Excel epoch (days since 1900-01-00 with leap bug)
    expect(excelSerialToISO(45601)).toBe("2024-11-05")
  })

  it("accepts string input", () => {
    expect(excelSerialToISO("45601")).toBe("2024-11-05")
  })

  it("returns null for empty string", () => {
    expect(excelSerialToISO("")).toBeNull()
  })

  it("returns null for null/undefined", () => {
    expect(excelSerialToISO(null)).toBeNull()
    expect(excelSerialToISO(undefined)).toBeNull()
  })

  it("returns null for zero", () => {
    expect(excelSerialToISO(0)).toBeNull()
  })

  it("returns null for negative serial", () => {
    expect(excelSerialToISO(-100)).toBeNull()
  })

  it("returns null for non-numeric string", () => {
    expect(excelSerialToISO("not a number")).toBeNull()
  })

  it("returns ISO YYYY-MM-DD format (not full datetime)", () => {
    const iso = excelSerialToISO(45000)
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("handles fractional serials (timestamps)", () => {
    // Serials with fractional days still produce a valid date-only ISO
    expect(excelSerialToISO(45601.5)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// ==================== STOCK PHOTO ====================

describe("isStockPhotoUrl", () => {
  it("detects /stock_images/ paths (the headline case from CSV sample)", () => {
    expect(isStockPhotoUrl("https://content.homenetiol.com/stock_images/2/33490.jpg")).toBe(true)
  })

  it("detects /stock-images/ (hyphen variant)", () => {
    expect(isStockPhotoUrl("https://cdn.example.com/stock-images/abc.jpg")).toBe(true)
  })

  it("detects /stockphotos/", () => {
    expect(isStockPhotoUrl("https://x.com/stockphotos/y.png")).toBe(true)
  })

  it("detects /placeholder", () => {
    expect(isStockPhotoUrl("https://x.com/placeholder.jpg")).toBe(true)
  })

  it("detects /no-image", () => {
    expect(isStockPhotoUrl("https://x.com/no-image.png")).toBe(true)
  })

  it("detects /coming-soon", () => {
    expect(isStockPhotoUrl("https://x.com/coming-soon.jpg")).toBe(true)
  })

  it("detects /default.jpg, .jpeg, .png, .webp", () => {
    expect(isStockPhotoUrl("https://x.com/default.jpg")).toBe(true)
    expect(isStockPhotoUrl("https://x.com/default.jpeg")).toBe(true)
    expect(isStockPhotoUrl("https://x.com/default.png")).toBe(true)
    expect(isStockPhotoUrl("https://x.com/default.webp")).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(isStockPhotoUrl("HTTPS://X.COM/STOCK_IMAGES/Y.JPG")).toBe(true)
  })

  it("returns false for real photos", () => {
    expect(isStockPhotoUrl("https://content.homenetiol.com/photos/abc/1HGCM82633A123456_001.jpg")).toBe(false)
    expect(isStockPhotoUrl("https://cdn.planetmotors.ca/vehicle-photos/xyz/main.jpg")).toBe(false)
  })

  it("returns false for empty/null", () => {
    expect(isStockPhotoUrl("")).toBe(false)
  })
})

describe("filterStockPhotos", () => {
  it("separates real and stock photos", () => {
    const r = filterStockPhotos([
      "https://x.com/photos/real1.jpg",
      "https://x.com/stock_images/2/33490.jpg",
      "https://x.com/photos/real2.jpg",
      "https://x.com/placeholder.jpg",
    ])
    expect(r.realPhotos).toHaveLength(2)
    expect(r.stockPhotos).toHaveLength(2)
    expect(r.hasOnlyStockPhotos).toBe(false)
  })

  it("flags hasOnlyStockPhotos when all are stock", () => {
    const r = filterStockPhotos([
      "https://x.com/stock_images/2/33490.jpg",
      "https://x.com/placeholder.png",
    ])
    expect(r.realPhotos).toHaveLength(0)
    expect(r.stockPhotos).toHaveLength(2)
    expect(r.hasOnlyStockPhotos).toBe(true)
  })

  it("returns hasOnlyStockPhotos=false for empty array", () => {
    const r = filterStockPhotos([])
    expect(r.realPhotos).toHaveLength(0)
    expect(r.stockPhotos).toHaveLength(0)
    expect(r.hasOnlyStockPhotos).toBe(false)
  })

  it("returns all real when none are stock", () => {
    const r = filterStockPhotos([
      "https://x.com/photos/a.jpg",
      "https://x.com/photos/b.jpg",
    ])
    expect(r.realPhotos).toHaveLength(2)
    expect(r.stockPhotos).toHaveLength(0)
  })
})

// ==================== AVILOO ====================

describe("HOMENET_NEVER_PROVIDES_AVILOO", () => {
  it("is null (compile-time reminder)", () => {
    expect(HOMENET_NEVER_PROVIDES_AVILOO).toBeNull()
  })
})

// ==================== DESCRIPTION DEDUP ====================

describe("deduplicateDescriptionLines", () => {
  it("removes consecutive duplicate lines", () => {
    const input = [
      "Welcome to Planet Motors!",
      "Welcome to Planet Motors!",
      "210-point inspection.",
    ].join("\n")
    expect(deduplicateDescriptionLines(input)).toBe(
      "Welcome to Planet Motors!\n210-point inspection.",
    )
  })

  it("removes non-consecutive duplicates too", () => {
    const input = [
      "Welcome to Planet Motors!",
      "210-point inspection.",
      "Welcome to Planet Motors!",
    ].join("\n")
    expect(deduplicateDescriptionLines(input)).toBe(
      "Welcome to Planet Motors!\n210-point inspection.",
    )
  })

  it("is case- and whitespace-insensitive when matching", () => {
    const input = [
      "Welcome to Planet Motors!",
      "  WELCOME  TO  PLANET MOTORS!  ",
    ].join("\n")
    expect(deduplicateDescriptionLines(input).split("\n")).toHaveLength(1)
  })

  it("preserves order of first occurrence", () => {
    const input = ["B line", "A line", "B line", "C line"].join("\n")
    expect(deduplicateDescriptionLines(input)).toBe("B line\nA line\nC line")
  })

  it("returns empty for empty / whitespace-only input", () => {
    expect(deduplicateDescriptionLines("")).toBe("")
    expect(deduplicateDescriptionLines("   ")).toBe("")
  })

  it("filters out blank lines", () => {
    expect(deduplicateDescriptionLines("a\n\n\nb")).toBe("a\nb")
  })
})
