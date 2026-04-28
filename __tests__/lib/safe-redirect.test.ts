import { describe, expect, it } from "vitest"
import { sanitizeRedirectTo } from "@/lib/safe-redirect"

describe("lib/safe-redirect sanitizeRedirectTo", () => {
  it("returns the default fallback ('/account') when input is null", () => {
    expect(sanitizeRedirectTo(null)).toBe("/account")
  })

  it("returns the default fallback when input is undefined", () => {
    expect(sanitizeRedirectTo(undefined)).toBe("/account")
  })

  it("returns the default fallback when input is the empty string", () => {
    expect(sanitizeRedirectTo("")).toBe("/account")
  })

  it("respects a caller-provided fallback", () => {
    expect(sanitizeRedirectTo(null, "/login")).toBe("/login")
  })

  it("accepts a single-segment relative path", () => {
    expect(sanitizeRedirectTo("/account")).toBe("/account")
  })

  it("accepts a multi-segment relative path", () => {
    expect(sanitizeRedirectTo("/checkout/123/confirm")).toBe("/checkout/123/confirm")
  })

  it("accepts the bare root path '/'", () => {
    expect(sanitizeRedirectTo("/")).toBe("/")
  })

  it("rejects protocol-relative URLs (//evil.com)", () => {
    expect(sanitizeRedirectTo("//evil.com/phish")).toBe("/account")
  })

  it("rejects absolute http URLs", () => {
    expect(sanitizeRedirectTo("http://evil.com")).toBe("/account")
  })

  it("rejects absolute https URLs", () => {
    expect(sanitizeRedirectTo("https://evil.com")).toBe("/account")
  })

  it("rejects javascript: URIs", () => {
    expect(sanitizeRedirectTo("javascript:alert(1)")).toBe("/account")
  })

  it("rejects bare strings without a leading slash", () => {
    expect(sanitizeRedirectTo("account")).toBe("/account")
  })

  it("rejects redirects that contain a CR header-injection char", () => {
    expect(sanitizeRedirectTo("/account\r/foo")).toBe("/account")
  })

  it("rejects redirects that contain a LF header-injection char", () => {
    expect(sanitizeRedirectTo("/account\n/foo")).toBe("/account")
  })

  it("rejects redirects that contain a tab control char", () => {
    expect(sanitizeRedirectTo("/account\tfoo")).toBe("/account")
  })

  it("uses the supplied fallback for malicious inputs", () => {
    expect(sanitizeRedirectTo("//evil.com", "/safe")).toBe("/safe")
  })
})
