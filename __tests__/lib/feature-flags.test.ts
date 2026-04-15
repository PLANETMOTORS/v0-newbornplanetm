import { describe, it, expect, afterEach } from "vitest"
import { Phase, isPhaseEnabled, isFeatureEnabled, FeatureGate } from "@/lib/feature-flags"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

// ── Phase enum ──────────────────────────────────────────────────────────────

describe("Phase enum", () => {
  it("has the correct numeric values", () => {
    expect(Phase.Design).toBe(1)
    expect(Phase.Inventory).toBe(2)
    expect(Phase.SEO).toBe(3)
    expect(Phase.Finance).toBe(4)
    expect(Phase.Trust).toBe(5)
  })
})

// ── isPhaseEnabled ──────────────────────────────────────────────────────────

describe("isPhaseEnabled", () => {
  const original = process.env.NEXT_PUBLIC_ENABLED_PHASES

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLED_PHASES
    } else {
      process.env.NEXT_PUBLIC_ENABLED_PHASES = original
    }
  })

  it("enables all phases when env var is unset", () => {
    delete process.env.NEXT_PUBLIC_ENABLED_PHASES
    expect(isPhaseEnabled(Phase.Design)).toBe(true)
    expect(isPhaseEnabled(Phase.Trust)).toBe(true)
  })

  it("enables all phases when env var is empty", () => {
    process.env.NEXT_PUBLIC_ENABLED_PHASES = ""
    expect(isPhaseEnabled(Phase.Finance)).toBe(true)
  })

  it("enables only listed phases", () => {
    process.env.NEXT_PUBLIC_ENABLED_PHASES = "1,3"
    expect(isPhaseEnabled(Phase.Design)).toBe(true)
    expect(isPhaseEnabled(Phase.Inventory)).toBe(false)
    expect(isPhaseEnabled(Phase.SEO)).toBe(true)
    expect(isPhaseEnabled(Phase.Finance)).toBe(false)
  })

  it("handles whitespace in env var", () => {
    process.env.NEXT_PUBLIC_ENABLED_PHASES = " 2 , 4 "
    expect(isPhaseEnabled(Phase.Inventory)).toBe(true)
    expect(isPhaseEnabled(Phase.Finance)).toBe(true)
    expect(isPhaseEnabled(Phase.Design)).toBe(false)
  })

  it("ignores invalid numeric values", () => {
    process.env.NEXT_PUBLIC_ENABLED_PHASES = "1,99,abc"
    expect(isPhaseEnabled(Phase.Design)).toBe(true)
    expect(isPhaseEnabled(Phase.Inventory)).toBe(false)
  })
})

// ── isFeatureEnabled ────────────────────────────────────────────────────────

describe("isFeatureEnabled", () => {
  const original = process.env.NEXT_PUBLIC_FEATURES

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_FEATURES
    } else {
      process.env.NEXT_PUBLIC_FEATURES = original
    }
  })

  it("returns false when env var is unset", () => {
    delete process.env.NEXT_PUBLIC_FEATURES
    expect(isFeatureEnabled("dark-mode")).toBe(false)
  })

  it("returns true for listed features", () => {
    process.env.NEXT_PUBLIC_FEATURES = "dark-mode,new-checkout"
    expect(isFeatureEnabled("dark-mode")).toBe(true)
    expect(isFeatureEnabled("new-checkout")).toBe(true)
    expect(isFeatureEnabled("other")).toBe(false)
  })

  it("handles whitespace", () => {
    process.env.NEXT_PUBLIC_FEATURES = " dark-mode , new-checkout "
    expect(isFeatureEnabled("dark-mode")).toBe(true)
    expect(isFeatureEnabled("new-checkout")).toBe(true)
  })
})

// ── FeatureGate component ───────────────────────────────────────────────────

describe("FeatureGate", () => {
  const original_phases = process.env.NEXT_PUBLIC_ENABLED_PHASES
  const original_features = process.env.NEXT_PUBLIC_FEATURES

  afterEach(() => {
    if (original_phases === undefined) delete process.env.NEXT_PUBLIC_ENABLED_PHASES
    else process.env.NEXT_PUBLIC_ENABLED_PHASES = original_phases
    if (original_features === undefined) delete process.env.NEXT_PUBLIC_FEATURES
    else process.env.NEXT_PUBLIC_FEATURES = original_features
  })

  it("renders children when phase is enabled", () => {
    process.env.NEXT_PUBLIC_ENABLED_PHASES = "1"
    const html = renderToStaticMarkup(
      React.createElement(FeatureGate, { phase: Phase.Design }, "visible")
    )
    expect(html).toBe("visible")
  })

  it("renders fallback when phase is disabled", () => {
    process.env.NEXT_PUBLIC_ENABLED_PHASES = "1"
    const html = renderToStaticMarkup(
      React.createElement(FeatureGate, { phase: Phase.Trust, fallback: "hidden" }, "visible")
    )
    expect(html).toBe("hidden")
  })

  it("renders children when feature is enabled", () => {
    process.env.NEXT_PUBLIC_FEATURES = "beta"
    const html = renderToStaticMarkup(
      React.createElement(FeatureGate, { feature: "beta" }, "yes")
    )
    expect(html).toBe("yes")
  })

  it("renders nothing when gate is closed and no fallback", () => {
    process.env.NEXT_PUBLIC_ENABLED_PHASES = "1"
    const html = renderToStaticMarkup(
      React.createElement(FeatureGate, { phase: Phase.Trust }, "visible")
    )
    expect(html).toBe("")
  })

  it("requires both phase and feature when both provided", () => {
    process.env.NEXT_PUBLIC_ENABLED_PHASES = "1"
    process.env.NEXT_PUBLIC_FEATURES = "beta"
    const html = renderToStaticMarkup(
      React.createElement(FeatureGate, { phase: Phase.Design, feature: "beta" }, "ok")
    )
    expect(html).toBe("ok")

    // Phase ok but feature missing
    const html2 = renderToStaticMarkup(
      React.createElement(FeatureGate, { phase: Phase.Design, feature: "nope" }, "ok")
    )
    expect(html2).toBe("")
  })

  it("renders children when neither phase nor feature specified", () => {
    const html = renderToStaticMarkup(
      React.createElement(FeatureGate, {}, "always")
    )
    expect(html).toBe("always")
  })
})
