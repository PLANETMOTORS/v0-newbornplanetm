// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt={props.alt as string} src={props.src as string} />,
}))

const VEHICLES = [
  {
    id: "v-1", stock_number: "STK001", year: 2023, make: "Tesla", model: "Model 3",
    trim: "Long Range", is_ev: true, primary_image_url: null, status: "available",
  },
]

vi.mock("@/lib/admin/hooks/use-admin-vehicles", () => ({
  useAdminVehicles: () => ({
    vehicles: VEHICLES,
    loading: false,
    search: "",
    setSearch: vi.fn(),
    filtered: VEHICLES,
  }),
  getVehiclePhotos: () => [],
}))

vi.mock("@/components/admin/vehicle-picker", () => ({
  VehiclePicker: (props: { onSelect: (v: unknown) => void; selected: unknown }) => (
    <div data-testid="vehicle-picker">
      {!props.selected && <button type="button" onClick={() => props.onSelect(VEHICLES[0])}>Pick Vehicle</button>}
      {props.selected && <span>Vehicle Selected</span>}
    </div>
  ),
}))

const mockFetch = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("fetch", mockFetch)
})

import AISEOPage from "@/app/admin/ai-seo/page"

describe("AI SEO Page", () => {
  it("renders page title", () => {
    render(<AISEOPage />)
    expect(screen.getByText("AI SEO")).toBeDefined()
  })

  it("renders the VehiclePicker", () => {
    render(<AISEOPage />)
    expect(screen.getByTestId("vehicle-picker")).toBeDefined()
  })

  it("shows placeholder when no vehicle selected", () => {
    render(<AISEOPage />)
    expect(screen.getByText(/Select a vehicle to generate SEO/)).toBeDefined()
  })

  it("selects a vehicle and shows it", async () => {
    render(<AISEOPage />)
    fireEvent.click(screen.getByText("Pick Vehicle"))
    await waitFor(() => expect(screen.getByText("Vehicle Selected")).toBeDefined())
  })

  it("shows generate button after vehicle selection", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ seo: { metaTitle: "Test" } }) })
    render(<AISEOPage />)
    fireEvent.click(screen.getByText("Pick Vehicle"))
    await waitFor(() => expect(screen.getByText(/Generate SEO/)).toBeDefined())
  })
})
