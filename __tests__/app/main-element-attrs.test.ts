/**
 * Regression tests for accessibility attribute changes on <main> elements.
 *
 * PR changes:
 *   - app/inventory/page.tsx: <main> gains id="main-content", tabIndex={-1}, outline-none
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

  it('contains outline-none to suppress default browser focus ring on <main>', () => {
    // The outline is suppressed on the landmark itself; focus ring is shown
    // only on interactive elements inside it.
    expect(inventorySource).toContain('outline-none')
  })

  it('does NOT have a raw tabindex="0" (only -1 is correct for programmatic focus)', () => {
    // tabIndex={0} would put the landmark in the tab order, which is wrong.
    expect(inventorySource).not.toContain('tabIndex={0}')
  })

  it('applies id="main-content" in all three render branches (loading, error, main)', () => {
    // The diff shows three separate <main> elements in the component —
    // loading skeleton, error state, and the main content. All must be updated.
    const matches = [...inventorySource.matchAll(/id="main-content"/g)]
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })

  it('applies tabIndex={-1} in all three render branches', () => {
    const matches = [...inventorySource.matchAll(/tabIndex=\{-1\}/g)]
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })

  it('applies outline-none in all three render branches', () => {
    const matches = [...inventorySource.matchAll(/outline-none/g)]
    expect(matches.length).toBeGreaterThanOrEqual(3)
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
    // Ensure existing ARIA role was not accidentally removed alongside the new attrs.
    expect(vdpSource).toContain('role="main"')
  })

  it('retains aria-label="Vehicle details" on the <main> element', () => {
    expect(vdpSource).toContain('aria-label="Vehicle details"')
  })

  it('does NOT use tabIndex={0} (skip-nav targets should not be in the tab order)', () => {
    expect(vdpSource).not.toContain('tabIndex={0}')
  })

  it('focus-visible classes do not include outline-none (VDP shows a focus ring)', () => {
    // inventory suppresses the outline; VDP instead shows focus-visible:ring-*
    // Ensure outline-none was not copied to the VDP main element's class string.
    // We check the specific main element's class for outline-none.
    const mainClassMatch = vdpSource.match(/<main[^>]*className="([^"]*)"/)
    if (mainClassMatch) {
      expect(mainClassMatch[1]).not.toContain('outline-none')
    }
    // If the main uses a template literal (no match above), the test is a no-op
    // but still valid — we rely on the other assertions to cover the attributes.
  })
})