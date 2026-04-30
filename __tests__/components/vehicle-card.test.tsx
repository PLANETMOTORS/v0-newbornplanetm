// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VehicleCard } from '@/components/cars/vehicle-card'
import type { CategoryVehicle } from '@/lib/vehicles/fetch-by-filter'

function v(overrides: Partial<CategoryVehicle> = {}): CategoryVehicle {
  return {
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
    ...overrides,
  }
}

describe('VehicleCard', () => {
  it('links to the VDP', () => {
    const { container } = render(<VehicleCard vehicle={v()} />)
    const link = container.querySelector('[data-testid="vehicle-card-link"]') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/vehicles/abc-123')
  })

  it('renders year + make + model + trim in heading', () => {
    render(<VehicleCard vehicle={v()} />)
    const h = screen.getByRole('heading')
    expect(h.textContent).toContain('2024')
    expect(h.textContent).toContain('Tesla')
    expect(h.textContent).toContain('Model 3')
    expect(h.textContent).toContain('Long Range')
  })

  it('omits trim when null', () => {
    render(<VehicleCard vehicle={v({ trim: null })} />)
    const h = screen.getByRole('heading')
    expect(h.textContent).not.toContain('Long Range')
  })

  it('formats price with thousands separator and CAD prefix', () => {
    render(<VehicleCard vehicle={v({ price: 64990 })} />)
    expect(screen.getByText('$64,990')).toBeTruthy()
  })

  it('shows EV badge for EVs', () => {
    render(<VehicleCard vehicle={v({ isEv: true })} />)
    expect(screen.getByText('EV')).toBeTruthy()
  })

  it('hides EV badge for non-EVs', () => {
    render(<VehicleCard vehicle={v({ isEv: false })} />)
    expect(screen.queryByText('EV')).toBeNull()
  })

  it('shows battery health badge when value present', () => {
    render(<VehicleCard vehicle={v({ evBatteryHealthPercent: 96 })} />)
    expect(screen.getByText(/96% SOH/)).toBeTruthy()
  })

  it('hides battery health badge when null', () => {
    render(<VehicleCard vehicle={v({ evBatteryHealthPercent: null })} />)
    expect(screen.queryByText(/SOH/)).toBeNull()
  })

  it('shows fallback "No image yet" when primaryImageUrl is null', () => {
    render(<VehicleCard vehicle={v({ primaryImageUrl: null })} />)
    expect(screen.getByText(/no image yet/i)).toBeTruthy()
  })

  it('builds the secondary line with mileage + body + fuel separators', () => {
    const { container } = render(
      <VehicleCard
        vehicle={v({ mileage: 12000, bodyStyle: 'Sedan', fuelType: 'Electric' })}
      />,
    )
    expect(container.textContent).toMatch(/12,000 km/)
    expect(container.textContent).toMatch(/Sedan/)
    expect(container.textContent).toMatch(/Electric/)
  })

  it('omits body/fuel separators when those fields are null', () => {
    const { container } = render(
      <VehicleCard vehicle={v({ bodyStyle: null, fuelType: null })} />,
    )
    expect(container.textContent).toMatch(/12,000 km/)
    expect(container.textContent).not.toMatch(/• Sedan/)
    expect(container.textContent).not.toMatch(/• Electric/)
  })
})
