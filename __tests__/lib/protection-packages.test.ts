/**
 * Tests for lib/constants/protection-packages.ts
 *
 * Covers:
 *  1. PROTECTION_PACKAGES — data shape, counts, and per-package values
 *  2. COMPARISON_ROWS — count and required structure
 *  3. getPackageById() — happy path, unknown ID, empty string
 *  4. getCheckoutPackages() — returns all packages
 *  5. CHECKOUT_PLANS — correct mapping from PROTECTION_PACKAGES (incl. warrantyLabel and feature labels)
 */

import { describe, it, expect } from 'vitest'
import {
  PROTECTION_PACKAGES,
  COMPARISON_ROWS,
  CHECKOUT_PLANS,
  getPackageById,
  getCheckoutPackages,
  type ProtectionPackage,
  type CheckoutPlan,
} from '@/lib/constants/protection-packages'

// ─── PROTECTION_PACKAGES ────────────────────────────────────────────────────

describe('PROTECTION_PACKAGES', () => {
  it('contains exactly 4 packages', () => {
    expect(PROTECTION_PACKAGES).toHaveLength(4)
  })

  it('has packages with IDs: basic, essential, certified, certified-plus', () => {
    const ids = PROTECTION_PACKAGES.map((p) => p.id)
    expect(ids).toContain('basic')
    expect(ids).toContain('essential')
    expect(ids).toContain('certified')
    expect(ids).toContain('certified-plus')
  })

  it('every package has the required shape', () => {
    for (const pkg of PROTECTION_PACKAGES) {
      expect(typeof pkg.id).toBe('string')
      expect(typeof pkg.name).toBe('string')
      expect(typeof pkg.shortName).toBe('string')
      expect(typeof pkg.priceFrom).toBe('number')
      expect(typeof pkg.deposit).toBe('number')
      expect(['cash', 'finance', 'cash_and_finance']).toContain(pkg.paymentMethod)
      expect(['none', 'standard', 'extended']).toContain(pkg.warranty)
      expect(typeof pkg.features).toBe('object')
      expect(typeof pkg.description).toBe('string')
      expect(typeof pkg.highlighted).toBe('boolean')
    }
  })

  it('every package features object has all 9 required boolean flags', () => {
    const requiredFlags: Array<keyof ProtectionPackage['features']> = [
      'returnPolicy',
      'tradeInCredit',
      'detailing',
      'fullTankOfGas',
      'tireRimProtection',
      'rustProtection',
      'freeDelivery',
      'inspection',
      'safetyCertificate',
    ]
    for (const pkg of PROTECTION_PACKAGES) {
      for (const flag of requiredFlags) {
        expect(typeof pkg.features[flag]).toBe('boolean')
      }
    }
  })

  describe('basic package', () => {
    let basic: ProtectionPackage

    beforeAll(() => {
      basic = PROTECTION_PACKAGES.find((p) => p.id === 'basic')!
    })

    it('has priceFrom of 0', () => {
      expect(basic.priceFrom).toBe(0)
    })

    it('has deposit of 0', () => {
      expect(basic.deposit).toBe(0)
    })

    it('has warranty of "none"', () => {
      expect(basic.warranty).toBe('none')
    })

    it('has paymentMethod of "cash"', () => {
      expect(basic.paymentMethod).toBe('cash')
    })

    it('is not highlighted', () => {
      expect(basic.highlighted).toBe(false)
    })

    it('has no badge', () => {
      expect(basic.badge).toBeUndefined()
    })

    it('has inspection and safetyCertificate true', () => {
      expect(basic.features.inspection).toBe(true)
      expect(basic.features.safetyCertificate).toBe(true)
    })

    it('has no tire/rim, rust, or delivery features', () => {
      expect(basic.features.tireRimProtection).toBe(false)
      expect(basic.features.rustProtection).toBe(false)
      expect(basic.features.freeDelivery).toBe(false)
    })
  })

  describe('essential package', () => {
    let essential: ProtectionPackage

    beforeAll(() => {
      essential = PROTECTION_PACKAGES.find((p) => p.id === 'essential')!
    })

    it('has priceFrom of 1950', () => {
      expect(essential.priceFrom).toBe(1950)
    })

    it('has deposit of 250', () => {
      expect(essential.deposit).toBe(250)
    })

    it('has warranty of "standard"', () => {
      expect(essential.warranty).toBe('standard')
    })

    it('has paymentMethod of "cash_and_finance"', () => {
      expect(essential.paymentMethod).toBe('cash_and_finance')
    })

    it('is not highlighted', () => {
      expect(essential.highlighted).toBe(false)
    })

    it('has tradeInCredit enabled', () => {
      expect(essential.features.tradeInCredit).toBe(true)
    })

    it('does not include tire/rim or rust protection', () => {
      expect(essential.features.tireRimProtection).toBe(false)
      expect(essential.features.rustProtection).toBe(false)
    })
  })

  describe('certified package (new in PR)', () => {
    let certified: ProtectionPackage

    beforeAll(() => {
      certified = PROTECTION_PACKAGES.find((p) => p.id === 'certified')!
    })

    it('exists in the packages array', () => {
      expect(certified).toBeDefined()
    })

    it('has name "PlanetCare Certified™"', () => {
      expect(certified.name).toBe('PlanetCare Certified™')
    })

    it('has shortName "Certified™"', () => {
      expect(certified.shortName).toBe('Certified™')
    })

    it('has priceFrom of 3000', () => {
      expect(certified.priceFrom).toBe(3000)
    })

    it('has deposit of 250', () => {
      expect(certified.deposit).toBe(250)
    })

    it('has warranty of "extended"', () => {
      expect(certified.warranty).toBe('extended')
    })

    it('has paymentMethod of "cash_and_finance"', () => {
      expect(certified.paymentMethod).toBe('cash_and_finance')
    })

    it('is highlighted (recommended package)', () => {
      expect(certified.highlighted).toBe(true)
    })

    it('has badge "Most Popular"', () => {
      expect(certified.badge).toBe('Most Popular')
    })

    it('has freeDelivery enabled', () => {
      expect(certified.features.freeDelivery).toBe(true)
    })

    it('does not include tire/rim or rust protection', () => {
      expect(certified.features.tireRimProtection).toBe(false)
      expect(certified.features.rustProtection).toBe(false)
    })

    it('has all base features enabled', () => {
      expect(certified.features.returnPolicy).toBe(true)
      expect(certified.features.tradeInCredit).toBe(true)
      expect(certified.features.detailing).toBe(true)
      expect(certified.features.fullTankOfGas).toBe(true)
      expect(certified.features.inspection).toBe(true)
      expect(certified.features.safetyCertificate).toBe(true)
    })

    it('has maxCoverage defined', () => {
      expect(certified.maxCoverage).toBeDefined()
      expect(typeof certified.maxCoverage).toBe('string')
    })
  })

  describe('certified-plus package (new in PR)', () => {
    let certifiedPlus: ProtectionPackage

    beforeAll(() => {
      certifiedPlus = PROTECTION_PACKAGES.find((p) => p.id === 'certified-plus')!
    })

    it('exists in the packages array', () => {
      expect(certifiedPlus).toBeDefined()
    })

    it('has name "PlanetCare Certified Plus™"', () => {
      expect(certifiedPlus.name).toBe('PlanetCare Certified Plus™')
    })

    it('has shortName "Certified Plus™"', () => {
      expect(certifiedPlus.shortName).toBe('Certified Plus™')
    })

    it('has priceFrom of 4850', () => {
      expect(certifiedPlus.priceFrom).toBe(4850)
    })

    it('has deposit of 250', () => {
      expect(certifiedPlus.deposit).toBe(250)
    })

    it('has warranty of "extended"', () => {
      expect(certifiedPlus.warranty).toBe('extended')
    })

    it('has paymentMethod of "finance" only', () => {
      expect(certifiedPlus.paymentMethod).toBe('finance')
    })

    it('is not highlighted', () => {
      expect(certifiedPlus.highlighted).toBe(false)
    })

    it('has badge "Best Value"', () => {
      expect(certifiedPlus.badge).toBe('Best Value')
    })

    it('has ALL features enabled', () => {
      expect(certifiedPlus.features.tireRimProtection).toBe(true)
      expect(certifiedPlus.features.rustProtection).toBe(true)
      expect(certifiedPlus.features.freeDelivery).toBe(true)
      expect(certifiedPlus.features.returnPolicy).toBe(true)
      expect(certifiedPlus.features.tradeInCredit).toBe(true)
      expect(certifiedPlus.features.detailing).toBe(true)
      expect(certifiedPlus.features.fullTankOfGas).toBe(true)
      expect(certifiedPlus.features.inspection).toBe(true)
      expect(certifiedPlus.features.safetyCertificate).toBe(true)
    })

    it('has maxCoverage defined', () => {
      expect(certifiedPlus.maxCoverage).toBeDefined()
    })
  })

  it('exactly one package is highlighted', () => {
    const highlighted = PROTECTION_PACKAGES.filter((p) => p.highlighted)
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0].id).toBe('certified')
  })

  it('packages are ordered by ascending price (basic → essential → certified → certified-plus)', () => {
    const prices = PROTECTION_PACKAGES.map((p) => p.priceFrom)
    const sorted = [...prices].sort((a, b) => a - b)
    expect(prices).toEqual(sorted)
  })
})

