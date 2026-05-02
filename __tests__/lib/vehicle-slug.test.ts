import { describe, expect, it } from "vitest"
import { generateVehicleSlug } from "@/lib/vehicle-slug"

describe("generateVehicleSlug", () => {
  it("includes year/make/model/trim/drivetrain/stock", () => {
    const slug = generateVehicleSlug({
      year: 2024,
      make: "Toyota",
      model: "Camry",
      trim: "LE",
      drivetrain: "FWD",
      stockNumber: "PM24-1234",
    })
    expect(slug).toBe("2024-toyota-camry-le-fwd-stkpm24-1234")
  })

  it("omits trim and drivetrain when null/missing", () => {
    expect(
      generateVehicleSlug({
        year: 2023,
        make: "Honda",
        model: "Civic",
        stockNumber: "PM23-9",
      }),
    ).toBe("2023-honda-civic-stkpm23-9")
  })

  it("omits trim alone when null", () => {
    expect(
      generateVehicleSlug({
        year: 2022,
        make: "Tesla",
        model: "Model 3",
        trim: null,
        drivetrain: "AWD",
        stockNumber: "T-1",
      }),
    ).toBe("2022-tesla-model-3-awd-stkt-1")
  })

  it("omits drivetrain alone when null", () => {
    expect(
      generateVehicleSlug({
        year: 2021,
        make: "Ford",
        model: "F-150",
        trim: "XLT",
        drivetrain: null,
        stockNumber: "F-21",
      }),
    ).toBe("2021-ford-f-150-xlt-stkf-21")
  })

  it("lowercases everything", () => {
    expect(
      generateVehicleSlug({
        year: 2020,
        make: "BMW",
        model: "X3",
        stockNumber: "B20-1",
      }),
    ).toBe("2020-bmw-x3-stkb20-1")
  })

  it("replaces non-alphanumeric characters with hyphens", () => {
    const slug = generateVehicleSlug({
      year: 2024,
      make: "Mercedes-Benz",
      model: "C 300",
      trim: "AMG/Line",
      stockNumber: "MB-2024-#42",
    })
    // Each non [a-z0-9-] becomes "-", consecutive collapsed
    expect(slug).toBe("2024-mercedes-benz-c-300-amg-line-stkmb-2024-42")
  })

  it("collapses multiple consecutive hyphens", () => {
    expect(
      generateVehicleSlug({
        year: 2019,
        make: "Acura",
        model: "MDX",
        trim: "  Tech  ",
        stockNumber: "A19/1",
      }),
    ).not.toMatch(/--/)
  })

  it("trims leading and trailing hyphens", () => {
    const slug = generateVehicleSlug({
      year: 2020,
      make: "/Lexus",
      model: "RX/",
      stockNumber: "LX1",
    })
    expect(slug.startsWith("-")).toBe(false)
    expect(slug.endsWith("-")).toBe(false)
  })

  it("handles unicode/special characters by replacement", () => {
    const slug = generateVehicleSlug({
      year: 2024,
      make: "Citroën",
      model: "C4",
      stockNumber: "C-1",
    })
    expect(slug).toMatch(/^2024-citro-+n-c4-stkc-1$/)
  })

  it("treats empty string trim as falsy and omits it", () => {
    const slug = generateVehicleSlug({
      year: 2024,
      make: "Kia",
      model: "Soul",
      trim: "",
      stockNumber: "K1",
    })
    expect(slug).toBe("2024-kia-soul-stkk1")
  })
})
