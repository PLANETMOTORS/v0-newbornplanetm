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
    image_urls: ["https://img.com/1.jpg", "https://img.com/2.jpg"],
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
  getVehiclePhotos: (v: unknown) => v ? ["https://img.com/1.jpg", "https://img.com/2.jpg"] : [],
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

import AIEnhancePage from "@/app/admin/ai-enhance/page"

describe("AI Enhance Page", () => {
  it("renders page title", () => {
    render(<AIEnhancePage />)
    expect(screen.getByText("AI Photo Enhance")).toBeDefined()
  })

  it("renders description about Real-ESRGAN", () => {
    render(<AIEnhancePage />)
    expect(screen.getByText(/Upscale low-resolution photos/)).toBeDefined()
  })

  it("renders the VehiclePicker", () => {
    render(<AIEnhancePage />)
    expect(screen.getByTestId("vehicle-picker")).toBeDefined()
  })

  it("shows placeholder when no vehicle is selected", () => {
    render(<AIEnhancePage />)
    expect(screen.getByText(/Select a vehicle and photo to enhance/)).toBeDefined()
  })

  it("shows photo grid after vehicle selection", async () => {
    render(<AIEnhancePage />)
    fireEvent.click(screen.getByText("Pick Vehicle"))
    await waitFor(() => {
      expect(screen.getByText("Vehicle Selected")).toBeDefined()
      // Photos should appear since mock returns 2 photos
      expect(screen.getByText("2. Select Photo")).toBeDefined()
    })
  })

  it("shows scale buttons", () => {
    render(<AIEnhancePage />)
    expect(screen.getByText("2x")).toBeDefined()
    expect(screen.getByText("4x")).toBeDefined()
    expect(screen.getByText("8x")).toBeDefined()
  })

  it("shows enhance button after photo selection", async () => {
    render(<AIEnhancePage />)
    fireEvent.click(screen.getByText("Pick Vehicle"))
    await waitFor(() => expect(screen.getByText("2. Select Photo")).toBeDefined())
    // The photo buttons are images, click on first photo
    const photoButtons = screen.getAllByRole("button").filter(btn => btn.querySelector("img"))
    if (photoButtons.length > 0) fireEvent.click(photoButtons[0])
    expect(screen.getByText("Enhance Photo")).toBeDefined()
  })
})
