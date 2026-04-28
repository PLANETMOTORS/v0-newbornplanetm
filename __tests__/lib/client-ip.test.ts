import { describe, it, expect } from "vitest"
import { getClientIp } from "@/lib/security/client-ip"

function makeReq(headers: Record<string, string>): Request {
  return new Request("http://localhost/", { headers })
}

describe("getClientIp", () => {
  it("prefers cf-connecting-ip", () => {
    expect(
      getClientIp(
        makeReq({
          "cf-connecting-ip": "1.2.3.4",
          "x-forwarded-for": "9.9.9.9",
        })
      )
    ).toBe("1.2.3.4")
  })

  it("falls back to first x-forwarded-for entry", () => {
    expect(
      getClientIp(makeReq({ "x-forwarded-for": "1.2.3.4, 9.9.9.9" }))
    ).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip", () => {
    expect(getClientIp(makeReq({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8")
  })

  it("returns 'unknown' sentinel when no headers are present", () => {
    expect(getClientIp(makeReq({}))).toBe("unknown")
  })

  it("lowercases the result", () => {
    expect(getClientIp(makeReq({ "cf-connecting-ip": "AB::CD" }))).toBe(
      "ab::cd"
    )
  })

  it("trims whitespace around the IP", () => {
    expect(getClientIp(makeReq({ "cf-connecting-ip": "  1.2.3.4  " }))).toBe(
      "1.2.3.4"
    )
  })
})
