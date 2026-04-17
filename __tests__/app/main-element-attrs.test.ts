/**
 * Regression tests for accessibility attribute changes on <main> elements.
 *
 * PR changes:
 *   - app/inventory/page.tsx: <main> gains id="main-content", tabIndex={-1},
 *       focus-visible ring classes (focus-visible:ring-2, focus-visible:ring-primary,
 *       focus-visible:ring-offset-2)
 *   - app/vehicles/[id]/page.tsx: <main> gains id="main-content", tabIndex={-1},
 *       focus-visible ring classes, data-vin and data-stock attributes
 *
 * These attributes enable skip-navigation ("Skip to main content" links) to
 * programmatically focus the landmark after a soft navigation.  The tests
 * read source files to guard against accidental regression.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const INVENTORY_PATH = resolve(__dirname, '../../app/inventory/page.tsx')
const VDP_PATH = resolve(__dirname, '../../app/vehicles/[id]/page.tsx')

const inventorySource = readFileSync(INVENTORY_PATH, 'utf-8')
const vdpSource = readFileSync(VDP_PATH, 'utf-8')

// ─────────────────────────────────────────────────────────────────────────────
// app/inventory/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
describe('app/inventory/page.tsx — <main> accessibility attributes', () => {
  it('contains id="main-content" on the <main> element', () => {
    expect(inventorySource).toContain('id="main-content"')
  })

  it('contains tabIndex={-1} for programmatic focus (skip-nav target)', () => {
    expect(inventorySource).toContain('tabIndex={-1}')
  })

  it('contains focus-visible:ring-2 for visible keyboard focus indicator', () => {
    expect(inventorySource).toContain('focus-visible:ring-2')
  })

  it('contains focus-visible:ring-primary for branded focus ring colour', () => {
    expect(inventorySource).toContain('focus-visible:ring-primary')
  })

  it('contains focus-visible:ring-offset-2 for ring offset', () => {
    expect(inventorySource).toContain('focus-visible:ring-offset-2')
  })

  it('does NOT have a raw tabindex="0" (only -1 is correct for programmatic focus)', () => {
    expect(inventorySource).not.toContain('tabIndex={0}')
  })

  it('applies id="main-content" in all three render branches (loading, error, main)', () => {
    const matches = [...inventorySource.matchAll(/id="main-content"/g)]
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })

  it('applies tabIndex={-1} in all three render branches', () => {
    const matches = [...inventorySource.matchAll(/tabIndex=\{-1\}/g)]
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })

  it('applies focus-visible:ring-2 in all three render branches', () => {
    const matches = [...inventorySource.matchAll(/focus-visible:ring-2/g)]
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })

  it('does NOT use outline-none on <main> elements (focus ring should be visible)', () => {
    // outline-none would suppress the focus indicator when skip-nav lands on <main>.
    // The correct approach is focus-visible:ring-* classes.
    const mainTags = inventorySource.match(/<main[^>]*>/g) || []
    for (const tag of mainTags) {
      expect(tag).not.toContain('outline-none')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// app/vehicles/[id]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
describe('app/vehicles/[id]/page.tsx — <main> accessibility and data attributes', () => {
  it('contains id="main-content" on the <main> element', () => {
    expect(vdpSource).toContain('id="main-content"')
  })

  it('contains tabIndex={-1} for programmatic focus (skip-nav target)', () => {
    expect(vdpSource).toContain('tabIndex={-1}')
  })

  it('contains focus-visible:ring-2 for visible keyboard focus indicator', () => {
    expect(vdpSource).toContain('focus-visible:ring-2')
  })

  it('contains focus-visible:ring-primary for branded focus ring colour', () => {
    expect(vdpSource).toContain('focus-visible:ring-primary')
  })

  it('contains focus-visible:ring-offset-2 for ring offset', () => {
    expect(vdpSource).toContain('focus-visible:ring-offset-2')
  })

  it('contains data-vin attribute for VIN-based E2E targeting', () => {
    expect(vdpSource).toContain('data-vin={vehicle.vin}')
  })

  it('contains data-stock attribute for stock-number-based E2E targeting', () => {
    expect(vdpSource).toContain('data-stock={vehicle.stockNumber}')
  })

  it('retains role="main" on the <main> element', () => {
    expect(vdpSource).toContain('role="main"')
  })

  it('retains aria-label="Vehicle details" on the <main> element', () => {
    expect(vdpSource).toContain('aria-label="Vehicle details"')
  })

  it('does NOT use tabIndex={0} on the <main> element (skip-nav targets should not be in the tab order)', () => {
    // tabIndex={0} is legitimately used on the image gallery div for
    // keyboard navigation, so we only check the <main> tag itself.
    const mainTagMatch = vdpSource.match(/<main[^>]*>/)
    if (mainTagMatch) {
      expect(mainTagMatch[0]).not.toContain('tabIndex={0}')
    }
  })

  it('does NOT use outline-none on the <main> element (VDP shows a focus ring)', () => {
    const mainTagMatch = vdpSource.match(/<main[^>]*className="([^"]*)"/)
    if (mainTagMatch) {
      expect(mainTagMatch[1]).not.toContain('outline-none')
    }
  })
})
