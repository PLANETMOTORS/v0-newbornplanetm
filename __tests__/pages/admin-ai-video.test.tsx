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
    image_urls: ["https://img.com/1.jpg"],
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
  getVehiclePhotos: (v: unknown) => v ? ["https://img.com/1.jpg"] : [],
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

import AIVideoPage from "@/app/admin/ai-video/page"

describe("AI Video Page", () => {
  it("renders page title", () => {
    render(<AIVideoPage />)
    expect(screen.getByText("AI Video")).toBeDefined()
  })

  it("renders description about video generation", () => {
    render(<AIVideoPage />)
    expect(screen.getByText(/Transform vehicle photos into cinematic/)).toBeDefined()
  })

  it("renders the VehiclePicker", () => {
    render(<AIVideoPage />)
    expect(screen.getByTestId("vehicle-picker")).toBeDefined()
  })

  it("shows placeholder when no vehicle is selected", () => {
    render(<AIVideoPage />)
    expect(screen.getByText(/Select a vehicle and photo to create/)).toBeDefined()
  })

  it("shows photo selection after vehicle pick", async () => {
    render(<AIVideoPage />)
    fireEvent.click(screen.getByText("Pick Vehicle"))
    await waitFor(() => {
      expect(screen.getByText("Vehicle Selected")).toBeDefined()
      expect(screen.getByText(/Select Photo/)).toBeDefined()
    })
  })

  it("has custom prompt input", async () => {
    render(<AIVideoPage />)
    const input = screen.getByPlaceholderText(/Custom prompt/)
    expect(input).toBeDefined()
  })

  it("shows generate button", () => {
    render(<AIVideoPage />)
    expect(screen.getByText("Generate Video")).toBeDefined()
  })
})
