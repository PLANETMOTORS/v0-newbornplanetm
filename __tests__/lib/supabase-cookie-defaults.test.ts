/**
 * FU-1 — Supabase auth cookies must NOT default to httpOnly=true.
 *
 * @supabase/ssr deliberately leaves `httpOnly` undefined on its session
 * cookies so `createBrowserClient` can read the access/refresh tokens
 * via `document.cookie`. Forcing httpOnly=true in our middleware
 * silently breaks every page that uses the browser SDK.
 *
 * These tests lock the cookie-merge contract so a future "harden
 * everything" sweep can't reintroduce the regression.
 */

import { describe, expect, it } from "vitest"
import { applySupabaseCookieDefaults } from "@/lib/supabase/middleware"

describe("applySupabaseCookieDefaults — Supabase cookie hardening contract", () => {
  it("does NOT default httpOnly when Supabase leaves it undefined", () => {
    const merged = applySupabaseCookieDefaults({ path: "/" }, /* isProduction */ true)
    expect(merged.httpOnly).toBeUndefined()
  })

  it("does NOT override httpOnly=false when Supabase explicitly set it", () => {
    const merged = applySupabaseCookieDefaults({ httpOnly: false }, true)
    expect(merged.httpOnly).toBe(false)
  })

  it("preserves httpOnly=true when Supabase explicitly set it", () => {
    const merged = applySupabaseCookieDefaults({ httpOnly: true }, true)
    expect(merged.httpOnly).toBe(true)
  })

  it("defaults secure=true in production", () => {
    const merged = applySupabaseCookieDefaults({}, true)
    expect(merged.secure).toBe(true)
  })

  it("defaults secure=false outside production", () => {
    const merged = applySupabaseCookieDefaults({}, false)
    expect(merged.secure).toBe(false)
  })

  it("never weakens an explicit secure=true that Supabase set", () => {
    const merged = applySupabaseCookieDefaults({ secure: true }, false)
    expect(merged.secure).toBe(true)
  })

  it("respects Supabase's explicit secure=false (e.g. dev fixtures)", () => {
    const merged = applySupabaseCookieDefaults({ secure: false }, true)
    expect(merged.secure).toBe(false)
  })

  it("defaults sameSite to 'lax' when Supabase leaves it undefined", () => {
    const merged = applySupabaseCookieDefaults({}, true)
    expect(merged.sameSite).toBe("lax")
  })

  it("respects Supabase's explicit sameSite='strict' (PKCE auth-flow cookie)", () => {
    const merged = applySupabaseCookieDefaults({ sameSite: "strict" }, true)
    expect(merged.sameSite).toBe("strict")
  })

  it("forwards every other Supabase option unchanged", () => {
    const merged = applySupabaseCookieDefaults(
      {
        path: "/auth",
        domain: "planetmotors.ca",
        maxAge: 3600,
        expires: new Date("2030-01-01"),
      },
      true
    )
    expect(merged.path).toBe("/auth")
    expect(merged.domain).toBe("planetmotors.ca")
    expect(merged.maxAge).toBe(3600)
    expect(merged.expires).toEqual(new Date("2030-01-01"))
  })

  it("handles undefined options (Supabase pattern when nothing was set)", () => {
    const merged = applySupabaseCookieDefaults(undefined, true)
    expect(merged.httpOnly).toBeUndefined()
    expect(merged.secure).toBe(true)
    expect(merged.sameSite).toBe("lax")
  })
})
