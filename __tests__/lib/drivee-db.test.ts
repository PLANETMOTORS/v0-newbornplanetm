import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()

vi.mock("@/lib/supabase/static", () => ({
  createStaticClient: () => ({
    from: mockFrom,
  }),
}))

vi.mock("@/lib/drivee", () => ({
  DRIVEE_VIN_MAP: {
    "VIN123": "MID-A",
    "VIN456": "MID-B",
  },
}))

describe("drivee-db", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe("getDriveeMidFromDb", () => {
    it("returns null for null/undefined VIN", async () => {
      const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
      expect(await getDriveeMidFromDb(null)).toBeNull()
      expect(await getDriveeMidFromDb(undefined)).toBeNull()
    })

    it("returns MID from DB when available", async () => {
      mockEq.mockResolvedValue({
        data: [{ vin: "VIN-X", mid: "MID-X", frame_count: 10, frames_in_storage: true, vehicle_name: "Test" }],
        error: null,
      })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
      const mid = await getDriveeMidFromDb("VIN-X")
      expect(mid).toBe("MID-X")
    })

    it("returns null for unknown VIN", async () => {
      mockEq.mockResolvedValue({
        data: [{ vin: "VIN-X", mid: "MID-X", frame_count: 10, frames_in_storage: true, vehicle_name: null }],
        error: null,
      })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
      const mid = await getDriveeMidFromDb("UNKNOWN-VIN")
      expect(mid).toBeNull()
    })

    it("falls back to static map on DB error", async () => {
      mockEq.mockResolvedValue({ data: null, error: { message: "fail" } })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
      const mid = await getDriveeMidFromDb("VIN123")
      expect(mid).toBe("MID-A")
    })
  })

  describe("getDriveeMappingFromDb", () => {
    it("returns null for null VIN", async () => {
      const { getDriveeMappingFromDb } = await import("@/lib/drivee-db")
      expect(await getDriveeMappingFromDb(null)).toBeNull()
    })

    it("returns mapping entry for known VIN", async () => {
      mockEq.mockResolvedValue({
        data: [{ vin: "VIN-X", mid: "MID-X", frame_count: 10, frames_in_storage: true, vehicle_name: "Test Car" }],
        error: null,
      })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const { getDriveeMappingFromDb } = await import("@/lib/drivee-db")
      const mapping = await getDriveeMappingFromDb("VIN-X")
      expect(mapping).not.toBeNull()
      expect(mapping?.mid).toBe("MID-X")
      expect(mapping?.frame_count).toBe(10)
    })

    it("returns null for unknown VIN", async () => {
      mockEq.mockResolvedValue({
        data: [{ vin: "VIN-X", mid: "MID-X", frame_count: 10, frames_in_storage: true, vehicle_name: null }],
        error: null,
      })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const { getDriveeMappingFromDb } = await import("@/lib/drivee-db")
      const mapping = await getDriveeMappingFromDb("UNKNOWN-VIN")
      expect(mapping).toBeNull()
    })
  })

  describe("getKnownMids", () => {
    it("returns set of MIDs with frames in storage", async () => {
      mockEq.mockResolvedValue({
        data: [
          { vin: "V1", mid: "M1", frame_count: 5, frames_in_storage: true, vehicle_name: null },
          { vin: "V2", mid: "M2", frame_count: 3, frames_in_storage: true, vehicle_name: null },
        ],
        error: null,
      })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const { getKnownMids } = await import("@/lib/drivee-db")
      const mids = await getKnownMids()
      expect(mids.has("M1")).toBe(true)
      expect(mids.has("M2")).toBe(true)
    })
  })

  describe("invalidateDriveeCache", () => {
    it("clears cache without error", async () => {
      const { invalidateDriveeCache } = await import("@/lib/drivee-db")
      expect(() => invalidateDriveeCache()).not.toThrow()
    })
  })
})
