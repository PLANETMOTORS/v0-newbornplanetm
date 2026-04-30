// @vitest-environment jsdom
/**
 * Renders <CategoryJsonLd> and parses the emitted JSON-LD scripts to
 * verify the schema.org shape is correct (ItemList + BreadcrumbList).
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CategoryJsonLd } from '@/components/seo/category-jsonld'
import type { CategoryFilter } from '@/lib/seo/category-slug-parser'
import type { CategoryVehicle } from '@/lib/vehicles/fetch-by-filter'

const filter: CategoryFilter = {
  slug: 'electric-in-toronto',
  canonicalPath: '/cars/electric-in-toronto',
  h1: 'Electric Vehicles in Toronto',
  metaTitle: 'Electric Vehicles in Toronto for Sale | Planet Motors',
  metaDescription: 'desc',
  shortDescription: 'EVs in Toronto',
  fuelTypeDb: 'Electric',
  citySlug: 'toronto',
}

const vehicles: CategoryVehicle[] = [
  {
    id: 'abc-123',
    year: 2024,
    make: 'Tesla',
    model: 'Model 3',
    trim: 'Long Range',
    bodyStyle: 'Sedan',
    fuelType: 'Electric',
    price: 64990,
    mileage: 12000,
    primaryImageUrl: 'https://cdn.example.com/m3.jpg',
    isEv: true,
    evBatteryHealthPercent: 96,
    status: 'available',
  },
  {
    id: 'def-456',
    year: 2023,
    make: 'BMW',
    model: 'i4',
    trim: null,
    bodyStyle: 'Sedan',
    fuelType: 'Electric',
    price: 54990,
    mileage: 18000,
    primaryImageUrl: null,
    isEv: true,
    evBatteryHealthPercent: 91,
    status: 'reserved',
  },
  {
    id: 'ghi-789',
    year: 2022,
    make: 'Audi',
    model: 'e-tron',
    trim: 'Premium',
    bodyStyle: 'SUV',
    fuelType: 'Electric',
    price: 49990,
    mileage: 25000,
    primaryImageUrl: 'https://cdn.example.com/etron.jpg',
    isEv: true,
    evBatteryHealthPercent: 88,
    status: 'sold',
  },
]

function parseJsonLd(container: HTMLElement) {
  const scripts = container.querySelectorAll('script[type="application/ld+json"]')
  return Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'))
}

describe('CategoryJsonLd', () => {
  it('emits two JSON-LD scripts (ItemList + BreadcrumbList)', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={vehicles} />)
    const blobs = parseJsonLd(container)
    expect(blobs).toHaveLength(2)
    expect(blobs.map((b) => b['@type']).sort()).toEqual(['BreadcrumbList', 'ItemList'])
  })

  it('ItemList includes one entry per vehicle in original order', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={vehicles} />)
    const itemList = parseJsonLd(container).find((b) => b['@type'] === 'ItemList')
    expect(itemList.itemListElement).toHaveLength(3)
    expect(itemList.itemListElement[0].position).toBe(1)
    expect(itemList.itemListElement[2].position).toBe(3)
    expect(itemList.numberOfItems).toBe(3)
  })

  it('each ListItem nests a Vehicle with brand+model+offer', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={vehicles} />)
    const itemList = parseJsonLd(container).find((b) => b['@type'] === 'ItemList')
    const first = itemList.itemListElement[0].item
    expect(first['@type']).toBe('Vehicle')
    expect(first.brand.name).toBe('Tesla')
    expect(first.model).toBe('Model 3')
    expect(first.offers.price).toBe(64990)
    expect(first.offers.priceCurrency).toBe('CAD')
    expect(first.offers.availability).toBe('https://schema.org/InStock')
  })

  it('maps reserved status to PreOrder availability', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={[vehicles[1]]} />)
    const itemList = parseJsonLd(container).find((b) => b['@type'] === 'ItemList')
    expect(itemList.itemListElement[0].item.offers.availability).toBe(
      'https://schema.org/PreOrder',
    )
  })

  it('maps sold status to SoldOut availability', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={[vehicles[2]]} />)
    const itemList = parseJsonLd(container).find((b) => b['@type'] === 'ItemList')
    expect(itemList.itemListElement[0].item.offers.availability).toBe(
      'https://schema.org/SoldOut',
    )
  })

  it('handles vehicles without primary image (image field undefined)', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={[vehicles[1]]} />)
    const itemList = parseJsonLd(container).find((b) => b['@type'] === 'ItemList')
    expect(itemList.itemListElement[0].item.image).toBeUndefined()
  })

  it('omits trim suffix when trim is null', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={[vehicles[1]]} />)
    const itemList = parseJsonLd(container).find((b) => b['@type'] === 'ItemList')
    expect(itemList.itemListElement[0].item.name).toBe('2023 BMW i4')
  })

  it('includes trim suffix when present', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={[vehicles[0]]} />)
    const itemList = parseJsonLd(container).find((b) => b['@type'] === 'ItemList')
    expect(itemList.itemListElement[0].item.name).toBe('2024 Tesla Model 3 Long Range')
  })

  it('mileage is exposed as KMT QuantitativeValue', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={[vehicles[0]]} />)
    const itemList = parseJsonLd(container).find((b) => b['@type'] === 'ItemList')
    const m = itemList.itemListElement[0].item.mileageFromOdometer
    expect(m['@type']).toBe('QuantitativeValue')
    expect(m.unitCode).toBe('KMT')
    expect(m.value).toBe(12000)
  })

  it('BreadcrumbList has 3 items: Home → Inventory → Category', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={vehicles} />)
    const crumbs = parseJsonLd(container).find((b) => b['@type'] === 'BreadcrumbList')
    expect(crumbs.itemListElement).toHaveLength(3)
    expect(crumbs.itemListElement[0].name).toBe('Home')
    expect(crumbs.itemListElement[1].name).toBe('Inventory')
    expect(crumbs.itemListElement[2].name).toBe(filter.h1)
  })

  it('uses the filter canonicalPath for the ItemList url', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={vehicles} />)
    const itemList = parseJsonLd(container).find((b) => b['@type'] === 'ItemList')
    expect(itemList.url).toContain('/cars/electric-in-toronto')
  })

  it('renders no items but still emits both blocks for empty vehicle list', () => {
    const { container } = render(<CategoryJsonLd filter={filter} vehicles={[]} />)
    const blobs = parseJsonLd(container)
    expect(blobs).toHaveLength(2)
    const itemList = blobs.find((b) => b['@type'] === 'ItemList')
    expect(itemList.itemListElement).toEqual([])
    expect(itemList.numberOfItems).toBe(0)
  })
})
