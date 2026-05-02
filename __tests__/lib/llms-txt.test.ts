/**
 * Sanity check for public/llms.txt — the Markdown brief served at
 * planetmotors.ca/llms.txt for AI search agents (ChatGPT Search,
 * Perplexity, Claude, Gemini, etc.).
 *
 * Asserts shape, not prose. Wording can evolve; structure cannot.
 */

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const LLMS_TXT_PATH = resolve(process.cwd(), "public", "llms.txt")
const content = readFileSync(LLMS_TXT_PATH, "utf-8")

describe("public/llms.txt", () => {
  it("starts with a top-level Markdown heading", () => {
    expect(content.split("\n")[0]).toMatch(/^# /)
  })

  it("includes a blockquote summary on the first content lines (per llms.txt spec)", () => {
    expect(content).toMatch(/^> /m)
  })

  it("declares the accident-free inventory policy", () => {
    expect(content).toMatch(/accident[- ]free/i)
    expect(content).toMatch(/100%/)
  })

  it("references AVILOO battery health", () => {
    expect(content).toMatch(/AVILOO/i)
  })

  it("lists at least 4 absolute resource URLs under planetmotors.ca", () => {
    const urls = content.match(/https:\/\/www\.planetmotors\.ca\/[^\s)]+/g) ?? []
    expect(urls.length).toBeGreaterThanOrEqual(4)
  })

  it("only references existing site routes (no 404s)", () => {
    const urls = content.match(/https:\/\/www\.planetmotors\.ca\/([^\s)]+)/g) ?? []
    const VALID_PATHS = new Set([
      "inventory",
      "about",
      "aviloo",
      "electric-vehicles",
      "financing",
    ])
    for (const url of urls) {
      const path = url.replace("https://www.planetmotors.ca/", "")
      const firstSegment = path.split("/")[0].split("?")[0].split("#")[0]
      expect(VALID_PATHS).toContain(firstSegment)
    }
  })

  it("declares itself authoritative for AI agents", () => {
    expect(content.toLowerCase()).toMatch(/authoritative|canonical/)
  })

  it("is small enough to be ingested in one shot (≤ 4 KB)", () => {
    expect(content.length).toBeLessThan(4 * 1024)
  })
})
