/**
 * Regression tests for app/layout.tsx
 *
 * These tests verify the PR change that removed the Pirelly 360° viewer
 * script tag from the global layout to comply with the production CSP.
 * They read the source file directly to guard against accidental re-introduction
 * of the non-allowlisted external script.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LAYOUT_PATH = resolve(__dirname, '../../app/layout.tsx')
const source = readFileSync(LAYOUT_PATH, 'utf-8')

const PIRELLY_SCRIPT_URL = 'https://us-central1-pirelly360.cloudfunctions.net/iframe-script-server'

describe('app/layout.tsx — Pirelly 360° viewer script removal (CSP compliance)', () => {
  it('does NOT contain a <script> tag pointing to the Pirelly CDN origin', () => {
    // The PR removed the script to comply with production CSP.
    // This test is a regression guard to prevent it being re-added.
    expect(source).not.toContain(PIRELLY_SCRIPT_URL)
  })

  it('does NOT contain any pirelly360.cloudfunctions.net origin in script tags', () => {
    // Broader check: no variant of the Pirelly cloud functions origin should
    // appear inside a <script src=...> attribute in the layout.
    const scriptTagMatches = source.match(/<script[^>]*src=[^>]*pirelly[^>]*>/gi)
    expect(scriptTagMatches).toBeNull()
  })

  it('contains the CSP-compliance comment replacing the old script tag', () => {
    // The PR replaced the script with an explanatory comment.
    // Verify the intent is documented in the source.
    expect(source).toContain('non-allowlisted origin')
  })

  it('still includes dns-prefetch links for analytics (unrelated links intact)', () => {
    expect(source).toContain('https://www.google-analytics.com')
    expect(source).toContain('https://www.googletagmanager.com')
  })

  it('still renders OrganizationJsonLd (JSON-LD structured data intact)', () => {
    expect(source).toContain('OrganizationJsonLd')
  })

  it('still renders LocalBusinessJsonLd (JSON-LD structured data intact)', () => {
    expect(source).toContain('LocalBusinessJsonLd')
  })
})