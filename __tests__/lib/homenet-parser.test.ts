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

  it("normalizes <bodystyle>Sport Utility</bodystyle> to 'SUV'", () => {
    const xml = `<vehicle>
      <vin>1HGCM82633A123456</vin>
      <stocknumber>STK010</stocknumber>
      <year>2022</year>
      <make>Honda</make>
      <model>CR-V</model>
      <bodystyle>Sport Utility</bodystyle>
    </vehicle>`
    expect(parseHomenetXML(xml)[0].body_style).toBe("SUV")
  })

  it("converts Excel-serial <dateinstock> to ISO YYYY-MM-DD", () => {
    const xml = `<vehicle>
      <vin>1HGCM82633A123456</vin>
      <stocknumber>STK011</stocknumber>
      <year>2022</year>
      <make>Honda</make>
      <dateinstock>45601</dateinstock>
    </vehicle>`
    expect(parseHomenetXML(xml)[0].date_in_stock).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("Jeep Wrangler 4xe XML row is reclassified as PHEV", () => {
    const xml = `<vehicle>
      <vin>1C4HJXFG6KW123456</vin>
      <stocknumber>STK012</stocknumber>
      <year>2024</year>
      <make>Jeep</make>
      <model>Wrangler</model>
      <trim>Sahara 4xe</trim>
      <fueltype>Hybrid Fuel</fueltype>
    </vehicle>`
    const v = parseHomenetXML(xml)[0]
    expect(v.fuel_type).toBe("Plug-in Hybrid")
    expect(v.is_ev).toBe(false)
  })
})

describe("parseHomenetCSV - real-world gotchas", () => {
  it("normalizes 'Sport Utility' body to 'SUV' so category pages can filter", () => {
    const csv =
      "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,certified,bodystyle\n" +
      "1HGCM82633A123456,STK001,2022,Honda,CR-V,EX,28000,15000,Gasoline,false,Sport Utility"
    const v = parseHomenetCSV(csv)[0]
    expect(v.body_style).toBe("SUV")
  })

  it("normalizes '4dr Car' body to 'Sedan'", () => {
    const csv =
      "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,certified,bodystyle\n" +
      "1HGCM82633A123456,STK002,2022,Honda,Accord,EX,28000,15000,Gasoline,false,4dr Car"
    const v = parseHomenetCSV(csv)[0]
    expect(v.body_style).toBe("Sedan")
  })

  it("Jeep Wrangler 4xe with 'Hybrid Fuel' is reclassified as Plug-in Hybrid (not pure EV)", () => {
    const csv =
      "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,certified\n" +
      "1C4HJXFG6KW123456,JEEP4XE01,2024,Jeep,Wrangler,Sahara 4xe,72000,8000,Hybrid Fuel,false"
    const v = parseHomenetCSV(csv)[0]
    expect(v.fuel_type).toBe("Plug-in Hybrid")
    expect(v.is_ev).toBe(false)
  })

  it("Tesla Model 3 stays as pure EV (not affected by PHEV override)", () => {
    const csv =
      "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,certified\n" +
      "5YJ3E1EA7JF123456,TES001,2023,Tesla,Model 3,Long Range,52000,12000,Electric Fuel System,false"
    const v = parseHomenetCSV(csv)[0]
    expect(v.fuel_type).toBe("Electric")
    expect(v.is_ev).toBe(true)
  })

  it("converts Excel-serial DateInStock to ISO YYYY-MM-DD", () => {
    const csv =
      "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,certified,dateinstock\n" +
      "1HGCM82633A123456,STK003,2022,Honda,Accord,EX,28000,15000,Gasoline,false,45601"
    const v = parseHomenetCSV(csv)[0]
    expect(v.date_in_stock).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("filters HomeNet stock-photo URLs out of image_urls", () => {
    const csv =
      "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,certified,image_urls\n" +
      "1HGCM82633A123456,STK004,2022,Honda,Accord,EX,28000,15000,Gasoline,false," +
      '"https://x.com/photos/real.jpg|https://content.homenetiol.com/stock_images/2/33490.jpg"'
    const v = parseHomenetCSV(csv)[0]
    expect(v.image_urls).toEqual(["https://x.com/photos/real.jpg"])
    expect(v.has_real_photos).toBe(true)
  })

  it("flags has_real_photos=false when ALL photos are stock placeholders", () => {
    const csv =
      "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,certified,image_urls\n" +
      "1HGCM82633A123456,STK005,2022,Honda,Accord,EX,28000,15000,Gasoline,false," +
      '"https://content.homenetiol.com/stock_images/2/33490.jpg|https://x.com/placeholder.png"'
    const v = parseHomenetCSV(csv)[0]
    expect(v.has_real_photos).toBe(false)
    // Falls back to keeping the stock photos rather than leaving listing photoless
    expect(v.image_urls?.length).toBe(2)
  })

  it("OMVIC: defaults is_certified to false when no certified column AND type is Used", () => {
    const csv =
      "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,type\n" +
      "1HGCM82633A123456,STK006,2022,Honda,Accord,EX,28000,15000,Gasoline,Used"
    const v = parseHomenetCSV(csv)[0]
    expect(v.is_certified).toBe(false)
    expect(v.condition).toBe("used")
  })

  it("strips duplicate boilerplate lines from description", () => {
    const csv =
      "vin,stocknumber,year,make,model,trim,price,mileage,fueltype,certified,description\n" +
      "1HGCM82633A123456,STK007,2022,Honda,Accord,EX,28000,15000,Gasoline,false," +
      '"Welcome to Planet Motors!\nWelcome to Planet Motors!\n210-point inspection."'
    const v = parseHomenetCSV(csv)[0]
    expect(v.description?.split("\n").filter(l => l.includes("Welcome"))).toHaveLength(1)
  })
})
