/**
 * Tests for the filtering logic used by useVehicleFilters.
 *
 * The hook depends on Next.js navigation hooks (useSearchParams, useRouter,
 * usePathname) which require a browser-like environment. We therefore test the
 * core algorithms — active-filter counting and URL param construction — as
 * isolated pure functions mirroring the hook implementation.
 *
 * All logic is taken verbatim from hooks/use-vehicle-filters.ts.
 */
import { describe, it, expect } from 'vitest'
import type { VehicleFilters } from '@/hooks/use-vehicle-filters'

// ---------------------------------------------------------------------------
// Local copy of the defaults and helper logic (mirrors the source module)
// ---------------------------------------------------------------------------

const defaultFilters: VehicleFilters = {
  search: '',
  make: '',
  model: '',
  year: '',
  minPrice: '',
  maxPrice: '',
  minMileage: '',
  maxMileage: '',
  fuelType: '',
  transmission: '',
  drivetrain: '',
  bodyStyle: '',
  color: '',
  evOnly: '',
  sort: 'featured',
  view: 'grid',
  page: '1',
}

/** Replicates the activeFilterCount useMemo from useVehicleFilters */
function calcActiveFilterCount(filters: VehicleFilters): number {
  let count = 0
  const excludeFromCount = new Set(['sort', 'view', 'page'])
  Object.entries(filters).forEach(([key, value]) => {
    if (
      value &&
      !excludeFromCount.has(key) &&
      value !== defaultFilters[key as keyof VehicleFilters]
    ) {
      count++
    }
  })
  return count
}

/**
 * Replicates the setFilter URL-param logic from useVehicleFilters.
 * Returns the resulting URLSearchParams string.
 */
function applySetFilter(
  existing: string,
  key: keyof VehicleFilters,
  value: string,
): URLSearchParams {
  const params = new URLSearchParams(existing)
  if (value && value !== defaultFilters[key]) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
  // Reset page when non-page/view/sort filters change
  if (key !== 'page' && key !== 'view' && key !== 'sort') {
    params.delete('page')
  }
  return params
}

/**
 * Replicates the setFilters batch update logic from useVehicleFilters.
 */
function applySetFilters(
  existing: string,
  newFilters: Partial<VehicleFilters>,
): URLSearchParams {
  const params = new URLSearchParams(existing)
  Object.entries(newFilters).forEach(([key, value]) => {
    if (value && value !== defaultFilters[key as keyof VehicleFilters]) {
      params.set(key, value as string)
    } else {
      params.delete(key)
    }
  })
  return params
}

// ---------------------------------------------------------------------------
// defaultFilters shape
// ---------------------------------------------------------------------------

describe('defaultFilters', () => {
  it('has empty string defaults for all text-search filters', () => {
    const textFilters: (keyof VehicleFilters)[] = [
      'search', 'make', 'model', 'year', 'minPrice', 'maxPrice',
      'minMileage', 'maxMileage', 'fuelType', 'transmission',
      'drivetrain', 'bodyStyle', 'color', 'evOnly',
    ]
    for (const key of textFilters) {
      expect(defaultFilters[key]).toBe('')
    }
  })

  it('defaults sort to "featured"', () => {
    expect(defaultFilters.sort).toBe('featured')
  })

  it('defaults view to "grid"', () => {
    expect(defaultFilters.view).toBe('grid')
  })

  it('defaults page to "1"', () => {
    expect(defaultFilters.page).toBe('1')
  })

  it('has exactly the expected 17 keys', () => {
    const keys = Object.keys(defaultFilters)
    expect(keys).toHaveLength(17)
  })
})

// ---------------------------------------------------------------------------
// calcActiveFilterCount
// ---------------------------------------------------------------------------

describe('calcActiveFilterCount — basic counting', () => {
  it('returns 0 when all filters are at their defaults', () => {
    expect(calcActiveFilterCount({ ...defaultFilters })).toBe(0)
  })

  it('counts a single active make filter', () => {
    expect(calcActiveFilterCount({ ...defaultFilters, make: 'Toyota' })).toBe(1)
  })

  it('counts multiple active filters independently', () => {
    expect(
      calcActiveFilterCount({
        ...defaultFilters,
        make: 'Honda',
        fuelType: 'Electric',
        minPrice: '20000',
      }),
    ).toBe(3)
  })

  it('counts all 14 non-meta filter keys when all are set', () => {
    const allSet: VehicleFilters = {
      search: 'Camry',
      make: 'Toyota',
      model: 'Camry',
      year: '2022',
      minPrice: '15000',
      maxPrice: '40000',
      minMileage: '0',
      maxMileage: '50000',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      drivetrain: 'FWD',
      bodyStyle: 'Sedan',
      color: 'White',
      evOnly: 'true',
      // meta filters — excluded from count:
      sort: 'price:asc',
      view: 'list',
      page: '3',
    }
    expect(calcActiveFilterCount(allSet)).toBe(14)
  })
})

