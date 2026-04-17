/**
 * Regression tests for app/layout.tsx
 *
 * These tests verify that the Pirelly 360° viewer script is present in the
 * global layout and that the CSP in next.config.mjs has been updated to
 * allowlist its origin, preventing the browser from blocking the script.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LAYOUT_PATH = resolve(__dirname, '../../app/layout.tsx')
const source = readFileSync(LAYOUT_PATH, 'utf-8')

const CONFIG_PATH = resolve(__dirname, '../../next.config.mjs')
const configSource = readFileSync(CONFIG_PATH, 'utf-8')

const PIRELLY_SCRIPT_URL = 'https://us-central1-pirelly360.cloudfunctions.net/iframe-script-server'
const PIRELLY_ORIGIN = 'https://us-central1-pirelly360.cloudfunctions.net'

describe('app/layout.tsx — Pirelly 360° viewer script (CSP-compliant)', () => {
  it('contains a <script> tag pointing to the Pirelly CDN origin', () => {
    expect(source).toContain(PIRELLY_SCRIPT_URL)
  })

  it('loads the Pirelly script with the async attribute', () => {
    const scriptTagMatch = source.match(/<script[^>]*src="[^"]*pirelly[^"]*"[^>]*async/)
    expect(scriptTagMatch).not.toBeNull()
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

describe('next.config.mjs — CSP allowlists Pirelly script origin', () => {
  it('includes the Pirelly cloud functions origin in script-src', () => {
    expect(configSource).toContain(PIRELLY_ORIGIN)
  })

  it('the Pirelly origin appears inside the script-src directive', () => {
    const scriptSrcMatch = configSource.match(/script-src[^;]*/)
    expect(scriptSrcMatch).not.toBeNull()
    expect(scriptSrcMatch![0]).toContain(PIRELLY_ORIGIN)
  })
})
