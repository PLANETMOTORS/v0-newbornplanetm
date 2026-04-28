import { describe, it, expect } from "vitest"
import {
  parseCSVLine,
  parseHomenetCSV,
  parseHomenetXML,
} from "@/lib/homenet/parser"

describe("parseCSVLine", () => {
  it("splits a basic comma row", () => {
    expect(parseCSVLine("a,b,c")).toEqual(["a", "b", "c"])
  })

  it("respects quoted fields with embedded commas", () => {
    expect(parseCSVLine('a,"b,c",d')).toEqual(["a", "b,c", "d"])
  })

  it("handles escaped quotes (RFC 4180)", () => {
    expect(parseCSVLine('a,"b ""B"" c",d')).toEqual(["a", 'b "B" c', "d"])
  })

  it("preserves empty fields", () => {
    expect(parseCSVLine("a,,c")).toEqual(["a", "", "c"])
  })
})

describe("parseHomenetCSV", () => {
  const HEADER =
    "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,certified"

  it("parses a single row into a VehicleData record", () => {
    const csv =
      `${HEADER}\n` +
      "1HGCM82633A123456,STK001,2022,Honda,Accord,EX,28000,15000,Gasoline Fuel,true"
    const out = parseHomenetCSV(csv)
    expect(out).toHaveLength(1)
    const v = out[0]
    expect(v.vin).toBe("1HGCM82633A123456")
    expect(v.stock_number).toBe("STK001")
    expect(v.year).toBe(2022)
    expect(v.make).toBe("Honda")
    expect(v.model).toBe("Accord")
    expect(v.trim).toBe("EX")
    expect(v.price_cad).toBe(28000)
    expect(v.price).toBe(2_800_000) // legacy cents
    expect(v.mileage_km).toBe(15000)
    expect(v.fuel_type).toBe("Gasoline") // " Fuel" suffix stripped
    expect(v.is_certified).toBe(true)
    // Without an explicit "type"/"condition" CSV column the parser leaves
    // condition as the safe default ("used") even if certified=true; only
    // a "cpo"/"certified" type bumps it to "certified_used".
    expect(v.condition).toBe("used")
  })

  it("derives slug + title", () => {
    const csv =
      `${HEADER}\n` +
      "5YJ3E1EA7JF123456,STK002,2018,Tesla,Model 3,Long Range,52000,32000,Electric Fuel System,false"
    const v = parseHomenetCSV(csv)[0]
    expect(v.slug).toBe("2018-tesla-model-3-long-range-stk002")
    expect(v.title).toBe("2018 Tesla Model 3 Long Range")
    expect(v.is_ev).toBe(true)
    expect(v.fuel_type).toBe("Electric") // " Fuel System" suffix stripped
  })

  it("rejects rows whose VIN is not 17 chars", () => {
    const csv =
      `${HEADER}\n` +
      "TOOSHORT,STK001,2022,Honda,Accord,EX,28000,15000,Gasoline,true"
    expect(parseHomenetCSV(csv)).toEqual([])
  })

  it("rejects rows with empty stock number", () => {
    const csv =
      `${HEADER}\n` +
      "1HGCM82633A123456,,2022,Honda,Accord,EX,28000,15000,Gasoline,true"
    expect(parseHomenetCSV(csv)).toEqual([])
  })

  it("returns [] when there is only a header row", () => {
    expect(parseHomenetCSV(HEADER)).toEqual([])
    expect(parseHomenetCSV("")).toEqual([])
  })

  it("skips rows whose column count does not match the header", () => {
    const csv = `${HEADER}\nonly,three,fields`
    expect(parseHomenetCSV(csv)).toEqual([])
  })
})

describe("parseHomenetXML", () => {
  it("parses a minimal valid <vehicle> block", () => {
    const xml = `<inventory>
      <vehicle>
        <vin>1HGCM82633A123456</vin>
        <stocknumber>STK001</stocknumber>
        <year>2022</year>
        <make>Honda</make>
        <model>Accord</model>
        <trim>EX</trim>
        <price>28000</price>
        <mileage>15000</mileage>
        <fueltype>Gasoline</fueltype>
        <certified>true</certified>
      </vehicle>
    </inventory>`
    const out = parseHomenetXML(xml)
    expect(out).toHaveLength(1)
    expect(out[0].vin).toBe("1HGCM82633A123456")
    expect(out[0].is_certified).toBe(true)
    expect(out[0].condition).toBe("certified_used")
  })

  it("returns [] when no vehicle blocks present", () => {
    expect(parseHomenetXML("<inventory></inventory>")).toEqual([])
  })

  it("skips vehicles whose VIN length is wrong", () => {
    const xml = `<vehicle><vin>SHORT</vin><stocknumber>X</stocknumber></vehicle>`
    expect(parseHomenetXML(xml)).toEqual([])
  })

  it("recognises <listing> and <item> as vehicle wrappers too", () => {
    const xml = `<root>
      <listing>
        <vin>1HGCM82633A123456</vin>
        <stocknumber>STK002</stocknumber>
        <year>2021</year>
      </listing>
      <item>
        <vin>5YJ3E1EA7JF123456</vin>
        <stocknumber>STK003</stocknumber>
        <year>2018</year>
      </item>
    </root>`
    const out = parseHomenetXML(xml)
    expect(out.map(v => v.stock_number).sort()).toEqual(["STK002", "STK003"])
  })
})