// ─── COMPARISON_ROWS ────────────────────────────────────────────────────────

describe('COMPARISON_ROWS', () => {
  it('contains exactly 12 rows', () => {
    expect(COMPARISON_ROWS).toHaveLength(12)
  })

  it('every row has a non-empty key and label', () => {
    for (const row of COMPARISON_ROWS) {
      expect(typeof row.key).toBe('string')
      expect(row.key.length).toBeGreaterThan(0)
      expect(typeof row.label).toBe('string')
      expect(row.label.length).toBeGreaterThan(0)
    }
  })

  it('includes the paymentMethod row', () => {
    expect(COMPARISON_ROWS.some((r) => r.key === 'paymentMethod')).toBe(true)
  })

  it('includes the deposit row', () => {
    expect(COMPARISON_ROWS.some((r) => r.key === 'deposit')).toBe(true)
  })

  it('includes the warranty row', () => {
    expect(COMPARISON_ROWS.some((r) => r.key === 'warranty')).toBe(true)
  })

  it('includes tireRimProtection row', () => {
    expect(COMPARISON_ROWS.some((r) => r.key === 'tireRimProtection')).toBe(true)
  })

  it('includes rustProtection row', () => {
    expect(COMPARISON_ROWS.some((r) => r.key === 'rustProtection')).toBe(true)
  })

  it('includes freeDelivery row', () => {
    expect(COMPARISON_ROWS.some((r) => r.key === 'freeDelivery')).toBe(true)
  })

  it('has unique keys', () => {
    const keys = COMPARISON_ROWS.map((r) => r.key)
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })
})

