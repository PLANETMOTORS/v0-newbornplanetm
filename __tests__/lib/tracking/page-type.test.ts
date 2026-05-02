import { describe, it, expect } from 'vitest'
import { getPageType } from '@/lib/tracking/page-type'

describe('getPageType', () => {
  it('returns homepage for /', () => {
    expect(getPageType('/')).toBe('homepage')
  })

  it('returns vdp for vehicle detail pages', () => {
    expect(getPageType('/vehicles/abc-123')).toBe('vdp')
    expect(getPageType('/vehicles/39a85812-9aab-41e8-a1dc-6aa156419912')).toBe('vdp')
  })

  it('returns srp for inventory pages', () => {
    expect(getPageType('/inventory')).toBe('srp')
    expect(getPageType('/inventory?make=Tesla')).toBe('srp')
  })

  it('returns finance for financing pages', () => {
    expect(getPageType('/financing')).toBe('finance')
    expect(getPageType('/financing/calculator')).toBe('finance')
  })

  it('returns trade_in for trade-in pages', () => {
    expect(getPageType('/trade-in')).toBe('trade_in')
    expect(getPageType('/trade-in/results')).toBe('trade_in')
  })

  it('returns service for service pages', () => {
    expect(getPageType('/service')).toBe('service')
  })

  it('returns contact for contact pages', () => {
    expect(getPageType('/contact')).toBe('contact')
  })

  it('returns about for about pages', () => {
    expect(getPageType('/about')).toBe('about')
  })

  it('returns blog for blog and resources pages', () => {
    expect(getPageType('/blog')).toBe('blog')
    expect(getPageType('/blog/tesla-cybertruck-2024')).toBe('blog')
    expect(getPageType('/resources')).toBe('blog')
  })

  it('returns legal for privacy and terms pages', () => {
    expect(getPageType('/privacy')).toBe('legal')
    expect(getPageType('/terms')).toBe('legal')
  })

  it('returns other for unknown pages', () => {
    expect(getPageType('/checkout')).toBe('other')
    expect(getPageType('/admin')).toBe('other')
  })
})
