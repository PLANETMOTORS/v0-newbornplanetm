import { describe, expect, it } from "vitest"
import robots from "@/app/robots"

describe("app/robots — AI bot policy", () => {
  it("allows OpenAI's search agent (OAI-SearchBot)", () => {
    const r = robots()
    const rule = r.rules
      ? (Array.isArray(r.rules) ? r.rules : [r.rules]).find(
          (x) => x.userAgent === "OAI-SearchBot",
        )
      : undefined
    expect(rule).toBeDefined()
    expect(rule?.allow).toBe("/")
  })

  it("allows ChatGPT-User (link-following crawler)", () => {
    const r = robots()
    const rules = (Array.isArray(r.rules) ? r.rules : [r.rules]) as Array<{
      userAgent?: string | string[]
      allow?: unknown
      disallow?: unknown
    }>
    const rule = rules.find((x) => x.userAgent === "ChatGPT-User")
    expect(rule).toBeDefined()
    expect(rule?.allow).toBe("/")
  })

  it("allows PerplexityBot", () => {
    const r = robots()
    const rules = (Array.isArray(r.rules) ? r.rules : [r.rules]) as Array<{
      userAgent?: string | string[]
      allow?: unknown
    }>
    const rule = rules.find((x) => x.userAgent === "PerplexityBot")
    expect(rule).toBeDefined()
    expect(rule?.allow).toBe("/")
  })

  it("allows ClaudeBot (Anthropic search/citation crawler)", () => {
    const r = robots()
    const rules = (Array.isArray(r.rules) ? r.rules : [r.rules]) as Array<{
      userAgent?: string | string[]
      allow?: unknown
    }>
    const rule = rules.find((x) => x.userAgent === "ClaudeBot")
    expect(rule).toBeDefined()
    expect(rule?.allow).toBe("/")
  })

  it("blocks GPTBot (OpenAI training crawler)", () => {
    const r = robots()
    const rules = (Array.isArray(r.rules) ? r.rules : [r.rules]) as Array<{
      userAgent?: string | string[]
      disallow?: unknown
    }>
    const rule = rules.find((x) => x.userAgent === "GPTBot")
    expect(rule).toBeDefined()
    expect(rule?.disallow).toBe("/")
  })

  it("blocks CCBot (Common Crawl, training feedstock)", () => {
    const r = robots()
    const rules = (Array.isArray(r.rules) ? r.rules : [r.rules]) as Array<{
      userAgent?: string | string[]
      disallow?: unknown
    }>
    const rule = rules.find((x) => x.userAgent === "CCBot")
    expect(rule).toBeDefined()
    expect(rule?.disallow).toBe("/")
  })

  it("blocks Google-Extended (Google's training-data crawler)", () => {
    const r = robots()
    const rules = (Array.isArray(r.rules) ? r.rules : [r.rules]) as Array<{
      userAgent?: string | string[]
      disallow?: unknown
    }>
    const rule = rules.find((x) => x.userAgent === "Google-Extended")
    expect(rule).toBeDefined()
    expect(rule?.disallow).toBe("/")
  })

  it("does NOT include ChatGPT-User in any disallow-everything rule (regression guard)", () => {
    const r = robots()
    const rules = (Array.isArray(r.rules) ? r.rules : [r.rules]) as Array<{
      userAgent?: string | string[]
      allow?: unknown
      disallow?: unknown
    }>
    const blockingRule = rules.find(
      (x) => x.userAgent === "ChatGPT-User" && x.disallow === "/",
    )
    expect(blockingRule).toBeUndefined()
  })

  it("still applies SEARCH_ENGINE_DISALLOW to allowed AI agents", () => {
    // AI agents shouldn't waste budget on /admin, /api, /checkout etc.
    const r = robots()
    const rules = (Array.isArray(r.rules) ? r.rules : [r.rules]) as Array<{
      userAgent?: string | string[]
      disallow?: string | string[]
    }>
    const rule = rules.find((x) => x.userAgent === "OAI-SearchBot")
    expect(rule?.disallow).toEqual(
      expect.arrayContaining(["/api/", "/account/", "/checkout/", "/admin/"]),
    )
  })

  it("emits a sitemap reference at /sitemap.xml", () => {
    const r = robots()
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/)
  })
})
