import { describe, it, expect } from 'vitest'
import {
  canonicalize,
  toUrlSlug,
  normalizeMake,
  normalizeModel,
  matchesMake,
  matchesModel,
  modelVariantsForSlug,
} from '@/lib/seo/make-model-normalizer'

describe('make-model-normalizer', () => {
  describe('canonicalize', () => {
    it('lowercases + strips non-alphanumerics', () => {
      expect(canonicalize('RAV-4')).toBe('rav4')
      expect(canonicalize('CR-V')).toBe('crv')
      expect(canonicalize('Model 3')).toBe('model3')
      expect(canonicalize('F-150')).toBe('f150')
      expect(canonicalize('Mercedes-Benz')).toBe('mercedesbenz')
    })

    it('returns empty string for null/undefined/empty', () => {
      expect(canonicalize(null)).toBe('')
      expect(canonicalize(undefined)).toBe('')
      expect(canonicalize('')).toBe('')
    })
  })

  describe('toUrlSlug', () => {
    it('produces hyphenated lowercase URLs', () => {
      expect(toUrlSlug('Mercedes-Benz')).toBe('mercedes-benz')
      expect(toUrlSlug('Mustang Mach-E')).toBe('mustang-mach-e')
      expect(toUrlSlug('RAV4')).toBe('rav4')
      expect(toUrlSlug('CR-V')).toBe('cr-v')
    })

    it('collapses repeated punctuation/whitespace', () => {
      expect(toUrlSlug('Land  Rover')).toBe('land-rover')
      expect(toUrlSlug('Range_Rover')).toBe('range-rover')
      expect(toUrlSlug('  -BMW-  ')).toBe('bmw')
    })

    it('strips emoji and non-ascii', () => {
      expect(toUrlSlug('Tesla 🚗')).toBe('tesla')
    })
  })

  describe('normalizeMake', () => {
    it('handles direct matches', () => {
      expect(normalizeMake('Toyota')).toBe('toyota')
      expect(normalizeMake('BMW')).toBe('bmw')
      expect(normalizeMake('Tesla')).toBe('tesla')
    })

    it('resolves aliases', () => {
      expect(normalizeMake('Mercedes')).toBe('mercedes-benz')
      expect(normalizeMake('MercedesBenz')).toBe('mercedes-benz')
      expect(normalizeMake('Mercedes-Benz')).toBe('mercedes-benz')
      expect(normalizeMake('VW')).toBe('volkswagen')
      expect(normalizeMake('Chevy')).toBe('chevrolet')
      expect(normalizeMake('Range Rover')).toBe('land-rover')
    })

    it('returns empty for falsy', () => {
      expect(normalizeMake(null)).toBe('')
      expect(normalizeMake('')).toBe('')
    })
  })

  describe('normalizeModel', () => {
    it('canonicalizes RAV4 spellings', () => {
      expect(normalizeModel('RAV4')).toBe('rav4')
      expect(normalizeModel('RAV-4')).toBe('rav4')
      expect(normalizeModel('rav 4')).toBe('rav4')
    })

    it('canonicalizes CR-V spellings', () => {
      expect(normalizeModel('CR-V')).toBe('cr-v')
      expect(normalizeModel('CRV')).toBe('cr-v')
      expect(normalizeModel('cr v')).toBe('cr-v')
    })

    it('canonicalizes F-150 spellings', () => {
      expect(normalizeModel('F-150')).toBe('f-150')
      expect(normalizeModel('F150')).toBe('f-150')
    })

    it('canonicalizes Mustang Mach-E spellings', () => {
      expect(normalizeModel('Mustang Mach-E')).toBe('mustang-mach-e')
      expect(normalizeModel('mustang mach e')).toBe('mustang-mach-e')
      expect(normalizeModel('MustangMachE')).toBe('mustang-mach-e')
    })

    it('canonicalizes Tesla model spellings', () => {
      expect(normalizeModel('Model Y')).toBe('model-y')
      expect(normalizeModel('ModelY')).toBe('model-y')
      expect(normalizeModel('Model 3')).toBe('model-3')
      expect(normalizeModel('Model S')).toBe('model-s')
    })

    it('canonicalizes Hyundai EV spellings', () => {
      expect(normalizeModel('Ioniq 5')).toBe('ioniq-5')
      expect(normalizeModel('Ioniq5')).toBe('ioniq-5')
      expect(normalizeModel('IONIQ 6')).toBe('ioniq-6')
    })

    it('passes through unknown models', () => {
      expect(normalizeModel('Camry')).toBe('camry')
      expect(normalizeModel('Civic')).toBe('civic')
    })
  })

  describe('matchesMake', () => {
    it('matches exact slugs', () => {
      expect(matchesMake('Mercedes-Benz', 'mercedes-benz')).toBe(true)
      expect(matchesMake('BMW', 'bmw')).toBe(true)
    })

    it('matches via aliases', () => {
      expect(matchesMake('Mercedes', 'mercedes-benz')).toBe(true)
      expect(matchesMake('VW', 'volkswagen')).toBe(true)
    })

    it('rejects non-matches', () => {
      expect(matchesMake('BMW', 'tesla')).toBe(false)
      expect(matchesMake('Toyota', 'honda')).toBe(false)
    })

    it('handles null/undefined gracefully', () => {
      expect(matchesMake(null, 'tesla')).toBe(false)
      expect(matchesMake(undefined, 'tesla')).toBe(false)
    })
  })

  describe('matchesModel', () => {
    it('matches RAV4 spellings', () => {
      expect(matchesModel('RAV4', 'rav4')).toBe(true)
      expect(matchesModel('RAV-4', 'rav4')).toBe(true)
    })

    it('matches CR-V variants', () => {
      expect(matchesModel('CR-V', 'cr-v')).toBe(true)
      expect(matchesModel('CRV', 'cr-v')).toBe(true)
    })

    it('matches F-150 variants', () => {
      expect(matchesModel('F-150', 'f-150')).toBe(true)
      expect(matchesModel('F150', 'f-150')).toBe(true)
    })

    it('rejects non-matches', () => {
      expect(matchesModel('Camry', 'rav4')).toBe(false)
      expect(matchesModel('Model Y', 'model-3')).toBe(false)
    })
  })

  describe('modelVariantsForSlug', () => {
    it('produces variant list for CR-V', () => {
      const variants = modelVariantsForSlug('cr-v')
      expect(variants).toContain('cr-v')
      expect(variants).toContain('crv')
    })

    it('produces variant list for RAV4', () => {
      const variants = modelVariantsForSlug('rav4')
      expect(variants).toContain('rav4')
      expect(variants).toContain('rav-4')
    })

    it('produces variant list for F-150', () => {
      const variants = modelVariantsForSlug('f-150')
      expect(variants).toContain('f-150')
      expect(variants).toContain('f150')
    })

    it('removes empty entries', () => {
      const variants = modelVariantsForSlug('rav4')
      expect(variants.every((v) => v.length > 0)).toBe(true)
    })
  })
})
