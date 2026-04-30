// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyInventoryState } from '@/components/cars/empty-inventory-state'

describe('EmptyInventoryState', () => {
  it('renders the category name in the heading', () => {
    render(<EmptyInventoryState categoryName="Toyota RAV4" />)
    expect(
      screen.getByRole('heading', { name: /toyota rav4/i }),
    ).toBeTruthy()
  })

  it('renders an email input + notify button', () => {
    render(<EmptyInventoryState categoryName="Tesla Model 3" />)
    const email = screen.getByLabelText(/email for inventory alerts/i) as HTMLInputElement
    expect(email).toBeTruthy()
    expect(email.type).toBe('email')
    expect(email.required).toBe(true)
    expect(screen.getByRole('button', { name: /notify me/i })).toBeTruthy()
  })

  it('posts the form to /api/v1/notify', () => {
    const { container } = render(<EmptyInventoryState categoryName="Tesla" />)
    const form = container.querySelector('form')
    expect(form?.getAttribute('action')).toBe('/api/v1/notify')
    expect(form?.getAttribute('method')).toBe('post')
  })

  it('uses default fallback href when none provided', () => {
    render(<EmptyInventoryState categoryName="x" />)
    const link = screen.getByRole('link', { name: /browse all in-stock vehicles/i })
    expect(link.getAttribute('href')).toBe('/inventory')
  })

  it('uses custom fallback href + label when provided', () => {
    render(
      <EmptyInventoryState
        categoryName="Toyota RAV4"
        fallbackHref="/cars/suv"
        fallbackLabel="Browse all SUVs in stock"
      />,
    )
    const link = screen.getByRole('link', { name: /browse all suvs/i })
    expect(link.getAttribute('href')).toBe('/cars/suv')
  })

  it('emits a hidden topic input when notifyTopic is set', () => {
    const { container } = render(
      <EmptyInventoryState categoryName="Toyota RAV4" notifyTopic="/cars/toyota-rav4" />,
    )
    const hidden = container.querySelector('input[name="topic"]') as HTMLInputElement
    expect(hidden).toBeTruthy()
    expect(hidden.value).toBe('/cars/toyota-rav4')
  })

  it('omits the hidden topic input when notifyTopic is not set', () => {
    const { container } = render(<EmptyInventoryState categoryName="x" />)
    expect(container.querySelector('input[name="topic"]')).toBeNull()
  })
})