describe('calcActiveFilterCount — meta filters excluded from count', () => {
  it('does not count sort changes', () => {
    expect(
      calcActiveFilterCount({ ...defaultFilters, sort: 'price:asc' }),
    ).toBe(0)
  })

  it('does not count view changes', () => {
    expect(
      calcActiveFilterCount({ ...defaultFilters, view: 'list' }),
    ).toBe(0)
  })

  it('does not count page changes', () => {
    expect(
      calcActiveFilterCount({ ...defaultFilters, page: '5' }),
    ).toBe(0)
  })

  it('does not count default values even when non-empty', () => {
    // sort defaults to "featured", view to "grid", page to "1"
    // Setting them to the same value as default must still return 0
    expect(
      calcActiveFilterCount({
        ...defaultFilters,
        sort: 'featured',
        view: 'grid',
        page: '1',
      }),
    ).toBe(0)
  })
})

describe('calcActiveFilterCount — empty string values are not counted', () => {
  it('ignores a filter key set to empty string', () => {
    expect(
      calcActiveFilterCount({ ...defaultFilters, make: '' }),
    ).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// applySetFilter — URL param building
// ---------------------------------------------------------------------------

describe('applySetFilter — setting a filter value', () => {
  it('adds the filter param to an empty query string', () => {
    const params = applySetFilter('', 'make', 'Toyota')
    expect(params.get('make')).toBe('Toyota')
  })

  it('updates an existing filter param', () => {
    const params = applySetFilter('make=Honda', 'make', 'Toyota')
    expect(params.get('make')).toBe('Toyota')
  })

  it('removes the filter param when value is set to its default', () => {
    const params = applySetFilter('make=Toyota', 'make', '')
    expect(params.has('make')).toBe(false)
  })

  it('removes the filter param when value matches the default string', () => {
    // sort default = "featured"
    const params = applySetFilter('sort=featured', 'sort', 'featured')
    expect(params.has('sort')).toBe(false)
  })
})

describe('applySetFilter — page reset behavior', () => {
  it('deletes page param when a non-meta filter changes', () => {
    const params = applySetFilter('page=3&make=Honda', 'make', 'Toyota')
    expect(params.has('page')).toBe(false)
  })

  it('preserves page param when sort changes', () => {
    const params = applySetFilter('page=3&sort=featured', 'sort', 'price:asc')
    expect(params.get('page')).toBe('3')
  })

  it('preserves page param when view changes', () => {
    const params = applySetFilter('page=3&view=grid', 'view', 'list')
    expect(params.get('page')).toBe('3')
  })

  it('preserves page param when explicitly setting page', () => {
    const params = applySetFilter('page=2', 'page', '5')
    expect(params.get('page')).toBe('5')
  })

  it('removes page when fuelType changes', () => {
    const params = applySetFilter('page=2&fuelType=Gasoline', 'fuelType', 'Electric')
    expect(params.has('page')).toBe(false)
    expect(params.get('fuelType')).toBe('Electric')
  })
})

// ---------------------------------------------------------------------------
// applySetFilters — batch update
// ---------------------------------------------------------------------------

describe('applySetFilters — batch filter update', () => {
  it('sets multiple filter params at once', () => {
    const params = applySetFilters('', {
      make: 'Toyota',
      fuelType: 'Electric',
      minPrice: '20000',
    })
    expect(params.get('make')).toBe('Toyota')
    expect(params.get('fuelType')).toBe('Electric')
    expect(params.get('minPrice')).toBe('20000')
  })

  it('removes params that are set to empty string', () => {
    const params = applySetFilters('make=Toyota&fuelType=Electric', {
      make: '',
      fuelType: 'Gasoline',
    })
    expect(params.has('make')).toBe(false)
    expect(params.get('fuelType')).toBe('Gasoline')
  })

  it('preserves existing params not included in the update', () => {
    const params = applySetFilters('make=Toyota&model=Camry', { fuelType: 'Electric' })
    expect(params.get('make')).toBe('Toyota')
    expect(params.get('model')).toBe('Camry')
    expect(params.get('fuelType')).toBe('Electric')
  })

  it('removes params whose values match the defaults', () => {
    // sort default = "featured" → should be removed
    const params = applySetFilters('sort=price:asc', { sort: 'featured' })
    expect(params.has('sort')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Filter key completeness (regression guard)
// ---------------------------------------------------------------------------

describe('VehicleFilters interface coverage', () => {
  it('defaultFilters includes all keys required by the VehicleFilters interface', () => {
    const requiredKeys: (keyof VehicleFilters)[] = [
      'search', 'make', 'model', 'year',
      'minPrice', 'maxPrice', 'minMileage', 'maxMileage',
      'fuelType', 'transmission', 'drivetrain', 'bodyStyle',
      'color', 'evOnly', 'sort', 'view', 'page',
    ]
    for (const key of requiredKeys) {
      expect(key in defaultFilters).toBe(true)
    }
  })
})