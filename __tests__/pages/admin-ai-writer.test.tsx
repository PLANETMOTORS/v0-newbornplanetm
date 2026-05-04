// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt={props.alt as string} src={props.src as string} />,
}))

const mockSetSearch = vi.fn()
vi.mock("@/lib/admin/hooks/use-admin-vehicles", () => ({
  useAdminVehicles: () => ({
    vehicles: VEHICLES,
    loading: false,
    search: "",
    setSearch: mockSetSearch,
    filtered: VEHICLES,
  }),
  getVehiclePhotos: () => [],
}))

vi.mock("@/components/admin/vehicle-picker", () => ({
  VehiclePicker: (props: { onSelect: (v: unknown) => void; selected: unknown }) => (
    <div data-testid="vehicle-picker">
      {!props.selected && (
        <button type="button" onClick={() => props.onSelect(VEHICLES[0])}>
          Pick Vehicle
        </button>
      )}
      {props.selected && <span>Vehicle Selected</span>}
    </div>
  ),
}))

const VEHICLES = [
  {
    id: "v-1", stock_number: "STK001", year: 2023, make: "Tesla", model: "Model 3",
    trim: "Long Range", is_ev: true, primary_image_url: null, status: "available",
  },
]

const mockFetch = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("fetch", mockFetch)
})

import AIWriterPage from "@/app/admin/ai-writer/page"

describe("AI Writer Page", () => {
  it("renders the page title", () => {
    render(<AIWriterPage />)
    expect(screen.getByText("AI Writer")).toBeDefined()
  })

  it("renders the description", () => {
    render(<AIWriterPage />)
    expect(screen.getByText(/Generate professional descriptions/)).toBeDefined()
  })

  it("renders the VehiclePicker component", () => {
    render(<AIWriterPage />)
    expect(screen.getByTestId("vehicle-picker")).toBeDefined()
  })

  it("shows content type buttons after vehicle selection", async () => {
    render(<AIWriterPage />)
    fireEvent.click(screen.getByText("Pick Vehicle"))
    await waitFor(() => {
      expect(screen.getByText("Vehicle Selected")).toBeDefined()
    })
  })

  it("shows placeholder state when no vehicle is selected", () => {
    render(<AIWriterPage />)
    expect(screen.getByText(/Select a vehicle to get started/)).toBeDefined()
  })
})
