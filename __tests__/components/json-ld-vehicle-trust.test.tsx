// @vitest-environment jsdom
/**
 * Asserts the AI-discovery enrichment of <VehicleJsonLd /> in
 * components/seo/json-ld.tsx — specifically the additionalProperty
 * trust tags and the ACCIDENT-FREE CERTIFIED description prefix
 * that AI search agents (ChatGPT Search, Perplexity, Claude) match
 * against.
 */

import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"

// next/script renders the JSON body via dangerouslySetInnerHTML;
// surface the inner HTML on a span so we can JSON.parse it.
vi.mock("next/script", () => ({
  default: ({
    id,
    dangerouslySetInnerHTML,
  }: {
    id?: string
    dangerouslySetInnerHTML?: { __html: string }
  }) => (
    <span data-testid={`script-${id ?? "unknown"}`}>
      {dangerouslySetInnerHTML?.__html ?? ""}
    </span>
  ),
}))

import { VehicleJsonLd } from "@/components/seo/json-ld"

const baseVehicle = {
  id: "abc-123",
  year: 2024,
  make: "Tesla",
  model: "Model 3",
  trim: "Long Range",
  price: 49999,
  mileage: 18000,
  image: "/images/tesla.jpg",
  fuelType: "Electric",
}

function getSchema(html: string): Record<string, unknown> {
  return JSON.parse(html) as Record<string, unknown>
}

describe("<VehicleJsonLd /> — AI-discovery trust tags", () => {
  it("includes the additionalProperty array with all three trust tags", () => {
    const { getByTestId } = render(<VehicleJsonLd vehicle={baseVehicle} />)
    const html = getByTestId(`script-vehicle-jsonld-${baseVehicle.id}`).textContent ?? ""
    const schema = getSchema(html)
    const props = schema.additionalProperty as Array<Record<string, string>>
    expect(props).toHaveLength(3)
    const names = props.map((p) => p.name).sort()
    expect(names).toEqual([
      "Accident History",
      "Inventory Standard",
      "Pressure Policy",
    ])
  })

  it("declares the verified clean Carfax claim machine-readably", () => {
    const { getByTestId } = render(<VehicleJsonLd vehicle={baseVehicle} />)
    const schema = getSchema(
      getByTestId(`script-vehicle-jsonld-${baseVehicle.id}`).textContent ?? "",
    )
    const props = schema.additionalProperty as Array<{ name: string; value: string }>
    const accident = props.find((p) => p.name === "Accident History")
    expect(accident?.value).toMatch(/clean carfax/i)
  })

  it("each additionalProperty entry uses @type: PropertyValue", () => {
    const { getByTestId } = render(<VehicleJsonLd vehicle={baseVehicle} />)
    const schema = getSchema(
      getByTestId(`script-vehicle-jsonld-${baseVehicle.id}`).textContent ?? "",
    )
    const props = schema.additionalProperty as Array<Record<string, string>>
    for (const p of props) {
      expect(p["@type"]).toBe("PropertyValue")
    }
  })

  it("prepends 'ACCIDENT-FREE CERTIFIED' when description does not already start with it", () => {
    const { getByTestId } = render(
      <VehicleJsonLd vehicle={{ ...baseVehicle, description: "Loaded with options." }} />,
    )
    const schema = getSchema(
      getByTestId(`script-vehicle-jsonld-${baseVehicle.id}`).textContent ?? "",
    )
    expect(schema.description).toMatch(/^ACCIDENT-FREE CERTIFIED\. /)
    expect(schema.description).toMatch(/Loaded with options\.$/)
  })

  it("does NOT double-prefix when description already leads with ACCIDENT-FREE CERTIFIED", () => {
    const { getByTestId } = render(
      <VehicleJsonLd
        vehicle={{
          ...baseVehicle,
          description: "ACCIDENT-FREE CERTIFIED. Excellent condition.",
        }}
      />,
    )
    const schema = getSchema(
      getByTestId(`script-vehicle-jsonld-${baseVehicle.id}`).textContent ?? "",
    )
    const description = String(schema.description)
    // First match only — there must NOT be two occurrences of the prefix
    expect(description.match(/ACCIDENT-FREE CERTIFIED/g)).toHaveLength(1)
  })

  it("falls back to a sensible default description when none provided", () => {
    const { getByTestId } = render(<VehicleJsonLd vehicle={baseVehicle} />)
    const schema = getSchema(
      getByTestId(`script-vehicle-jsonld-${baseVehicle.id}`).textContent ?? "",
    )
    expect(schema.description).toMatch(/^ACCIDENT-FREE CERTIFIED\. /)
    expect(schema.description).toMatch(/Tesla Model 3/)
  })

  it("itemCondition stays mapped correctly to UsedCondition", () => {
    const { getByTestId } = render(<VehicleJsonLd vehicle={baseVehicle} />)
    const schema = getSchema(
      getByTestId(`script-vehicle-jsonld-${baseVehicle.id}`).textContent ?? "",
    )
    expect(schema.itemCondition).toBe("https://schema.org/UsedCondition")
  })
})