// ─── getPackageById ──────────────────────────────────────────────────────────

describe('getPackageById', () => {
  it('returns the basic package by ID', () => {
    const pkg = getPackageById('basic')
    expect(pkg).toBeDefined()
    expect(pkg!.id).toBe('basic')
  })

  it('returns the essential package by ID', () => {
    const pkg = getPackageById('essential')
    expect(pkg).toBeDefined()
    expect(pkg!.id).toBe('essential')
  })

  it('returns the certified package by ID', () => {
    const pkg = getPackageById('certified')
    expect(pkg).toBeDefined()
    expect(pkg!.id).toBe('certified')
    expect(pkg!.name).toBe('PlanetCare Certified™')
  })

  it('returns the certified-plus package by ID', () => {
    const pkg = getPackageById('certified-plus')
    expect(pkg).toBeDefined()
    expect(pkg!.id).toBe('certified-plus')
    expect(pkg!.name).toBe('PlanetCare Certified Plus™')
  })

  it('returns undefined for an unknown ID', () => {
    expect(getPackageById('unknown-plan')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(getPackageById('')).toBeUndefined()
  })

  it('is case-sensitive (uppercase does not match)', () => {
    expect(getPackageById('CERTIFIED')).toBeUndefined()
    expect(getPackageById('Basic')).toBeUndefined()
  })

  it('returns undefined for "smart" (old plan removed from packages)', () => {
    expect(getPackageById('smart')).toBeUndefined()
  })

  it('returns undefined for "lifeproof" (old plan removed from packages)', () => {
    expect(getPackageById('lifeproof')).toBeUndefined()
  })
})

// ─── getCheckoutPackages ─────────────────────────────────────────────────────

describe('getCheckoutPackages', () => {
  it('returns all 4 packages', () => {
    expect(getCheckoutPackages()).toHaveLength(4)
  })

  it('returns the same reference as PROTECTION_PACKAGES', () => {
    expect(getCheckoutPackages()).toBe(PROTECTION_PACKAGES)
  })

  it('includes certified and certified-plus packages', () => {
    const packages = getCheckoutPackages()
    expect(packages.some((p) => p.id === 'certified')).toBe(true)
    expect(packages.some((p) => p.id === 'certified-plus')).toBe(true)
  })
})

// ─── CHECKOUT_PLANS ──────────────────────────────────────────────────────────

describe('CHECKOUT_PLANS', () => {
  it('has the same length as PROTECTION_PACKAGES', () => {
    expect(CHECKOUT_PLANS).toHaveLength(PROTECTION_PACKAGES.length)
  })

  it('every plan has the CheckoutPlan shape', () => {
    for (const plan of CHECKOUT_PLANS) {
      expect(typeof plan.id).toBe('string')
      expect(typeof plan.name).toBe('string')
      expect(typeof plan.price).toBe('number')
      expect(typeof plan.description).toBe('string')
      expect(Array.isArray(plan.features)).toBe(true)
      expect(typeof plan.deposit).toBe('number')
      expect(typeof plan.highlighted).toBe('boolean')
    }
  })

  describe('basic plan mapping', () => {
    let basic: CheckoutPlan

    beforeAll(() => {
      basic = CHECKOUT_PLANS.find((p) => p.id === 'basic')!
    })

    it('maps price from priceFrom', () => {
      expect(basic.price).toBe(0)
    })

    it('has no warranty label in features (warranty is "none")', () => {
      expect(basic.features.some((f) => f.toLowerCase().includes('warranty'))).toBe(false)
    })

    it('includes safety certificate feature label', () => {
      expect(basic.features.some((f) => f.toLowerCase().includes('safety'))).toBe(true)
    })

    it('does not include freeDelivery feature label (feature is false)', () => {
      const freeDelivery = basic.features.some((f) => f.toLowerCase().includes('delivery'))
      expect(freeDelivery).toBe(false)
    })
  })

  describe('essential plan mapping', () => {
    let essential: CheckoutPlan

    beforeAll(() => {
      essential = CHECKOUT_PLANS.find((p) => p.id === 'essential')!
    })

    it('has price of 1950', () => {
      expect(essential.price).toBe(1950)
    })

    it('includes "Standard warranty" in features', () => {
      expect(essential.features).toContain('Standard warranty')
    })

    it('includes trade-in credit label', () => {
      expect(essential.features.some((f) => f.toLowerCase().includes('trade-in'))).toBe(true)
    })

    it('does not include tire & rim or rust protection (features are false)', () => {
      expect(essential.features.some((f) => f.toLowerCase().includes('tire'))).toBe(false)
      expect(essential.features.some((f) => f.toLowerCase().includes('rust'))).toBe(false)
    })
  })

  describe('certified plan mapping (new in PR)', () => {
    let certified: CheckoutPlan

    beforeAll(() => {
      certified = CHECKOUT_PLANS.find((p) => p.id === 'certified')!
    })

    it('exists in CHECKOUT_PLANS', () => {
      expect(certified).toBeDefined()
    })

    it('has price of 3000', () => {
      expect(certified.price).toBe(3000)
    })

    it('includes "Extended warranty" in features', () => {
      expect(certified.features).toContain('Extended warranty')
    })

    it('includes FREE delivery in features', () => {
      expect(certified.features.some((f) => f.toLowerCase().includes('delivery'))).toBe(true)
    })

    it('is highlighted', () => {
      expect(certified.highlighted).toBe(true)
    })

    it('has badge "Most Popular"', () => {
      expect(certified.badge).toBe('Most Popular')
    })

    it('does not include tire & rim or rust protection (features are false)', () => {
      expect(certified.features.some((f) => f.toLowerCase().includes('tire'))).toBe(false)
      expect(certified.features.some((f) => f.toLowerCase().includes('rust'))).toBe(false)
    })
  })

  describe('certified-plus plan mapping (new in PR)', () => {
    let certifiedPlus: CheckoutPlan

    beforeAll(() => {
      certifiedPlus = CHECKOUT_PLANS.find((p) => p.id === 'certified-plus')!
    })

    it('exists in CHECKOUT_PLANS', () => {
      expect(certifiedPlus).toBeDefined()
    })

    it('has price of 4850', () => {
      expect(certifiedPlus.price).toBe(4850)
    })

    it('includes "Extended warranty" in features', () => {
      expect(certifiedPlus.features).toContain('Extended warranty')
    })

    it('includes tire & rim protection in features', () => {
      expect(certifiedPlus.features.some((f) => f.toLowerCase().includes('tire'))).toBe(true)
    })

    it('includes rust protection in features', () => {
      expect(certifiedPlus.features.some((f) => f.toLowerCase().includes('rust'))).toBe(true)
    })

    it('includes FREE delivery in features', () => {
      expect(certifiedPlus.features.some((f) => f.toLowerCase().includes('delivery'))).toBe(true)
    })

    it('is not highlighted', () => {
      expect(certifiedPlus.highlighted).toBe(false)
    })

    it('has badge "Best Value"', () => {
      expect(certifiedPlus.badge).toBe('Best Value')
    })
  })

  it('only one plan is highlighted in CHECKOUT_PLANS', () => {
    const highlighted = CHECKOUT_PLANS.filter((p) => p.highlighted)
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0].id).toBe('certified')
  })

  it('each plan id in CHECKOUT_PLANS corresponds to a PROTECTION_PACKAGE id', () => {
    const packageIds = new Set(PROTECTION_PACKAGES.map((p) => p.id))
    for (const plan of CHECKOUT_PLANS) {
      expect(packageIds.has(plan.id)).toBe(true)
    }
  })

  it('features for a package with all features enabled includes all 9 labels plus warranty', () => {
    const certifiedPlus = CHECKOUT_PLANS.find((p) => p.id === 'certified-plus')!
    // extended warranty + 9 feature flags all true = 10 feature strings
    expect(certifiedPlus.features.length).toBe(10)
  })

  it('features for basic (no warranty, minimal features) only includes returnPolicy, inspection and safety cert', () => {
    const basic = CHECKOUT_PLANS.find((p) => p.id === 'basic')!
    // returnPolicy=true, inspection=true, safetyCertificate=true are all true; no warranty label
    expect(basic.features.length).toBe(3)
  })
})