import { describe, it, expect } from 'vitest'
import {
  getOptimizedImageUrl, getSpinFrameUrl, getAllSpinFrameUrls,
  getPrioritySpinFrames, getInventoryCardUrl, getResponsiveSrcSet, getOgImageUrl,
} from '@/lib/image-utils'

describe('image-utils', () => {
  describe('getOptimizedImageUrl', () => {
    it('returns a URL with default params', () => {
      const url = getOptimizedImageUrl('vehicles/123/primary.jpg')
      expect(url).toContain('vehicles/123/primary.jpg')
      expect(url).toContain('q=80')
      expect(url).toContain('fit=crop')
      expect(url).toContain('fm=avif')
    })

    it('includes width and height when provided', () => {
      const url = getOptimizedImageUrl('test.jpg', { width: 800, height: 600 })
      expect(url).toContain('w=800')
      expect(url).toContain('h=600')
    })

    it('does not include fm param when format is auto', () => {
      const url = getOptimizedImageUrl('test.jpg', { format: 'auto' })
      expect(url).not.toContain('fm=')
    })

    it('includes blur param when set', () => {
      const url = getOptimizedImageUrl('test.jpg', { blur: 20 })
      expect(url).toContain('blur=20')
    })

    it('includes dpr param when set', () => {
      const url = getOptimizedImageUrl('test.jpg', { dpr: 2 })
      expect(url).toContain('dpr=2')
    })
  })

  describe('getSpinFrameUrl', () => {
    it('zero-pads frame number to 3 digits', () => {
      const url = getSpinFrameUrl('abc', 5)
      expect(url).toContain('spin/005.jpg')
    })

    it('returns thumbnail URL with blur when thumbnail option set', () => {
      const url = getSpinFrameUrl('abc', 1, { thumbnail: true })
      expect(url).toContain('blur=20')
      expect(url).toContain('w=400')
    })

    it('returns mobile URL when mobile option set', () => {
      const url = getSpinFrameUrl('abc', 1, { mobile: true })
      expect(url).toContain('w=800')
    })

    it('returns full-size URL by default', () => {
      const url = getSpinFrameUrl('abc', 1)
      expect(url).toContain('w=1200')
    })
  })

  describe('getAllSpinFrameUrls', () => {
    it('returns 36 URLs by default', () => {
      expect(getAllSpinFrameUrls('xyz').length).toBe(36)
    })

    it('respects custom frameCount', () => {
      expect(getAllSpinFrameUrls('xyz', 12).length).toBe(12)
    })
  })

  describe('getPrioritySpinFrames', () => {
    it('returns exactly 4 priority frames', () => {
      expect(getPrioritySpinFrames('xyz').length).toBe(4)
    })
  })

  describe('getInventoryCardUrl', () => {
    it('returns standard width URL', () => {
      const url = getInventoryCardUrl('v1')
      expect(url).toContain('w=600')
    })

    it('returns retina URL when retina=true', () => {
      const url = getInventoryCardUrl('v1', true)
      expect(url).toContain('w=1200')
    })
  })

  describe('getResponsiveSrcSet', () => {
    it('returns srcset with correct format', () => {
      const srcset = getResponsiveSrcSet('test.jpg', [400, 800])
      expect(srcset).toContain('400w')
      expect(srcset).toContain('800w')
    })
  })

  describe('getOgImageUrl', () => {
    it('returns 1200x630 jpg URL', () => {
      const url = getOgImageUrl('v1')
      expect(url).toContain('w=1200')
      expect(url).toContain('h=630')
      expect(url).toContain('fm=jpg')
    })
  })
})
