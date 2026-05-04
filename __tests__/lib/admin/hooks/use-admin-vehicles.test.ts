import { describe, it, expect } from "vitest"
import { getVehiclePhotos } from "@/lib/admin/hooks/use-admin-vehicles"
import type { AdminVehicle } from "@/lib/admin/hooks/use-admin-vehicles"

const makeVehicle = (overrides: Partial<AdminVehicle> = {}): AdminVehicle => ({
  id: "v-1",
  stock_number: "STK001",
  year: 2023,
  make: "Tesla",
  model: "Model 3",
  trim: "Long Range",
  is_ev: true,
  primary_image_url: null,
  status: "available",
  ...overrides,
})

describe("getVehiclePhotos", () => {
  it("returns empty array when vehicle is null", () => {
    expect(getVehiclePhotos(null)).toEqual([])
  })

  it("returns image_urls when present and non-empty", () => {
    const v = makeVehicle({
      image_urls: ["https://img.com/1.jpg", "https://img.com/2.jpg"],
      primary_image_url: "https://img.com/primary.jpg",
    })
    expect(getVehiclePhotos(v)).toEqual(["https://img.com/1.jpg", "https://img.com/2.jpg"])
  })

  it("falls back to primary_image_url when image_urls is empty", () => {
    const v = makeVehicle({
      image_urls: [],
      primary_image_url: "https://img.com/primary.jpg",
    })
    expect(getVehiclePhotos(v)).toEqual(["https://img.com/primary.jpg"])
  })

  it("falls back to primary_image_url when image_urls is null", () => {
    const v = makeVehicle({
      image_urls: null,
      primary_image_url: "https://img.com/primary.jpg",
    })
    expect(getVehiclePhotos(v)).toEqual(["https://img.com/primary.jpg"])
  })

  it("falls back to primary_image_url when image_urls is undefined", () => {
    const v = makeVehicle({
      primary_image_url: "https://img.com/primary.jpg",
    })
    // image_urls not set = undefined
    expect(getVehiclePhotos(v)).toEqual(["https://img.com/primary.jpg"])
  })

  it("returns empty array when neither image_urls nor primary_image_url is set", () => {
    const v = makeVehicle({ image_urls: null, primary_image_url: null })
    expect(getVehiclePhotos(v)).toEqual([])
  })

  it("returns empty array when image_urls is empty and primary is null", () => {
    const v = makeVehicle({ image_urls: [], primary_image_url: null })
    expect(getVehiclePhotos(v)).toEqual([])
  })
})
