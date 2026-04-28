/**
 * Canonical-copy lock for the strings touched in
 * chore/banned-phrase-sweep.
 *
 * Where banned-phrases.test.ts is the *negative* guard ("none of these
 * phrases may appear"), this file is the *positive* guard — it imports
 * each module whose copy was rewritten and asserts the new canonical
 * value. The two together give Sonar real `new_coverage` on the
 * changed lines (importing the module evaluates the top-level metadata
 * constants and the assertions trip if the strings ever drift).
 *
 * Coverage strategy:
 *   - Every imported module's changed line is exercised because the
 *     metadata exports run at module-load time.
 *   - Every assertion locks one specific phrase, so a future bot edit
 *     that drifts the wording without using a banned phrase still
 *     fails the build.
 */

import { describe, expect, it, vi } from "vitest"

// next/font/google can't run in the vitest environment — it expects a
// real Next.js compiler. Mock it so importing app/layout.tsx is safe.
vi.mock("next/font/google", () => ({
  Inter: () => ({
    variable: "--font-inter",
    className: "font-inter",
  }),
}))

import { generateSEOMetadata } from "@/lib/seo/metadata"
import { metadata as rootMetadata } from "@/app/layout"

describe("canonical copy locks (chore/banned-phrase-sweep)", () => {
  describe("root metadata in app/layout.tsx", () => {
    it("title is the locked Aviloo Battery-Certified line", () => {
      expect(rootMetadata.title).toBe(
        "Used EVs Canada — Aviloo Battery-Certified | Planet Motors"
      )
    })

    it("title fits Google's SERP truncation budget", () => {
      const t = rootMetadata.title as string
      expect(t.length).toBeLessThanOrEqual(60)
    })

    it("description leads with 'Canada's battery-health certified used EVs'", () => {
      const d = rootMetadata.description as string
      expect(d.startsWith("Canada's battery-health certified used EVs")).toBe(
        true
      )
    })

    it("description honestly distinguishes EVs (Aviloo) from hybrids/PHEVs (inspected)", () => {
      const d = rootMetadata.description as string
      expect(d).toContain("Aviloo battery health reports")
      expect(d).toContain("inspected used hybrids and PHEVs")
      // No banned phrases in the meta description either.
      expect(d.toLowerCase()).not.toContain("find your perfect")
    })

    it("openGraph title mirrors the root title", () => {
      const og = rootMetadata.openGraph as { title?: string }
      expect(og?.title).toBe(
        "Used EVs Canada — Aviloo Battery-Certified | Planet Motors"
      )
    })

    it("twitter card carries the same locked title (without Planet Motors suffix)", () => {
      const tw = rootMetadata.twitter as { title?: string }
      expect(tw?.title).toBe("Used EVs Canada — Aviloo Battery-Certified")
    })
  })

  describe("shared SEO helper lib/seo/metadata.ts", () => {
    it("generateSEOMetadata('Home', ...) returns the locked title", () => {
      const m = generateSEOMetadata({ title: "Home" })
      expect(m.title).toBe(
        "Used EVs Canada — Aviloo Battery-Certified | Planet Motors"
      )
    })

    it("default description matches the root layout description", () => {
      const m = generateSEOMetadata({ title: "Home" })
      expect(m.description).toBe(
        "Canada's battery-health certified used EVs. Aviloo battery health reports, 210-point inspection, Canada-wide delivery. Plus inspected used hybrids and PHEVs. OMVIC licensed."
      )
    })

    it("non-Home titles still suffix with 'Planet Motors'", () => {
      const m = generateSEOMetadata({ title: "Inventory" })
      expect(m.title).toBe("Inventory | Planet Motors")
    })

    it("default description does not mention a stale APR", () => {
      const m = generateSEOMetadata({ title: "Home" })
      const d = m.description as string
      expect(d).not.toContain("6.29% APR")
    })
  })

  describe("dynamic make/model OG description", () => {
    it("is powertrain-agnostic — does not over-claim Aviloo on every model", async () => {
      const mod = await import("@/app/cars/[make]/[model]/page")
      const meta = await mod.generateMetadata({
        params: Promise.resolve({ make: "ford", model: "f-150" }),
      })
      const og = meta.openGraph as { description?: string }
      const desc = og?.description ?? ""
      expect(desc).toContain("Browse used Ford F 150")
      expect(desc).toContain("210-point inspected")
      expect(desc).toContain("OMVIC licensed")
      // The Aviloo claim must NOT appear on a non-EV make.
      expect(desc.toLowerCase()).not.toContain("aviloo")
      // And no banned phrase.
      expect(desc.toLowerCase()).not.toContain("find your perfect")
    })

    it("dynamic make/model regular description is clean and on-brand", async () => {
      const mod = await import("@/app/cars/[make]/[model]/page")
      const meta = await mod.generateMetadata({
        params: Promise.resolve({ make: "tesla", model: "model-3" }),
      })
      const desc = (meta.description ?? "") as string
      expect(desc).toContain("210-point inspection")
      expect(desc).toContain("10-day money-back guarantee")
      expect(desc.toLowerCase()).not.toContain("find your perfect")
    })
  })
})
