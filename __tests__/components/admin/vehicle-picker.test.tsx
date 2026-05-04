// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { VehiclePicker } from "@/components/admin/vehicle-picker"
import type { AdminVehicle } from "@/lib/admin/hooks/use-admin-vehicles"

// Mock next/image to simple img
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, sizes, ...rest } = props
    return <img {...rest} data-fill={fill ? "true" : undefined} data-sizes={sizes as string} />
  },
}))

const makeVehicle = (overrides: Partial<AdminVehicle> = {}): AdminVehicle => ({
  id: "v-1",
  stock_number: "STK001",
  year: 2023,
  make: "Tesla",
  model: "Model 3",
  trim: "Long Range",
  is_ev: true,
  primary_image_url: null,
  status: "available",
  ...overrides,
})

const vehicles = [
  makeVehicle({ id: "v-1", make: "Tesla", model: "Model 3" }),
  makeVehicle({ id: "v-2", make: "BMW", model: "i4", is_ev: true }),
  makeVehicle({ id: "v-3", make: "Ford", model: "F-150", is_ev: false }),
]

describe("VehiclePicker", () => {
  it("renders placeholder when no vehicle selected", () => {
    render(
      <VehiclePicker
        selected={null} filtered={vehicles} loading={false}
        search="" onSearchChange={vi.fn()} onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText("Choose a vehicle")).toBeDefined()
  })

  it("shows vehicle list when placeholder is clicked", () => {
    render(
      <VehiclePicker
        selected={null} filtered={vehicles} loading={false}
        search="" onSearchChange={vi.fn()} onSelect={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText("Choose a vehicle"))
    expect(screen.getByText("2023 Tesla Model 3")).toBeDefined()
    expect(screen.getByText("2023 BMW i4")).toBeDefined()
  })

  it("calls onSelect when a vehicle is clicked", () => {
    const onSelect = vi.fn()
    render(
      <VehiclePicker
        selected={null} filtered={vehicles} loading={false}
        search="" onSearchChange={vi.fn()} onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByText("Choose a vehicle"))
    fireEvent.click(screen.getByText("2023 BMW i4"))
    expect(onSelect).toHaveBeenCalledWith(vehicles[1])
  })

  it("shows selected vehicle", () => {
    render(
      <VehiclePicker
        selected={vehicles[0]} filtered={vehicles} loading={false}
        search="" onSearchChange={vi.fn()} onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText("2023 Tesla Model 3")).toBeDefined()
  })

  it("shows loading state", () => {
    render(
      <VehiclePicker
        selected={null} filtered={[]} loading={true}
        search="" onSearchChange={vi.fn()} onSelect={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText("Choose a vehicle"))
    expect(screen.getByText("Loading…")).toBeDefined()
  })

  it("shows empty state when no vehicles match", () => {
    render(
      <VehiclePicker
        selected={null} filtered={[]} loading={false}
        search="xyz" onSearchChange={vi.fn()} onSelect={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText("Choose a vehicle"))
    expect(screen.getByText("No vehicles")).toBeDefined()
  })

  it("shows error message when error prop is provided", () => {
    render(
      <VehiclePicker
        selected={null} filtered={[]} loading={false}
        error="Failed to load vehicles (401)"
        search="" onSearchChange={vi.fn()} onSelect={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText("Choose a vehicle"))
    expect(screen.getByText("Failed to load vehicles (401)")).toBeDefined()
  })

  it("shows photo count when showPhotoCount=true", () => {
    const v = makeVehicle({ image_urls: ["a.jpg", "b.jpg", "c.jpg"] })
    render(
      <VehiclePicker
        selected={v} filtered={vehicles} loading={false}
        search="" onSearchChange={vi.fn()} onSelect={vi.fn()}
        showPhotoCount
      />,
    )
    expect(screen.getByText("3 photos")).toBeDefined()
  })

  it("shows stock number by default", () => {
    render(
      <VehiclePicker
        selected={vehicles[0]} filtered={vehicles} loading={false}
        search="" onSearchChange={vi.fn()} onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText("Stock# STK001")).toBeDefined()
  })

  it("shows EV badge in vehicle list", () => {
    render(
      <VehiclePicker
        selected={null} filtered={vehicles} loading={false}
        search="" onSearchChange={vi.fn()} onSelect={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText("Choose a vehicle"))
    const badges = screen.getAllByText("EV")
    expect(badges.length).toBe(2) // Tesla + BMW
  })

  it("respects maxItems prop", () => {
    const manyVehicles = Array.from({ length: 10 }, (_, i) =>
      makeVehicle({ id: `v-${i}`, stock_number: `STK${i}` }),
    )
    render(
      <VehiclePicker
        selected={null} filtered={manyVehicles} loading={false}
        search="" onSearchChange={vi.fn()} onSelect={vi.fn()} maxItems={3}
      />,
    )
    fireEvent.click(screen.getByText("Choose a vehicle"))
    const items = screen.getAllByText(/2023 Tesla Model 3/)
    expect(items.length).toBe(3)
  })
})
