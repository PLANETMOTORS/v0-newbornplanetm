import { describe, it, expect, vi } from "vitest"
import {
  FRAME_MANIFEST,
  INTERIOR_MANIFEST,
  frameUrl,
  interiorUrl,
  discoverFrameUrls,
} from "@/lib/drivee-frames"

describe("frameUrl", () => {
  it("zero-pads frame numbers to 2 digits", () => {
    const url = frameUrl("761707513348", 1)
    expect(url).toContain("/761707513348/01.webp")
  })

  it("uses the provided number when already 2+ digits", () => {
    expect(frameUrl("123", 42)).toContain("/123/42.webp")
  })

  it("targets the public Supabase Storage path", () => {
    const url = frameUrl("xyz", 5)
    expect(url).toContain("/storage/v1/object/public/vehicle-360/")
  })
})

describe("interiorUrl", () => {
  it("returns null for MIDs without an interior", () => {
    expect(interiorUrl("UNKNOWN_MID_12345")).toBeNull()
  })

  it("returns a Supabase URL for known MIDs", () => {
    const known = Object.keys(INTERIOR_MANIFEST)[0]
    if (!known) return // guard against an empty manifest
    const url = interiorUrl(known)
    expect(url).toContain(`/${known}/`)
    expect(url).toContain("/storage/v1/object/public/vehicle-360/")
  })
})

describe("FRAME_MANIFEST", () => {
  it("contains a positive frame count for every entry", () => {
    for (const [mid, count] of Object.entries(FRAME_MANIFEST)) {
      expect(count, `MID ${mid}`).toBeGreaterThan(0)
      expect(Number.isInteger(count)).toBe(true)
    }
  })
})

describe("discoverFrameUrls", () => {
  it("uses the manifest count when available (no network probes)", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("should not be called"))
    try {
      const mid = Object.keys(FRAME_MANIFEST)[0]
      const expected = FRAME_MANIFEST[mid]
      const urls = await discoverFrameUrls(mid)
      expect(urls).toHaveLength(expected)
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it("handles fetch rejections during probing (catch path)", async () => {
    let callIdx = 0
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => {
        callIdx++
        if (callIdx <= 2) return { ok: true } as Response
        throw new Error("network error")
      })
    try {
      const urls = await discoverFrameUrls("UNKNOWN_CATCH_MID")
      // First 2 succeed, 3rd throws (catch → ok:false), stops probing
      expect(urls).toHaveLength(2)
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it("probes Supabase via HEAD when MID is unknown", async () => {
    const responses: Array<{ ok: boolean }> = [
      { ok: true },
      { ok: true },
      { ok: false },
      { ok: true },
    ]
    let i = 0
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => {
        const r = responses[i++] ?? { ok: false }
        return r as Response
      })
    try {
      const urls = await discoverFrameUrls("UNKNOWN_MID_xxx")
      // Stops at the first false.
      expect(urls).toHaveLength(2)
      expect(fetchSpy).toHaveBeenCalled()
    } finally {
      fetchSpy.mockRestore()
    }
  })
})
