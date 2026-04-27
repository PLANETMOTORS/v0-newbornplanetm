// Canadian Black Book vehicle makes, models, and trims data
// This data structure enables cascading dropdowns: Make -> Model -> Trim

export interface VehicleTrim {
  name: string
  transmission?: string
  engine?: string
}

export interface VehicleModel {
  name: string
  trims: VehicleTrim[]
}

export interface VehicleMake {
  name: string
  models: VehicleModel[]
}

/** Trim factory — eliminates repeated inline `{ name, transmission, engine }` type annotations. */
function makeTrim(name: string, transmission?: string, engine?: string): VehicleTrim {
  return transmission || engine ? { name, transmission, engine } : { name }
}

/** Model factory — eliminates repeated inline `{ name, trims }` type annotations. */
function makeModel(name: string, trims: VehicleTrim[]): VehicleModel {
  return { name, trims }
}

// All makes available in Canada (from Canadian Black Book)
export const vehicleMakes: VehicleMake[] = [
  {
    name: "Acura",
    models: [
      { name: "Integra", trims: [
        makeTrim("Base", "CVT", "1.5L Turbo"),
        makeTrim("A-Spec", "CVT", "1.5L Turbo"),
        makeTrim("A-Spec Elite", "CVT", "1.5L Turbo"),
        makeTrim("Type S", "6-Speed Manual", "2.0L Turbo")
      ]},
      { name: "MDX", trims: [
        makeTrim("Base", "10-Speed Automatic", "3.5L V6"),
        makeTrim("A-Spec", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Advance", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Type S", "10-Speed Automatic", "3.0L Turbo V6"),
        makeTrim("Type S Advance", "10-Speed Automatic", "3.0L Turbo V6")
      ]},
      { name: "RDX", trims: [
        makeTrim("Base", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("A-Spec", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("Advance", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("Platinum Elite", "10-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "TLX", trims: [
        makeTrim("Base", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("A-Spec", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("Advance", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("Type S", "10-Speed Automatic", "3.0L Turbo V6")
      ]},
      { name: "ZDX", trims: [
        makeTrim("A-Spec", "Single-Speed", "Electric"),
        makeTrim("Type S", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Alfa Romeo",
    models: [
      { name: "Giulia", trims: [
        makeTrim("Sprint", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Ti", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Veloce", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Quadrifoglio", "8-Speed Automatic", "2.9L Twin-Turbo V6")
      ]},
      { name: "Stelvio", trims: [
        makeTrim("Sprint", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Ti", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Veloce", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Quadrifoglio", "8-Speed Automatic", "2.9L Twin-Turbo V6")
      ]},
      { name: "Tonale", trims: [
        makeTrim("Sprint", "9-Speed Automatic", "1.3L Turbo PHEV"),
        makeTrim("Ti", "9-Speed Automatic", "1.3L Turbo PHEV"),
        makeTrim("Veloce", "9-Speed Automatic", "1.3L Turbo PHEV")
      ]}
    ]
  },
  {
    name: "Aston Martin",
    models: [
      { name: "DB11", trims: [
        makeTrim("V8", "8-Speed Automatic", "4.0L Twin-Turbo V8"),
        makeTrim("V8 Volante", "8-Speed Automatic", "4.0L Twin-Turbo V8")
      ]},
      { name: "DB12", trims: [
        makeTrim("Coupe", "8-Speed Automatic", "4.0L Twin-Turbo V8"),
        makeTrim("Volante", "8-Speed Automatic", "4.0L Twin-Turbo V8")
      ]},
      { name: "DBX", trims: [
        makeTrim("Base", "9-Speed Automatic", "4.0L Twin-Turbo V8"),
        makeTrim("707", "9-Speed Automatic", "4.0L Twin-Turbo V8")
      ]},
      { name: "Vantage", trims: [
        makeTrim("Coupe", "8-Speed Automatic", "4.0L Twin-Turbo V8"),
        makeTrim("Roadster", "8-Speed Automatic", "4.0L Twin-Turbo V8")
      ]}
    ]
  },
  {
    name: "Audi",
    models: [
      { name: "A3", trims: [
        makeTrim("Komfort", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Progressiv", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Technik", "7-Speed S tronic", "2.0L TFSI")
      ]},
      { name: "A4", trims: [
        makeTrim("Komfort", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Progressiv", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Technik", "7-Speed S tronic", "2.0L TFSI")
      ]},
      { name: "A5", trims: [
        makeTrim("Komfort", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Progressiv", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Technik", "7-Speed S tronic", "2.0L TFSI")
      ]},
      { name: "A6", trims: [
        makeTrim("Komfort", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Progressiv", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Technik", "7-Speed S tronic", "3.0L TFSI")
      ]},
      { name: "A7", trims: [
        makeTrim("Progressiv", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Technik", "7-Speed S tronic", "3.0L TFSI")
      ]},
      { name: "A8", trims: [
        makeTrim("Base", "8-Speed Tiptronic", "3.0L TFSI"),
        makeTrim("L", "8-Speed Tiptronic", "3.0L TFSI")
      ]},
      { name: "Q3", trims: [
        makeTrim("Komfort", "8-Speed Tiptronic", "2.0L TFSI"),
        makeTrim("Progressiv", "8-Speed Tiptronic", "2.0L TFSI"),
        makeTrim("Technik", "8-Speed Tiptronic", "2.0L TFSI")
      ]},
      { name: "Q4 e-tron", trims: [
        makeTrim("Komfort", "Single-Speed", "Electric"),
        makeTrim("Progressiv", "Single-Speed", "Electric"),
        makeTrim("Technik", "Single-Speed", "Electric")
      ]},
      { name: "Q5", trims: [
        makeTrim("Komfort", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Progressiv", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Technik", "7-Speed S tronic", "2.0L TFSI")
      ]},
      { name: "Q7", trims: [
        makeTrim("Komfort", "8-Speed Tiptronic", "2.0L TFSI"),
        makeTrim("Progressiv", "8-Speed Tiptronic", "3.0L TFSI"),
        makeTrim("Technik", "8-Speed Tiptronic", "3.0L TFSI")
      ]},
      { name: "Q8", trims: [
        makeTrim("Progressiv", "8-Speed Tiptronic", "3.0L TFSI"),
        makeTrim("Technik", "8-Speed Tiptronic", "3.0L TFSI")
      ]},
      { name: "Q8 e-tron", trims: [
        makeTrim("Progressiv", "Single-Speed", "Electric"),
        makeTrim("Technik", "Single-Speed", "Electric")
      ]},
      { name: "e-tron GT", trims: [
        makeTrim("Base", "2-Speed", "Electric"),
        makeTrim("RS", "2-Speed", "Electric")
      ]},
      { name: "RS 3", trims: [
        makeTrim("Sedan", "7-Speed S tronic", "2.5L TFSI")
      ]},
      { name: "RS 5", trims: [
        makeTrim("Coupe", "8-Speed Tiptronic", "2.9L TFSI V6"),
        makeTrim("Sportback", "8-Speed Tiptronic", "2.9L TFSI V6")
      ]},
      { name: "RS 6 Avant", trims: [
        makeTrim("Base", "8-Speed Tiptronic", "4.0L TFSI V8")
      ]},
      { name: "RS 7", trims: [
        makeTrim("Base", "8-Speed Tiptronic", "4.0L TFSI V8")
      ]},
      { name: "RS Q8", trims: [
        makeTrim("Base", "8-Speed Tiptronic", "4.0L TFSI V8")
      ]},
      { name: "S3", trims: [
        makeTrim("Sedan", "7-Speed S tronic", "2.0L TFSI")
      ]},
      { name: "S4", trims: [
        makeTrim("Sedan", "8-Speed Tiptronic", "3.0L TFSI")
      ]},
      { name: "S5", trims: [
        makeTrim("Coupe", "8-Speed Tiptronic", "3.0L TFSI"),
        makeTrim("Sportback", "8-Speed Tiptronic", "3.0L TFSI")
      ]},
      { name: "S6", trims: [
        makeTrim("Sedan", "8-Speed Tiptronic", "2.9L TFSI V6")
      ]},
      { name: "S7", trims: [
        makeTrim("Sportback", "8-Speed Tiptronic", "2.9L TFSI V6")
      ]},
      { name: "S8", trims: [
        makeTrim("Base", "8-Speed Tiptronic", "4.0L TFSI V8")
      ]},
      { name: "SQ5", trims: [
        makeTrim("Base", "8-Speed Tiptronic", "3.0L TFSI")
      ]},
      { name: "SQ7", trims: [
        makeTrim("Base", "8-Speed Tiptronic", "4.0L TFSI V8")
      ]},
      { name: "SQ8", trims: [
        makeTrim("Base", "8-Speed Tiptronic", "4.0L TFSI V8")
      ]},
      { name: "TT", trims: [
        makeTrim("Coupe", "7-Speed S tronic", "2.0L TFSI"),
        makeTrim("Roadster", "7-Speed S tronic", "2.0L TFSI")
      ]}
    ]
  },
  {
    name: "Bentley",
    models: [
      { name: "Bentayga", trims: [
        makeTrim("V8", "8-Speed Automatic", "4.0L Twin-Turbo V8"),
        makeTrim("Speed", "8-Speed Automatic", "6.0L W12"),
        makeTrim("EWB", "8-Speed Automatic", "4.0L Twin-Turbo V8")
      ]},
      { name: "Continental GT", trims: [
        makeTrim("V8", "8-Speed DCT", "4.0L Twin-Turbo V8"),
        makeTrim("Speed", "8-Speed DCT", "6.0L W12"),
        makeTrim("Mulliner", "8-Speed DCT", "6.0L W12")
      ]},
      { name: "Flying Spur", trims: [
        makeTrim("V8", "8-Speed DCT", "4.0L Twin-Turbo V8"),
        makeTrim("W12", "8-Speed DCT", "6.0L W12"),
        makeTrim("Speed", "8-Speed DCT", "6.0L W12")
      ]}
    ]
  },
  {
    name: "BMW",
    models: [
      { name: "2-Series", trims: [
        makeTrim("228i xDrive Gran Coupe", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("M235i xDrive Gran Coupe", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("230i Coupe", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("M240i xDrive Coupe", "8-Speed Steptronic", "3.0L TwinPower Turbo")
      ]},
      { name: "3-Series", trims: [
        makeTrim("330i Sedan", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("330i xDrive Sedan", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("330e xDrive Sedan", "8-Speed Steptronic", "2.0L TwinPower Turbo PHEV"),
        makeTrim("M340i xDrive Sedan", "8-Speed Steptronic", "3.0L TwinPower Turbo")
      ]},
      { name: "4-Series", trims: [
        makeTrim("430i Coupe", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("430i xDrive Coupe", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("M440i xDrive Coupe", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("430i Gran Coupe", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("M440i xDrive Gran Coupe", "8-Speed Steptronic", "3.0L TwinPower Turbo")
      ]},
      { name: "5-Series", trims: [
        makeTrim("530i Sedan", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("530i xDrive Sedan", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("540i xDrive Sedan", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("550e xDrive Sedan", "8-Speed Steptronic", "3.0L TwinPower Turbo PHEV")
      ]},
      { name: "7-Series", trims: [
        makeTrim("740i", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("740i xDrive", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("760i xDrive", "8-Speed Steptronic", "4.4L TwinPower Turbo V8")
      ]},
      { name: "8-Series", trims: [
        makeTrim("840i Coupe", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("840i xDrive Coupe", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("M850i xDrive Coupe", "8-Speed Steptronic", "4.4L TwinPower Turbo V8"),
        makeTrim("840i xDrive Gran Coupe", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("M850i xDrive Gran Coupe", "8-Speed Steptronic", "4.4L TwinPower Turbo V8")
      ]},
      { name: "X1", trims: [
        makeTrim("xDrive28i", "7-Speed DCT", "2.0L TwinPower Turbo")
      ]},
      { name: "X2", trims: [
        makeTrim("xDrive28i", "7-Speed DCT", "2.0L TwinPower Turbo"),
        makeTrim("M35i xDrive", "7-Speed DCT", "2.0L TwinPower Turbo")
      ]},
      { name: "X3", trims: [
        makeTrim("xDrive30i", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("M40i", "8-Speed Steptronic", "3.0L TwinPower Turbo")
      ]},
      { name: "X4", trims: [
        makeTrim("xDrive30i", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("M40i", "8-Speed Steptronic", "3.0L TwinPower Turbo")
      ]},
      { name: "X5", trims: [
        makeTrim("xDrive40i", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("xDrive50e", "8-Speed Steptronic", "3.0L TwinPower Turbo PHEV"),
        makeTrim("M60i xDrive", "8-Speed Steptronic", "4.4L TwinPower Turbo V8")
      ]},
      { name: "X6", trims: [
        makeTrim("xDrive40i", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("M60i xDrive", "8-Speed Steptronic", "4.4L TwinPower Turbo V8")
      ]},
      { name: "X7", trims: [
        makeTrim("xDrive40i", "8-Speed Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("M60i xDrive", "8-Speed Steptronic", "4.4L TwinPower Turbo V8")
      ]},
      { name: "XM", trims: [
        makeTrim("Base", "8-Speed Steptronic", "4.4L TwinPower Turbo V8 PHEV"),
        makeTrim("Label Red", "8-Speed Steptronic", "4.4L TwinPower Turbo V8 PHEV")
      ]},
      { name: "Z4", trims: [
        makeTrim("sDrive30i", "8-Speed Steptronic", "2.0L TwinPower Turbo"),
        makeTrim("M40i", "8-Speed Steptronic", "3.0L TwinPower Turbo")
      ]},
      { name: "i4", trims: [
        makeTrim("eDrive35", "Single-Speed", "Electric"),
        makeTrim("eDrive40", "Single-Speed", "Electric"),
        makeTrim("xDrive40", "Single-Speed", "Electric"),
        makeTrim("M50", "Single-Speed", "Electric")
      ]},
      { name: "i5", trims: [
        makeTrim("eDrive40", "Single-Speed", "Electric"),
        makeTrim("xDrive40", "Single-Speed", "Electric"),
        makeTrim("M60 xDrive", "Single-Speed", "Electric")
      ]},
      { name: "i7", trims: [
        makeTrim("xDrive60", "Single-Speed", "Electric"),
        makeTrim("M70 xDrive", "Single-Speed", "Electric")
      ]},
      { name: "iX", trims: [
        makeTrim("xDrive40", "Single-Speed", "Electric"),
        makeTrim("xDrive50", "Single-Speed", "Electric"),
        makeTrim("M60", "Single-Speed", "Electric")
      ]},
      { name: "M2", trims: [
        makeTrim("Base", "6-Speed Manual", "3.0L TwinPower Turbo"),
        makeTrim("Base", "8-Speed M Steptronic", "3.0L TwinPower Turbo")
      ]},
      { name: "M3", trims: [
        makeTrim("Base", "6-Speed Manual", "3.0L TwinPower Turbo"),
        makeTrim("Competition", "8-Speed M Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("Competition xDrive", "8-Speed M Steptronic", "3.0L TwinPower Turbo")
      ]},
      { name: "M4", trims: [
        makeTrim("Competition", "8-Speed M Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("Competition xDrive", "8-Speed M Steptronic", "3.0L TwinPower Turbo"),
        makeTrim("CSL", "8-Speed M Steptronic", "3.0L TwinPower Turbo")
      ]},
      { name: "M5", trims: [
        makeTrim("Base", "8-Speed M Steptronic", "4.4L TwinPower Turbo V8"),
        makeTrim("Competition", "8-Speed M Steptronic", "4.4L TwinPower Turbo V8"),
        makeTrim("CS", "8-Speed M Steptronic", "4.4L TwinPower Turbo V8")
      ]},
      { name: "M8", trims: [
        makeTrim("Competition Coupe", "8-Speed M Steptronic", "4.4L TwinPower Turbo V8"),
        makeTrim("Competition Gran Coupe", "8-Speed M Steptronic", "4.4L TwinPower Turbo V8")
      ]}
    ]
  },
  {
    name: "Bugatti",
    models: [
      { name: "Chiron", trims: [
        makeTrim("Base", "7-Speed DSG", "8.0L Quad-Turbo W16"),
        makeTrim("Sport", "7-Speed DSG", "8.0L Quad-Turbo W16"),
        makeTrim("Pur Sport", "7-Speed DSG", "8.0L Quad-Turbo W16")
      ]}
    ]
  },
  {
    name: "Buick",
    models: [
      { name: "Enclave", trims: [
        makeTrim("Essence", "9-Speed Automatic", "3.6L V6"),
        makeTrim("Avenir", "9-Speed Automatic", "3.6L V6")
      ]},
      { name: "Encore GX", trims: [
        makeTrim("Preferred", "CVT", "1.2L Turbo"),
        makeTrim("Select", "9-Speed Automatic", "1.3L Turbo"),
        makeTrim("Essence", "9-Speed Automatic", "1.3L Turbo"),
        makeTrim("Avenir", "9-Speed Automatic", "1.3L Turbo")
      ]},
      { name: "Envision", trims: [
        makeTrim("Preferred", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Essence", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Avenir", "9-Speed Automatic", "2.0L Turbo")
      ]}
    ]
  },
  {
    name: "Cadillac",
    models: [
      { name: "CT4", trims: [
        makeTrim("Luxury", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("Premium Luxury", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("Sport", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("V-Series", "10-Speed Automatic", "2.7L Turbo"),
        makeTrim("CT4-V Blackwing", "6-Speed Manual", "3.6L Twin-Turbo V6")
      ]},
      { name: "CT5", trims: [
        makeTrim("Luxury", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("Premium Luxury", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("Sport", "10-Speed Automatic", "2.0L Turbo"),
        makeTrim("V-Series", "10-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("CT5-V Blackwing", "6-Speed Manual", "6.2L Supercharged V8")
      ]},
      { name: "Escalade", trims: [
        makeTrim("Luxury", "10-Speed Automatic", "6.2L V8"),
        makeTrim("Premium Luxury", "10-Speed Automatic", "6.2L V8"),
        makeTrim("Sport", "10-Speed Automatic", "6.2L V8"),
        makeTrim("V-Series", "10-Speed Automatic", "6.2L Supercharged V8")
      ]},
      { name: "Escalade-V", trims: [
        makeTrim("Base", "10-Speed Automatic", "6.2L Supercharged V8")
      ]},
      { name: "XT4", trims: [
        makeTrim("Luxury", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Premium Luxury", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Sport", "9-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "XT5", trims: [
        makeTrim("Luxury", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Premium Luxury", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Sport", "9-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "XT6", trims: [
        makeTrim("Luxury", "9-Speed Automatic", "3.6L V6"),
        makeTrim("Premium Luxury", "9-Speed Automatic", "3.6L V6"),
        makeTrim("Sport", "9-Speed Automatic", "3.6L V6")
      ]},
      { name: "LYRIQ", trims: [
        makeTrim("Tech", "Single-Speed", "Electric"),
        makeTrim("Luxury", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Chevrolet",
    models: [
      { name: "Blazer", trims: [
        makeTrim("2LT", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("3LT", "9-Speed Automatic", "3.6L V6"),
        makeTrim("RS", "9-Speed Automatic", "3.6L V6"),
        makeTrim("Premier", "9-Speed Automatic", "3.6L V6")
      ]},
      { name: "Blazer EV", trims: [
        makeTrim("1LT", "Single-Speed", "Electric"),
        makeTrim("2LT", "Single-Speed", "Electric"),
        makeTrim("RS", "Single-Speed", "Electric"),
        makeTrim("SS", "Single-Speed", "Electric")
      ]},
      { name: "Bolt EUV", trims: [
        makeTrim("1LT", "Single-Speed", "Electric"),
        makeTrim("2LT", "Single-Speed", "Electric"),
        makeTrim("Premier", "Single-Speed", "Electric")
      ]},
      { name: "Bolt EV", trims: [
        makeTrim("1LT", "Single-Speed", "Electric"),
        makeTrim("2LT", "Single-Speed", "Electric")
      ]},
      { name: "Camaro", trims: [
        makeTrim("1LS", "6-Speed Manual", "2.0L Turbo"),
        makeTrim("1LT", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("2LT", "10-Speed Automatic", "3.6L V6"),
        makeTrim("1SS", "6-Speed Manual", "6.2L V8"),
        makeTrim("2SS", "10-Speed Automatic", "6.2L V8"),
        makeTrim("ZL1", "10-Speed Automatic", "6.2L Supercharged V8")
      ]},
      { name: "Colorado", trims: [
        makeTrim("WT", "8-Speed Automatic", "2.7L Turbo"),
        makeTrim("LT", "8-Speed Automatic", "2.7L Turbo"),
        makeTrim("Z71", "8-Speed Automatic", "2.7L Turbo"),
        makeTrim("Trail Boss", "8-Speed Automatic", "2.7L Turbo"),
        makeTrim("ZR2", "8-Speed Automatic", "2.7L Turbo")
      ]},
      { name: "Corvette", trims: [
        makeTrim("1LT", "8-Speed DCT", "6.2L V8"),
        makeTrim("2LT", "8-Speed DCT", "6.2L V8"),
        makeTrim("3LT", "8-Speed DCT", "6.2L V8"),
        makeTrim("Z06", "8-Speed DCT", "5.5L V8"),
        makeTrim("E-Ray", "8-Speed DCT", "6.2L V8 + Electric")
      ]},
      { name: "Equinox", trims: [
        makeTrim("LS", "6-Speed Automatic", "1.5L Turbo"),
        makeTrim("LT", "6-Speed Automatic", "1.5L Turbo"),
        makeTrim("RS", "6-Speed Automatic", "1.5L Turbo"),
        makeTrim("Premier", "6-Speed Automatic", "1.5L Turbo")
      ]},
      { name: "Equinox EV", trims: [
        makeTrim("1LT", "Single-Speed", "Electric"),
        makeTrim("2LT", "Single-Speed", "Electric"),
        makeTrim("3LT", "Single-Speed", "Electric"),
        makeTrim("2RS", "Single-Speed", "Electric"),
        makeTrim("3RS", "Single-Speed", "Electric")
      ]},
      { name: "Malibu", trims: [
        makeTrim("LS", "CVT", "1.5L Turbo"),
        makeTrim("RS", "CVT", "1.5L Turbo"),
        makeTrim("LT", "CVT", "1.5L Turbo"),
        makeTrim("2LT", "CVT", "1.5L Turbo")
      ]},
      { name: "Silverado 1500", trims: [
        makeTrim("WT", "8-Speed Automatic", "2.7L Turbo"),
        makeTrim("Custom", "8-Speed Automatic", "5.3L V8"),
        makeTrim("LT", "8-Speed Automatic", "5.3L V8"),
        makeTrim("RST", "10-Speed Automatic", "5.3L V8"),
        makeTrim("LT Trail Boss", "10-Speed Automatic", "5.3L V8"),
        makeTrim("LTZ", "10-Speed Automatic", "5.3L V8"),
        makeTrim("High Country", "10-Speed Automatic", "6.2L V8"),
        makeTrim("ZR2", "10-Speed Automatic", "6.2L V8")
      ]},
      { name: "Silverado EV", trims: [
        makeTrim("WT", "Single-Speed", "Electric"),
        makeTrim("RST", "Single-Speed", "Electric")
      ]},
      { name: "Suburban", trims: [
        makeTrim("LS", "10-Speed Automatic", "5.3L V8"),
        makeTrim("LT", "10-Speed Automatic", "5.3L V8"),
        makeTrim("RST", "10-Speed Automatic", "5.3L V8"),
        makeTrim("Z71", "10-Speed Automatic", "5.3L V8"),
        makeTrim("Premier", "10-Speed Automatic", "6.2L V8"),
        makeTrim("High Country", "10-Speed Automatic", "6.2L V8")
      ]},
      { name: "Tahoe", trims: [
        makeTrim("LS", "10-Speed Automatic", "5.3L V8"),
        makeTrim("LT", "10-Speed Automatic", "5.3L V8"),
        makeTrim("RST", "10-Speed Automatic", "6.2L V8"),
        makeTrim("Z71", "10-Speed Automatic", "5.3L V8"),
        makeTrim("Premier", "10-Speed Automatic", "6.2L V8"),
        makeTrim("High Country", "10-Speed Automatic", "6.2L V8")
      ]},
      { name: "Trailblazer", trims: [
        makeTrim("LS", "CVT", "1.2L Turbo"),
        makeTrim("LT", "CVT", "1.2L Turbo"),
        makeTrim("RS", "9-Speed Automatic", "1.3L Turbo"),
        makeTrim("Activ", "9-Speed Automatic", "1.3L Turbo")
      ]},
      { name: "Traverse", trims: [
        makeTrim("LS", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("LT", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("RS", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Z71", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Premier", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("High Country", "9-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "Trax", trims: [
        makeTrim("LS", "6-Speed Automatic", "1.2L Turbo"),
        makeTrim("LT", "6-Speed Automatic", "1.2L Turbo"),
        makeTrim("RS", "6-Speed Automatic", "1.2L Turbo"),
        makeTrim("Activ", "6-Speed Automatic", "1.2L Turbo")
      ]}
    ]
  },
  {
    name: "Chrysler",
    models: [
      { name: "300", trims: [
        makeTrim("Touring", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Touring L", "8-Speed Automatic", "3.6L V6"),
        makeTrim("300S", "8-Speed Automatic", "3.6L V6"),
        makeTrim("300C", "8-Speed Automatic", "6.4L HEMI V8")
      ]},
      { name: "Pacifica", trims: [
        makeTrim("Touring", "9-Speed Automatic", "3.6L V6"),
        makeTrim("Touring L", "9-Speed Automatic", "3.6L V6"),
        makeTrim("Limited", "9-Speed Automatic", "3.6L V6"),
        makeTrim("Pinnacle", "9-Speed Automatic", "3.6L V6"),
        makeTrim("Hybrid Touring", "CVT", "3.6L V6 PHEV"),
        makeTrim("Hybrid Limited", "CVT", "3.6L V6 PHEV"),
        makeTrim("Hybrid Pinnacle", "CVT", "3.6L V6 PHEV")
      ]},
      { name: "Grand Caravan", trims: [
        makeTrim("SXT", "9-Speed Automatic", "3.6L V6")
      ]}
    ]
  },
  {
    name: "Dodge",
    models: [
      { name: "Challenger", trims: [
        makeTrim("SXT", "8-Speed Automatic", "3.6L V6"),
        makeTrim("GT", "8-Speed Automatic", "3.6L V6"),
        makeTrim("R/T", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("R/T Scat Pack", "8-Speed Automatic", "6.4L HEMI V8"),
        makeTrim("SRT Hellcat", "8-Speed Automatic", "6.2L Supercharged HEMI V8")
      ]},
      { name: "Charger", trims: [
        makeTrim("SXT", "8-Speed Automatic", "3.6L V6"),
        makeTrim("GT", "8-Speed Automatic", "3.6L V6"),
        makeTrim("R/T", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("Scat Pack", "8-Speed Automatic", "6.4L HEMI V8"),
        makeTrim("SRT Hellcat", "8-Speed Automatic", "6.2L Supercharged HEMI V8")
      ]},
      { name: "Durango", trims: [
        makeTrim("SXT", "8-Speed Automatic", "3.6L V6"),
        makeTrim("GT", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Citadel", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("R/T", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("SRT 392", "8-Speed Automatic", "6.4L HEMI V8"),
        makeTrim("SRT Hellcat", "8-Speed Automatic", "6.2L Supercharged HEMI V8")
      ]},
      { name: "Hornet", trims: [
        makeTrim("GT", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("GT Plus", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("R/T", "6-Speed Automatic", "1.3L Turbo PHEV"),
        makeTrim("R/T Plus", "6-Speed Automatic", "1.3L Turbo PHEV")
      ]}
    ]
  },
  {
    name: "Ferrari",
    models: [
      { name: "296 GTB", trims: [
        makeTrim("Base", "8-Speed DCT", "3.0L Twin-Turbo V6 PHEV"),
        makeTrim("Assetto Fiorano", "8-Speed DCT", "3.0L Twin-Turbo V6 PHEV")
      ]},
      { name: "296 GTS", trims: [
        makeTrim("Base", "8-Speed DCT", "3.0L Twin-Turbo V6 PHEV")
      ]},
      { name: "812 Competizione", trims: [
        makeTrim("Coupe", "7-Speed DCT", "6.5L V12"),
        makeTrim("A", "7-Speed DCT", "6.5L V12")
      ]},
      { name: "F8 Tributo", trims: [
        makeTrim("Base", "7-Speed DCT", "3.9L Twin-Turbo V8")
      ]},
      { name: "F8 Spider", trims: [
        makeTrim("Base", "7-Speed DCT", "3.9L Twin-Turbo V8")
      ]},
      { name: "Roma", trims: [
        makeTrim("Base", "8-Speed DCT", "3.9L Twin-Turbo V8")
      ]},
      { name: "SF90 Stradale", trims: [
        makeTrim("Base", "8-Speed DCT", "4.0L Twin-Turbo V8 PHEV"),
        makeTrim("Assetto Fiorano", "8-Speed DCT", "4.0L Twin-Turbo V8 PHEV")
      ]},
      { name: "Purosangue", trims: [
        makeTrim("Base", "8-Speed DCT", "6.5L V12")
      ]}
    ]
  },
  {
    name: "Fiat",
    models: [
      { name: "500e", trims: [
        makeTrim("Hatchback", "Single-Speed", "Electric"),
        makeTrim("Cabrio", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Ford",
    models: [
      { name: "Bronco", trims: [
        makeTrim("Base", "7-Speed Manual", "2.3L EcoBoost"),
        makeTrim("Big Bend", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("Black Diamond", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("Outer Banks", "10-Speed Automatic", "2.7L EcoBoost V6"),
        makeTrim("Badlands", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("Wildtrak", "10-Speed Automatic", "2.7L EcoBoost V6"),
        makeTrim("Raptor", "10-Speed Automatic", "3.0L EcoBoost V6")
      ]},
      { name: "Bronco Sport", trims: [
        makeTrim("Base", "8-Speed Automatic", "1.5L EcoBoost"),
        makeTrim("Big Bend", "8-Speed Automatic", "1.5L EcoBoost"),
        makeTrim("Outer Banks", "8-Speed Automatic", "1.5L EcoBoost"),
        makeTrim("Badlands", "8-Speed Automatic", "2.0L EcoBoost"),
        makeTrim("Heritage", "8-Speed Automatic", "2.0L EcoBoost")
      ]},
      { name: "Edge", trims: [
        makeTrim("SE", "8-Speed Automatic", "2.0L EcoBoost"),
        makeTrim("SEL", "8-Speed Automatic", "2.0L EcoBoost"),
        makeTrim("ST-Line", "8-Speed Automatic", "2.0L EcoBoost"),
        makeTrim("Titanium", "8-Speed Automatic", "2.0L EcoBoost"),
        makeTrim("ST", "8-Speed Automatic", "2.7L EcoBoost V6")
      ]},
      { name: "Escape", trims: [
        makeTrim("Base", "8-Speed Automatic", "1.5L EcoBoost"),
        makeTrim("Active", "8-Speed Automatic", "1.5L EcoBoost"),
        makeTrim("ST-Line", "8-Speed Automatic", "1.5L EcoBoost"),
        makeTrim("Platinum", "8-Speed Automatic", "2.0L EcoBoost"),
        makeTrim("PHEV", "CVT", "2.5L Atkinson PHEV")
      ]},
      { name: "Expedition", trims: [
        makeTrim("XL STX", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("XLT", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("Limited", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("King Ranch", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("Platinum", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("Timberline", "10-Speed Automatic", "3.5L EcoBoost V6")
      ]},
      { name: "Explorer", trims: [
        makeTrim("Base", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("XLT", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("ST-Line", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("Limited", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("Timberline", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("ST", "10-Speed Automatic", "3.0L EcoBoost V6"),
        makeTrim("Platinum", "10-Speed Automatic", "3.0L EcoBoost V6")
      ]},
      { name: "F-150", trims: [
        makeTrim("XL", "10-Speed Automatic", "3.3L V6"),
        makeTrim("XLT", "10-Speed Automatic", "2.7L EcoBoost V6"),
        makeTrim("Lariat", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("King Ranch", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("Platinum", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("Limited", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("Tremor", "10-Speed Automatic", "3.5L EcoBoost V6"),
        makeTrim("Raptor", "10-Speed Automatic", "3.5L High Output EcoBoost V6"),
        makeTrim("Raptor R", "10-Speed Automatic", "5.2L Supercharged V8")
      ]},
      { name: "F-150 Lightning", trims: [
        makeTrim("Pro", "Single-Speed", "Electric"),
        makeTrim("XLT", "Single-Speed", "Electric"),
        makeTrim("Lariat", "Single-Speed", "Electric"),
        makeTrim("Platinum", "Single-Speed", "Electric")
      ]},
      { name: "Maverick", trims: [
        makeTrim("XL", "CVT", "2.5L Hybrid"),
        makeTrim("XLT", "CVT", "2.5L Hybrid"),
        makeTrim("Lariat", "8-Speed Automatic", "2.0L EcoBoost"),
        makeTrim("Tremor", "8-Speed Automatic", "2.0L EcoBoost")
      ]},
      { name: "Mustang", trims: [
        makeTrim("EcoBoost", "6-Speed Manual", "2.3L EcoBoost"),
        makeTrim("EcoBoost Premium", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("GT", "6-Speed Manual", "5.0L Coyote V8"),
        makeTrim("GT Premium", "10-Speed Automatic", "5.0L Coyote V8"),
        makeTrim("Dark Horse", "6-Speed Manual", "5.0L Coyote V8")
      ]},
      { name: "Mustang Mach-E", trims: [
        makeTrim("Select", "Single-Speed", "Electric"),
        makeTrim("Premium", "Single-Speed", "Electric"),
        makeTrim("California Route 1", "Single-Speed", "Electric"),
        makeTrim("GT", "Single-Speed", "Electric")
      ]},
      { name: "Ranger", trims: [
        makeTrim("XL", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("XLT", "10-Speed Automatic", "2.3L EcoBoost"),
        makeTrim("Lariat", "10-Speed Automatic", "2.7L EcoBoost V6"),
        makeTrim("Tremor", "10-Speed Automatic", "2.7L EcoBoost V6"),
        makeTrim("Raptor", "10-Speed Automatic", "3.0L EcoBoost V6")
      ]}
    ]
  },
  {
    name: "Genesis",
    models: [
      { name: "G70", trims: [
        makeTrim("2.0T", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("2.0T Sport", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("3.3T", "8-Speed Automatic", "3.3L Twin-Turbo V6"),
        makeTrim("3.3T Sport", "8-Speed Automatic", "3.3L Twin-Turbo V6")
      ]},
      { name: "G80", trims: [
        makeTrim("2.5T", "8-Speed Automatic", "2.5L Turbo"),
        makeTrim("2.5T Advanced", "8-Speed Automatic", "2.5L Turbo"),
        makeTrim("3.5T Sport", "8-Speed Automatic", "3.5L Twin-Turbo V6"),
        makeTrim("Electrified G80", "Single-Speed", "Electric")
      ]},
      { name: "G90", trims: [
        makeTrim("3.5T", "8-Speed Automatic", "3.5L Twin-Turbo V6"),
        makeTrim("3.5T E-Supercharger", "8-Speed Automatic", "3.5L Twin-Turbo V6 Mild Hybrid")
      ]},
      { name: "GV60", trims: [
        makeTrim("Advanced", "Single-Speed", "Electric"),
        makeTrim("Performance", "Single-Speed", "Electric")
      ]},
      { name: "GV70", trims: [
        makeTrim("2.5T", "8-Speed Automatic", "2.5L Turbo"),
        makeTrim("2.5T Advanced", "8-Speed Automatic", "2.5L Turbo"),
        makeTrim("3.5T Sport", "8-Speed Automatic", "3.5L Twin-Turbo V6"),
        makeTrim("Electrified GV70", "Single-Speed", "Electric")
      ]},
      { name: "GV80", trims: [
        makeTrim("2.5T", "8-Speed Automatic", "2.5L Turbo"),
        makeTrim("2.5T Advanced", "8-Speed Automatic", "2.5L Turbo"),
        makeTrim("3.5T", "8-Speed Automatic", "3.5L Twin-Turbo V6"),
        makeTrim("3.5T Advanced+", "8-Speed Automatic", "3.5L Twin-Turbo V6")
      ]}
    ]
  },
  {
    name: "GMC",
    models: [
      { name: "Acadia", trims: [
        makeTrim("SLE", "9-Speed Automatic", "2.5L"),
        makeTrim("AT4", "9-Speed Automatic", "3.6L V6"),
        makeTrim("Denali", "9-Speed Automatic", "3.6L V6")
      ]},
      { name: "Canyon", trims: [
        makeTrim("Elevation", "8-Speed Automatic", "2.7L Turbo"),
        makeTrim("AT4", "8-Speed Automatic", "2.7L Turbo"),
        makeTrim("AT4X", "8-Speed Automatic", "2.7L Turbo"),
        makeTrim("Denali", "8-Speed Automatic", "2.7L Turbo")
      ]},
      { name: "Hummer EV Pickup", trims: [
        makeTrim("EV2", "Single-Speed", "Electric"),
        makeTrim("EV2X", "Single-Speed", "Electric"),
        makeTrim("EV3X", "Single-Speed", "Electric"),
        makeTrim("Edition 1", "Single-Speed", "Electric")
      ]},
      { name: "Hummer EV SUV", trims: [
        makeTrim("EV2", "Single-Speed", "Electric"),
        makeTrim("EV2X", "Single-Speed", "Electric"),
        makeTrim("EV3X", "Single-Speed", "Electric"),
        makeTrim("Edition 1", "Single-Speed", "Electric")
      ]},
      { name: "Sierra 1500", trims: [
        makeTrim("Pro", "8-Speed Automatic", "2.7L Turbo"),
        makeTrim("SLE", "8-Speed Automatic", "5.3L V8"),
        makeTrim("Elevation", "10-Speed Automatic", "5.3L V8"),
        makeTrim("SLT", "10-Speed Automatic", "5.3L V8"),
        makeTrim("AT4", "10-Speed Automatic", "5.3L V8"),
        makeTrim("AT4X", "10-Speed Automatic", "6.2L V8"),
        makeTrim("Denali", "10-Speed Automatic", "6.2L V8"),
        makeTrim("Denali Ultimate", "10-Speed Automatic", "6.2L V8")
      ]},
      { name: "Sierra EV", trims: [
        makeTrim("Elevation", "Single-Speed", "Electric"),
        makeTrim("AT4", "Single-Speed", "Electric"),
        makeTrim("Denali Edition 1", "Single-Speed", "Electric")
      ]},
      { name: "Terrain", trims: [
        makeTrim("SLE", "9-Speed Automatic", "1.5L Turbo"),
        makeTrim("AT4", "9-Speed Automatic", "1.5L Turbo"),
        makeTrim("Denali", "9-Speed Automatic", "1.5L Turbo")
      ]},
      { name: "Yukon", trims: [
        makeTrim("SLE", "10-Speed Automatic", "5.3L V8"),
        makeTrim("SLT", "10-Speed Automatic", "5.3L V8"),
        makeTrim("AT4", "10-Speed Automatic", "6.2L V8"),
        makeTrim("Denali", "10-Speed Automatic", "6.2L V8"),
        makeTrim("Denali Ultimate", "10-Speed Automatic", "6.2L V8")
      ]}
    ]
  },
  {
    name: "Honda",
    models: [
      { name: "Accord", trims: [
        makeTrim("LX", "CVT", "1.5L Turbo"),
        makeTrim("EX", "CVT", "1.5L Turbo"),
        makeTrim("Sport", "CVT", "1.5L Turbo"),
        makeTrim("EX-L", "CVT", "1.5L Turbo"),
        makeTrim("Sport-L", "CVT", "2.0L Turbo"),
        makeTrim("Touring", "10-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "Accord Hybrid", trims: [
        makeTrim("Sport", "e-CVT", "2.0L Hybrid"),
        makeTrim("Sport-L", "e-CVT", "2.0L Hybrid"),
        makeTrim("Touring", "e-CVT", "2.0L Hybrid")
      ]},
      { name: "Civic", trims: [
        makeTrim("LX", "CVT", "2.0L"),
        makeTrim("Sport", "CVT", "2.0L"),
        makeTrim("EX", "CVT", "1.5L Turbo"),
        makeTrim("Touring", "CVT", "1.5L Turbo"),
        makeTrim("Si", "6-Speed Manual", "1.5L Turbo"),
        makeTrim("Type R", "6-Speed Manual", "2.0L Turbo")
      ]},
      { name: "Civic Hatchback", trims: [
        makeTrim("LX", "CVT", "2.0L"),
        makeTrim("Sport", "CVT", "2.0L"),
        makeTrim("EX-L", "CVT", "1.5L Turbo"),
        makeTrim("Sport Touring", "CVT", "1.5L Turbo")
      ]},
      { name: "CR-V", trims: [
        makeTrim("LX", "CVT", "1.5L Turbo"),
        makeTrim("EX", "CVT", "1.5L Turbo"),
        makeTrim("EX-L", "CVT", "1.5L Turbo"),
        makeTrim("Sport", "CVT", "1.5L Turbo"),
        makeTrim("Sport Touring", "CVT", "1.5L Turbo"),
        makeTrim("Touring", "CVT", "1.5L Turbo")
      ]},
      { name: "CR-V Hybrid", trims: [
        makeTrim("Sport", "e-CVT", "2.0L Hybrid"),
        makeTrim("Sport-L", "e-CVT", "2.0L Hybrid"),
        makeTrim("Sport Touring", "e-CVT", "2.0L Hybrid")
      ]},
      { name: "HR-V", trims: [
        makeTrim("LX", "CVT", "2.0L"),
        makeTrim("Sport", "CVT", "2.0L"),
        makeTrim("EX-L", "CVT", "2.0L")
      ]},
      { name: "Odyssey", trims: [
        makeTrim("LX", "10-Speed Automatic", "3.5L V6"),
        makeTrim("EX", "10-Speed Automatic", "3.5L V6"),
        makeTrim("EX-L", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Sport", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Touring", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Elite", "10-Speed Automatic", "3.5L V6")
      ]},
      { name: "Passport", trims: [
        makeTrim("Sport", "10-Speed Automatic", "3.5L V6"),
        makeTrim("EX-L", "10-Speed Automatic", "3.5L V6"),
        makeTrim("TrailSport", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Touring", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Elite", "10-Speed Automatic", "3.5L V6")
      ]},
      { name: "Pilot", trims: [
        makeTrim("LX", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Sport", "10-Speed Automatic", "3.5L V6"),
        makeTrim("EX-L", "10-Speed Automatic", "3.5L V6"),
        makeTrim("TrailSport", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Touring", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Elite", "10-Speed Automatic", "3.5L V6"),
        makeTrim("Black Edition", "10-Speed Automatic", "3.5L V6")
      ]},
      { name: "Prologue", trims: [
        makeTrim("EX", "Single-Speed", "Electric"),
        makeTrim("Touring", "Single-Speed", "Electric"),
        makeTrim("Elite", "Single-Speed", "Electric")
      ]},
      { name: "Ridgeline", trims: [
        makeTrim("Sport", "9-Speed Automatic", "3.5L V6"),
        makeTrim("RTL", "9-Speed Automatic", "3.5L V6"),
        makeTrim("RTL-E", "9-Speed Automatic", "3.5L V6"),
        makeTrim("TrailSport", "9-Speed Automatic", "3.5L V6"),
        makeTrim("Black Edition", "9-Speed Automatic", "3.5L V6")
      ]}
    ]
  },
  {
    name: "Hyundai",
    models: [
      { name: "Elantra", trims: [
        makeTrim("Essential", "CVT", "2.0L"),
        makeTrim("Preferred", "CVT", "2.0L"),
        makeTrim("Luxury", "CVT", "2.0L"),
        makeTrim("N Line", "7-Speed DCT", "1.6L Turbo"),
        makeTrim("N", "6-Speed Manual", "2.0L Turbo")
      ]},
      { name: "Elantra Hybrid", trims: [
        makeTrim("Essential", "6-Speed DCT", "1.6L Hybrid"),
        makeTrim("Preferred", "6-Speed DCT", "1.6L Hybrid"),
        makeTrim("Luxury", "6-Speed DCT", "1.6L Hybrid")
      ]},
      { name: "IONIQ 5", trims: [
        makeTrim("Essential", "Single-Speed", "Electric"),
        makeTrim("Preferred", "Single-Speed", "Electric"),
        makeTrim("Preferred Long Range", "Single-Speed", "Electric"),
        makeTrim("Ultimate", "Single-Speed", "Electric"),
        makeTrim("N", "Single-Speed", "Electric")
      ]},
      { name: "IONIQ 6", trims: [
        makeTrim("Essential", "Single-Speed", "Electric"),
        makeTrim("Preferred", "Single-Speed", "Electric"),
        makeTrim("Ultimate", "Single-Speed", "Electric")
      ]},
      { name: "Kona", trims: [
        makeTrim("Essential", "CVT", "2.0L"),
        makeTrim("Preferred", "CVT", "2.0L"),
        makeTrim("Preferred Trend", "CVT", "2.0L"),
        makeTrim("N Line", "7-Speed DCT", "1.6L Turbo"),
        makeTrim("Ultimate", "CVT", "2.0L"),
        makeTrim("N", "8-Speed DCT", "2.0L Turbo")
      ]},
      { name: "Kona Electric", trims: [
        makeTrim("Essential", "Single-Speed", "Electric"),
        makeTrim("Preferred", "Single-Speed", "Electric"),
        makeTrim("Ultimate", "Single-Speed", "Electric")
      ]},
      { name: "Palisade", trims: [
        makeTrim("Essential", "8-Speed Automatic", "3.8L V6"),
        makeTrim("Preferred", "8-Speed Automatic", "3.8L V6"),
        makeTrim("Luxury", "8-Speed Automatic", "3.8L V6"),
        makeTrim("Ultimate Calligraphy", "8-Speed Automatic", "3.8L V6")
      ]},
      { name: "Santa Cruz", trims: [
        makeTrim("Essential", "8-Speed Automatic", "2.5L"),
        makeTrim("Preferred", "8-Speed Automatic", "2.5L"),
        makeTrim("Preferred Trend", "8-Speed DCT", "2.5L Turbo"),
        makeTrim("Ultimate", "8-Speed DCT", "2.5L Turbo")
      ]},
      { name: "Santa Fe", trims: [
        makeTrim("Essential", "8-Speed Automatic", "2.5L"),
        makeTrim("Preferred", "8-Speed Automatic", "2.5L"),
        makeTrim("Preferred Trend", "8-Speed DCT", "2.5L Turbo"),
        makeTrim("Calligraphy", "8-Speed DCT", "2.5L Turbo"),
        makeTrim("Ultimate Calligraphy", "8-Speed DCT", "2.5L Turbo")
      ]},
      { name: "Santa Fe Hybrid", trims: [
        makeTrim("Preferred", "6-Speed Automatic", "1.6L Turbo Hybrid"),
        makeTrim("Luxury", "6-Speed Automatic", "1.6L Turbo Hybrid"),
        makeTrim("Ultimate Calligraphy", "6-Speed Automatic", "1.6L Turbo Hybrid")
      ]},
      { name: "Sonata", trims: [
        makeTrim("Essential", "8-Speed Automatic", "2.5L"),
        makeTrim("Preferred", "8-Speed Automatic", "2.5L"),
        makeTrim("Luxury", "8-Speed Automatic", "2.5L"),
        makeTrim("N Line", "8-Speed DCT", "2.5L Turbo")
      ]},
      { name: "Tucson", trims: [
        makeTrim("Essential", "8-Speed Automatic", "2.5L"),
        makeTrim("Preferred", "8-Speed Automatic", "2.5L"),
        makeTrim("Preferred Trend", "8-Speed Automatic", "2.5L"),
        makeTrim("N Line", "8-Speed DCT", "2.5L Turbo"),
        makeTrim("Ultimate", "8-Speed Automatic", "2.5L")
      ]},
      { name: "Tucson Hybrid", trims: [
        makeTrim("Preferred", "6-Speed Automatic", "1.6L Turbo Hybrid"),
        makeTrim("Luxury", "6-Speed Automatic", "1.6L Turbo Hybrid"),
        makeTrim("Ultimate", "6-Speed Automatic", "1.6L Turbo Hybrid")
      ]},
      { name: "Venue", trims: [
        makeTrim("Essential", "CVT", "1.6L"),
        makeTrim("Preferred", "CVT", "1.6L"),
        makeTrim("Ultimate", "CVT", "1.6L")
      ]}
    ]
  },
  {
    name: "INEOS",
    models: [
      { name: "Grenadier", trims: [
        makeTrim("Base", "8-Speed Automatic", "3.0L Turbo I6"),
        makeTrim("Trialmaster Edition", "8-Speed Automatic", "3.0L Turbo I6"),
        makeTrim("Fieldmaster Edition", "8-Speed Automatic", "3.0L Turbo I6")
      ]}
    ]
  },
  {
    name: "Infiniti",
    models: [
      { name: "Q50", trims: [
        makeTrim("Pure", "7-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Luxe", "7-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Sensory", "7-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Red Sport 400", "7-Speed Automatic", "3.0L Twin-Turbo V6")
      ]},
      { name: "QX50", trims: [
        makeTrim("Pure", "CVT", "2.0L VC-Turbo"),
        makeTrim("Luxe", "CVT", "2.0L VC-Turbo"),
        makeTrim("Essential", "CVT", "2.0L VC-Turbo"),
        makeTrim("Sensory", "CVT", "2.0L VC-Turbo"),
        makeTrim("Autograph", "CVT", "2.0L VC-Turbo")
      ]},
      { name: "QX55", trims: [
        makeTrim("Luxe", "CVT", "2.0L VC-Turbo"),
        makeTrim("Essential", "CVT", "2.0L VC-Turbo"),
        makeTrim("Sensory", "CVT", "2.0L VC-Turbo")
      ]},
      { name: "QX60", trims: [
        makeTrim("Pure", "9-Speed Automatic", "3.5L V6"),
        makeTrim("Luxe", "9-Speed Automatic", "3.5L V6"),
        makeTrim("Sensory", "9-Speed Automatic", "3.5L V6"),
        makeTrim("Autograph", "9-Speed Automatic", "3.5L V6")
      ]},
      { name: "QX80", trims: [
        makeTrim("Luxe", "7-Speed Automatic", "5.6L V8"),
        makeTrim("Sensory", "7-Speed Automatic", "5.6L V8"),
        makeTrim("Autograph", "7-Speed Automatic", "5.6L V8")
      ]}
    ]
  },
  {
    name: "Jaguar",
    models: [
      { name: "E-PACE", trims: [
        makeTrim("P250", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("P250 S", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("P250 SE", "9-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "F-PACE", trims: [
        makeTrim("P250", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("P250 S", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("P340 S", "8-Speed Automatic", "3.0L Inline-6"),
        makeTrim("P400 R-Dynamic S", "8-Speed Automatic", "3.0L Inline-6 MHEV"),
        makeTrim("SVR", "8-Speed Automatic", "5.0L Supercharged V8")
      ]},
      { name: "F-TYPE", trims: [
        makeTrim("P300", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("P380", "8-Speed Automatic", "3.0L Supercharged V6"),
        makeTrim("P450", "8-Speed Automatic", "5.0L Supercharged V8"),
        makeTrim("P575 R", "8-Speed Automatic", "5.0L Supercharged V8")
      ]},
      { name: "I-PACE", trims: [
        makeTrim("S", "Single-Speed", "Electric"),
        makeTrim("SE", "Single-Speed", "Electric"),
        makeTrim("HSE", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Jeep",
    models: [
      { name: "Compass", trims: [
        makeTrim("Sport", "8-Speed Automatic", "2.4L"),
        makeTrim("North", "8-Speed Automatic", "2.4L"),
        makeTrim("Altitude", "8-Speed Automatic", "2.4L"),
        makeTrim("Limited", "8-Speed Automatic", "2.4L"),
        makeTrim("Trailhawk", "9-Speed Automatic", "2.4L")
      ]},
      { name: "Gladiator", trims: [
        makeTrim("Sport S", "6-Speed Manual", "3.6L V6"),
        makeTrim("Willys", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Rubicon", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Mojave", "8-Speed Automatic", "3.6L V6"),
        makeTrim("High Altitude", "8-Speed Automatic", "3.6L V6")
      ]},
      { name: "Grand Cherokee", trims: [
        makeTrim("Laredo", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Altitude", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Limited", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Overland", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("Trailhawk", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("Summit", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("Summit Reserve", "8-Speed Automatic", "6.4L HEMI V8")
      ]},
      { name: "Grand Cherokee 4xe", trims: [
        makeTrim("Base", "8-Speed Automatic", "2.0L Turbo PHEV"),
        makeTrim("Trailhawk", "8-Speed Automatic", "2.0L Turbo PHEV"),
        makeTrim("Summit", "8-Speed Automatic", "2.0L Turbo PHEV"),
        makeTrim("Summit Reserve", "8-Speed Automatic", "2.0L Turbo PHEV")
      ]},
      { name: "Grand Wagoneer", trims: [
        makeTrim("Series I", "8-Speed Automatic", "3.0L Twin-Turbo I6"),
        makeTrim("Series II", "8-Speed Automatic", "3.0L Twin-Turbo I6"),
        makeTrim("Series III", "8-Speed Automatic", "3.0L Twin-Turbo I6"),
        makeTrim("Obsidian", "8-Speed Automatic", "3.0L Twin-Turbo I6")
      ]},
      { name: "Wagoneer", trims: [
        makeTrim("Series I", "8-Speed Automatic", "3.0L Twin-Turbo I6"),
        makeTrim("Series II", "8-Speed Automatic", "3.0L Twin-Turbo I6"),
        makeTrim("Series III", "8-Speed Automatic", "3.0L Twin-Turbo I6"),
        makeTrim("Carbide", "8-Speed Automatic", "3.0L Twin-Turbo I6")
      ]},
      { name: "Wrangler", trims: [
        makeTrim("Sport", "6-Speed Manual", "3.6L V6"),
        makeTrim("Sport S", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Willys", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Sahara", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Rubicon", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Rubicon 392", "8-Speed Automatic", "6.4L HEMI V8")
      ]},
      { name: "Wrangler 4xe", trims: [
        makeTrim("Sahara", "8-Speed Automatic", "2.0L Turbo PHEV"),
        makeTrim("Rubicon", "8-Speed Automatic", "2.0L Turbo PHEV"),
        makeTrim("High Altitude", "8-Speed Automatic", "2.0L Turbo PHEV")
      ]}
    ]
  },
  {
    name: "Kia",
    models: [
      { name: "Carnival", trims: [
        makeTrim("LX", "8-Speed Automatic", "3.5L V6"),
        makeTrim("LX+", "8-Speed Automatic", "3.5L V6"),
        makeTrim("EX", "8-Speed Automatic", "3.5L V6"),
        makeTrim("EX+", "8-Speed Automatic", "3.5L V6"),
        makeTrim("SX", "8-Speed Automatic", "3.5L V6")
      ]},
      { name: "EV6", trims: [
        makeTrim("Standard Range RWD", "Single-Speed", "Electric"),
        makeTrim("Long Range RWD", "Single-Speed", "Electric"),
        makeTrim("Long Range AWD", "Single-Speed", "Electric"),
        makeTrim("GT-Line", "Single-Speed", "Electric"),
        makeTrim("GT", "Single-Speed", "Electric")
      ]},
      { name: "EV9", trims: [
        makeTrim("Light Long Range RWD", "Single-Speed", "Electric"),
        makeTrim("Wind Long Range AWD", "Single-Speed", "Electric"),
        makeTrim("Land Long Range AWD", "Single-Speed", "Electric"),
        makeTrim("GT-Line", "Single-Speed", "Electric")
      ]},
      { name: "Forte", trims: [
        makeTrim("LX", "CVT", "2.0L"),
        makeTrim("EX", "CVT", "2.0L"),
        makeTrim("GT-Line", "CVT", "2.0L"),
        makeTrim("GT", "7-Speed DCT", "1.6L Turbo")
      ]},
      { name: "K5", trims: [
        makeTrim("LX", "8-Speed Automatic", "1.6L Turbo"),
        makeTrim("LXS", "8-Speed Automatic", "1.6L Turbo"),
        makeTrim("GT-Line", "8-Speed Automatic", "1.6L Turbo"),
        makeTrim("EX", "8-Speed Automatic", "1.6L Turbo"),
        makeTrim("GT", "8-Speed DCT", "2.5L Turbo")
      ]},
      { name: "Niro", trims: [
        makeTrim("LX", "6-Speed DCT", "1.6L Hybrid"),
        makeTrim("EX", "6-Speed DCT", "1.6L Hybrid"),
        makeTrim("EX Premium", "6-Speed DCT", "1.6L Hybrid"),
        makeTrim("SX Touring", "6-Speed DCT", "1.6L Hybrid")
      ]},
      { name: "Niro EV", trims: [
        makeTrim("Wind", "Single-Speed", "Electric"),
        makeTrim("Wave", "Single-Speed", "Electric")
      ]},
      { name: "Seltos", trims: [
        makeTrim("LX", "CVT", "2.0L"),
        makeTrim("EX", "CVT", "2.0L"),
        makeTrim("EX Premium", "8-Speed Automatic", "1.6L Turbo"),
        makeTrim("SX Turbo", "7-Speed DCT", "1.6L Turbo")
      ]},
      { name: "Sorento", trims: [
        makeTrim("LX", "8-Speed Automatic", "2.5L"),
        makeTrim("LX+", "8-Speed Automatic", "2.5L"),
        makeTrim("EX", "8-Speed DCT", "2.5L Turbo"),
        makeTrim("EX+", "8-Speed DCT", "2.5L Turbo"),
        makeTrim("SX", "8-Speed DCT", "2.5L Turbo"),
        makeTrim("X-Line", "8-Speed DCT", "2.5L Turbo")
      ]},
      { name: "Sorento Hybrid", trims: [
        makeTrim("LX+", "6-Speed Automatic", "1.6L Turbo Hybrid"),
        makeTrim("EX+", "6-Speed Automatic", "1.6L Turbo Hybrid"),
        makeTrim("SX", "6-Speed Automatic", "1.6L Turbo Hybrid")
      ]},
      { name: "Soul", trims: [
        makeTrim("LX", "CVT", "2.0L"),
        makeTrim("EX", "CVT", "2.0L"),
        makeTrim("GT-Line", "7-Speed DCT", "1.6L Turbo")
      ]},
      { name: "Sportage", trims: [
        makeTrim("LX", "8-Speed Automatic", "2.5L"),
        makeTrim("EX", "8-Speed Automatic", "2.5L"),
        makeTrim("EX Premium", "8-Speed Automatic", "2.5L"),
        makeTrim("X-Line", "8-Speed DCT", "2.5L Turbo"),
        makeTrim("SX", "8-Speed DCT", "2.5L Turbo")
      ]},
      { name: "Sportage Hybrid", trims: [
        makeTrim("LX", "6-Speed Automatic", "1.6L Turbo Hybrid"),
        makeTrim("EX", "6-Speed Automatic", "1.6L Turbo Hybrid"),
        makeTrim("EX Premium", "6-Speed Automatic", "1.6L Turbo Hybrid"),
        makeTrim("SX", "6-Speed Automatic", "1.6L Turbo Hybrid")
      ]},
      { name: "Stinger", trims: [
        makeTrim("GT-Line", "8-Speed Automatic", "2.5L Turbo"),
        makeTrim("GT Elite", "8-Speed Automatic", "3.3L Twin-Turbo V6")
      ]},
      { name: "Telluride", trims: [
        makeTrim("LX", "8-Speed Automatic", "3.8L V6"),
        makeTrim("EX", "8-Speed Automatic", "3.8L V6"),
        makeTrim("SX", "8-Speed Automatic", "3.8L V6"),
        makeTrim("X-Line", "8-Speed Automatic", "3.8L V6"),
        makeTrim("X-Pro", "8-Speed Automatic", "3.8L V6")
      ]}
    ]
  },
  {
    name: "Lamborghini",
    models: [
      { name: "Huracán", trims: [
        makeTrim("EVO Coupe", "7-Speed DCT", "5.2L V10"),
        makeTrim("EVO Spyder", "7-Speed DCT", "5.2L V10"),
        makeTrim("Tecnica", "7-Speed DCT", "5.2L V10"),
        makeTrim("STO", "7-Speed DCT", "5.2L V10"),
        makeTrim("Sterrato", "7-Speed DCT", "5.2L V10")
      ]},
      { name: "Revuelto", trims: [
        makeTrim("Base", "8-Speed DCT", "6.5L V12 PHEV")
      ]},
      { name: "Urus", trims: [
        makeTrim("Base", "8-Speed Automatic", "4.0L Twin-Turbo V8"),
        makeTrim("S", "8-Speed Automatic", "4.0L Twin-Turbo V8"),
        makeTrim("Performante", "8-Speed Automatic", "4.0L Twin-Turbo V8"),
        makeTrim("SE", "8-Speed Automatic", "4.0L Twin-Turbo V8 PHEV")
      ]}
    ]
  },
  {
    name: "Land Rover",
    models: [
      { name: "Defender", trims: [
        makeTrim("90 S", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("90 SE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("90 X-Dynamic HSE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("90 V8", "8-Speed Automatic", "5.0L Supercharged V8"),
        makeTrim("110 S", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("110 SE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("110 X", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("130 SE", "8-Speed Automatic", "3.0L Turbo I6 MHEV")
      ]},
      { name: "Discovery", trims: [
        makeTrim("S", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("SE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("Dynamic SE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("HSE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("Metropolitan Edition", "8-Speed Automatic", "3.0L Turbo I6 MHEV")
      ]},
      { name: "Discovery Sport", trims: [
        makeTrim("S", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("SE", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Dynamic SE", "9-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "Range Rover", trims: [
        makeTrim("SE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("HSE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("Autobiography", "8-Speed Automatic", "4.4L Twin-Turbo V8"),
        makeTrim("SV", "8-Speed Automatic", "4.4L Twin-Turbo V8"),
        makeTrim("First Edition", "8-Speed Automatic", "4.4L Twin-Turbo V8")
      ]},
      { name: "Range Rover Evoque", trims: [
        makeTrim("S", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("SE", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Dynamic SE", "9-Speed Automatic", "2.0L Turbo"),
        makeTrim("Autobiography", "9-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "Range Rover Sport", trims: [
        makeTrim("SE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("Dynamic SE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("Autobiography", "8-Speed Automatic", "4.4L Twin-Turbo V8"),
        makeTrim("First Edition", "8-Speed Automatic", "4.4L Twin-Turbo V8"),
        makeTrim("SVR", "8-Speed Automatic", "4.4L Twin-Turbo V8")
      ]},
      { name: "Range Rover Velar", trims: [
        makeTrim("S", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("SE", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Dynamic SE", "8-Speed Automatic", "3.0L Turbo I6 MHEV"),
        makeTrim("HSE", "8-Speed Automatic", "3.0L Turbo I6 MHEV")
      ]}
    ]
  },
  {
    name: "Lexus",
    models: [
      { name: "ES", trims: [
        makeTrim("ES 250", "8-Speed Automatic", "2.5L"),
        makeTrim("ES 300h", "CVT", "2.5L Hybrid"),
        makeTrim("ES 350", "8-Speed Automatic", "3.5L V6")
      ]},
      { name: "GX", trims: [
        makeTrim("GX 460", "6-Speed Automatic", "4.6L V8"),
        makeTrim("GX 550", "10-Speed Automatic", "3.4L Twin-Turbo V6")
      ]},
      { name: "IS", trims: [
        makeTrim("IS 300", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("IS 300 AWD", "6-Speed Automatic", "3.5L V6"),
        makeTrim("IS 350", "8-Speed Automatic", "3.5L V6"),
        makeTrim("IS 500", "8-Speed Automatic", "5.0L V8")
      ]},
      { name: "LC", trims: [
        makeTrim("LC 500", "10-Speed Automatic", "5.0L V8"),
        makeTrim("LC 500h", "CVT", "3.5L V6 Hybrid"),
        makeTrim("LC 500 Convertible", "10-Speed Automatic", "5.0L V8")
      ]},
      { name: "LS", trims: [
        makeTrim("LS 500", "10-Speed Automatic", "3.4L Twin-Turbo V6"),
        makeTrim("LS 500h", "CVT", "3.5L V6 Hybrid")
      ]},
      { name: "LX", trims: [
        makeTrim("LX 600", "10-Speed Automatic", "3.4L Twin-Turbo V6"),
        makeTrim("LX 600 F Sport", "10-Speed Automatic", "3.4L Twin-Turbo V6")
      ]},
      { name: "NX", trims: [
        makeTrim("NX 250", "8-Speed Automatic", "2.5L"),
        makeTrim("NX 350", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("NX 350h", "CVT", "2.5L Hybrid"),
        makeTrim("NX 450h+", "CVT", "2.5L PHEV")
      ]},
      { name: "RC", trims: [
        makeTrim("RC 300", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("RC 350", "8-Speed Automatic", "3.5L V6"),
        makeTrim("RC F", "8-Speed Automatic", "5.0L V8")
      ]},
      { name: "RX", trims: [
        makeTrim("RX 350", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("RX 350h", "CVT", "2.5L Hybrid"),
        makeTrim("RX 450h+", "CVT", "2.5L PHEV"),
        makeTrim("RX 500h", "6-Speed Automatic", "2.4L Turbo Hybrid")
      ]},
      { name: "RZ", trims: [
        makeTrim("RZ 450e", "Single-Speed", "Electric")
      ]},
      { name: "TX", trims: [
        makeTrim("TX 350", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("TX 500h", "6-Speed Automatic", "2.4L Turbo Hybrid"),
        makeTrim("TX 550h+", "6-Speed Automatic", "2.4L Turbo PHEV")
      ]},
      { name: "UX", trims: [
        makeTrim("UX 200", "CVT", "2.0L"),
        makeTrim("UX 250h", "CVT", "2.0L Hybrid")
      ]}
    ]
  },
  {
    name: "Lincoln",
    models: [
      { name: "Aviator", trims: [
        makeTrim("Standard", "10-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Reserve", "10-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Black Label", "10-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Grand Touring", "10-Speed Automatic", "3.0L Twin-Turbo V6 PHEV")
      ]},
      { name: "Corsair", trims: [
        makeTrim("Standard", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Reserve", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Grand Touring", "CVT", "2.5L Atkinson PHEV")
      ]},
      { name: "Nautilus", trims: [
        makeTrim("Standard", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Reserve", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("Black Label", "8-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "Navigator", trims: [
        makeTrim("Standard", "10-Speed Automatic", "3.5L Twin-Turbo V6"),
        makeTrim("Reserve", "10-Speed Automatic", "3.5L Twin-Turbo V6"),
        makeTrim("Black Label", "10-Speed Automatic", "3.5L Twin-Turbo V6")
      ]}
    ]
  },
  {
    name: "Lotus",
    models: [
      { name: "Eletre", trims: [
        makeTrim("Base", "Single-Speed", "Electric"),
        makeTrim("S", "Single-Speed", "Electric"),
        makeTrim("R", "Single-Speed", "Electric")
      ]},
      { name: "Emira", trims: [
        makeTrim("First Edition", "6-Speed Manual", "3.5L V6"),
        makeTrim("V6", "6-Speed Manual", "3.5L V6"),
        makeTrim("i4", "8-Speed DCT", "2.0L AMG Turbo")
      ]}
    ]
  },
  {
    name: "Lucid",
    models: [
      { name: "Air", trims: [
        makeTrim("Pure", "Single-Speed", "Electric"),
        makeTrim("Touring", "Single-Speed", "Electric"),
        makeTrim("Grand Touring", "Single-Speed", "Electric"),
        makeTrim("Sapphire", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Maserati",
    models: [
      { name: "Ghibli", trims: [
        makeTrim("Base", "8-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Modena", "8-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Trofeo", "8-Speed Automatic", "3.8L Twin-Turbo V8")
      ]},
      { name: "GranTurismo", trims: [
        makeTrim("Modena", "8-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Trofeo", "8-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Folgore", "Single-Speed", "Electric")
      ]},
      { name: "Grecale", trims: [
        makeTrim("GT", "8-Speed Automatic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Modena", "8-Speed Automatic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Trofeo", "8-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Folgore", "Single-Speed", "Electric")
      ]},
      { name: "Levante", trims: [
        makeTrim("GT", "8-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Modena", "8-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Trofeo", "8-Speed Automatic", "3.8L Twin-Turbo V8")
      ]},
      { name: "MC20", trims: [
        makeTrim("Coupe", "8-Speed DCT", "3.0L Twin-Turbo V6"),
        makeTrim("Cielo", "8-Speed DCT", "3.0L Twin-Turbo V6")
      ]},
      { name: "Quattroporte", trims: [
        makeTrim("Modena", "8-Speed Automatic", "3.0L Twin-Turbo V6"),
        makeTrim("Trofeo", "8-Speed Automatic", "3.8L Twin-Turbo V8")
      ]}
    ]
  },
  {
    name: "Mazda",
    models: [
      { name: "CX-30", trims: [
        makeTrim("GX", "6-Speed Automatic", "2.5L"),
        makeTrim("GS", "6-Speed Automatic", "2.5L"),
        makeTrim("GT", "6-Speed Automatic", "2.5L"),
        makeTrim("GT Turbo", "6-Speed Automatic", "2.5L Turbo")
      ]},
      { name: "CX-5", trims: [
        makeTrim("GX", "6-Speed Automatic", "2.5L"),
        makeTrim("GS", "6-Speed Automatic", "2.5L"),
        makeTrim("GT", "6-Speed Automatic", "2.5L"),
        makeTrim("Signature", "6-Speed Automatic", "2.5L Turbo")
      ]},
      { name: "CX-50", trims: [
        makeTrim("GX", "6-Speed Automatic", "2.5L"),
        makeTrim("GS", "6-Speed Automatic", "2.5L"),
        makeTrim("GT", "6-Speed Automatic", "2.5L"),
        makeTrim("GT Turbo", "6-Speed Automatic", "2.5L Turbo"),
        makeTrim("Meridian Edition", "6-Speed Automatic", "2.5L Turbo")
      ]},
      { name: "CX-70", trims: [
        makeTrim("GS-L", "8-Speed Automatic", "3.3L Turbo"),
        makeTrim("GT", "8-Speed Automatic", "3.3L Turbo"),
        makeTrim("PHEV", "8-Speed Automatic", "2.5L PHEV")
      ]},
      { name: "CX-90", trims: [
        makeTrim("GS", "8-Speed Automatic", "3.3L Turbo Mild Hybrid"),
        makeTrim("GS-L", "8-Speed Automatic", "3.3L Turbo Mild Hybrid"),
        makeTrim("GT", "8-Speed Automatic", "3.3L Turbo Mild Hybrid"),
        makeTrim("Signature", "8-Speed Automatic", "3.3L Turbo Mild Hybrid"),
        makeTrim("PHEV", "8-Speed Automatic", "2.5L PHEV")
      ]},
      { name: "Mazda3", trims: [
        makeTrim("GX", "6-Speed Automatic", "2.0L"),
        makeTrim("GS", "6-Speed Automatic", "2.5L"),
        makeTrim("GT", "6-Speed Automatic", "2.5L"),
        makeTrim("GT Turbo", "6-Speed Automatic", "2.5L Turbo")
      ]},
      { name: "MX-5 Miata", trims: [
        makeTrim("GS", "6-Speed Manual", "2.0L"),
        makeTrim("GS-P", "6-Speed Manual", "2.0L"),
        makeTrim("GT", "6-Speed Manual", "2.0L"),
        makeTrim("RF GS-P", "6-Speed Manual", "2.0L"),
        makeTrim("RF GT", "6-Speed Manual", "2.0L")
      ]}
    ]
  },
  {
    name: "McLaren",
    models: [
      { name: "720S", trims: [
        makeTrim("Coupe", "7-Speed SSG", "4.0L Twin-Turbo V8"),
        makeTrim("Spider", "7-Speed SSG", "4.0L Twin-Turbo V8")
      ]},
      { name: "750S", trims: [
        makeTrim("Coupe", "7-Speed SSG", "4.0L Twin-Turbo V8"),
        makeTrim("Spider", "7-Speed SSG", "4.0L Twin-Turbo V8")
      ]},
      { name: "Artura", trims: [
        makeTrim("Base", "8-Speed DCT", "3.0L Twin-Turbo V6 PHEV"),
        makeTrim("Spider", "8-Speed DCT", "3.0L Twin-Turbo V6 PHEV")
      ]},
      { name: "GT", trims: [
        makeTrim("Base", "7-Speed SSG", "4.0L Twin-Turbo V8")
      ]}
    ]
  },
  {
    name: "Mercedes-Benz",
    models: [
      { name: "A-Class", trims: [
        makeTrim("A 220", "7G-DCT", "2.0L Turbo"),
        makeTrim("A 220 4MATIC", "7G-DCT", "2.0L Turbo"),
        makeTrim("AMG A 35", "AMG SPEEDSHIFT DCT", "2.0L Turbo")
      ]},
      { name: "C-Class", trims: [
        makeTrim("C 300", "9G-TRONIC", "2.0L Turbo"),
        makeTrim("C 300 4MATIC", "9G-TRONIC", "2.0L Turbo"),
        makeTrim("AMG C 43", "AMG SPEEDSHIFT MCT", "2.0L Turbo Mild Hybrid"),
        makeTrim("AMG C 63 S", "AMG SPEEDSHIFT MCT", "2.0L Turbo Hybrid")
      ]},
      { name: "CLA", trims: [
        makeTrim("CLA 250", "7G-DCT", "2.0L Turbo"),
        makeTrim("CLA 250 4MATIC", "7G-DCT", "2.0L Turbo"),
        makeTrim("AMG CLA 35", "AMG SPEEDSHIFT DCT", "2.0L Turbo"),
        makeTrim("AMG CLA 45", "AMG SPEEDSHIFT DCT", "2.0L Turbo")
      ]},
      { name: "E-Class", trims: [
        makeTrim("E 350", "9G-TRONIC", "2.0L Turbo Mild Hybrid"),
        makeTrim("E 350 4MATIC", "9G-TRONIC", "2.0L Turbo Mild Hybrid"),
        makeTrim("E 450 4MATIC", "9G-TRONIC", "3.0L Turbo Mild Hybrid"),
        makeTrim("AMG E 53", "AMG SPEEDSHIFT TCT", "3.0L Turbo Mild Hybrid"),
        makeTrim("AMG E 63 S", "AMG SPEEDSHIFT MCT", "4.0L Twin-Turbo V8")
      ]},
      { name: "EQB", trims: [
        makeTrim("EQB 250+", "Single-Speed", "Electric"),
        makeTrim("EQB 300 4MATIC", "Single-Speed", "Electric"),
        makeTrim("EQB 350 4MATIC", "Single-Speed", "Electric")
      ]},
      { name: "EQE", trims: [
        makeTrim("EQE 350+", "Single-Speed", "Electric"),
        makeTrim("EQE 350 4MATIC", "Single-Speed", "Electric"),
        makeTrim("EQE 500 4MATIC", "Single-Speed", "Electric"),
        makeTrim("AMG EQE 43", "Single-Speed", "Electric"),
        makeTrim("AMG EQE 53", "Single-Speed", "Electric")
      ]},
      { name: "EQE SUV", trims: [
        makeTrim("EQE 350+", "Single-Speed", "Electric"),
        makeTrim("EQE 350 4MATIC", "Single-Speed", "Electric"),
        makeTrim("EQE 500 4MATIC", "Single-Speed", "Electric"),
        makeTrim("AMG EQE 53", "Single-Speed", "Electric")
      ]},
      { name: "EQS", trims: [
        makeTrim("EQS 450+", "Single-Speed", "Electric"),
        makeTrim("EQS 450 4MATIC", "Single-Speed", "Electric"),
        makeTrim("EQS 580 4MATIC", "Single-Speed", "Electric"),
        makeTrim("AMG EQS 53", "Single-Speed", "Electric")
      ]},
      { name: "EQS SUV", trims: [
        makeTrim("EQS 450+", "Single-Speed", "Electric"),
        makeTrim("EQS 450 4MATIC", "Single-Speed", "Electric"),
        makeTrim("EQS 580 4MATIC", "Single-Speed", "Electric"),
        makeTrim("AMG EQS 53", "Single-Speed", "Electric")
      ]},
      { name: "G-Class", trims: [
        makeTrim("G 550", "9G-TRONIC", "4.0L Twin-Turbo V8"),
        makeTrim("AMG G 63", "AMG SPEEDSHIFT TCT", "4.0L Twin-Turbo V8")
      ]},
      { name: "GLA", trims: [
        makeTrim("GLA 250", "8G-DCT", "2.0L Turbo"),
        makeTrim("GLA 250 4MATIC", "8G-DCT", "2.0L Turbo"),
        makeTrim("AMG GLA 35", "AMG SPEEDSHIFT DCT", "2.0L Turbo"),
        makeTrim("AMG GLA 45", "AMG SPEEDSHIFT DCT", "2.0L Turbo")
      ]},
      { name: "GLB", trims: [
        makeTrim("GLB 250", "8G-DCT", "2.0L Turbo"),
        makeTrim("GLB 250 4MATIC", "8G-DCT", "2.0L Turbo"),
        makeTrim("AMG GLB 35", "AMG SPEEDSHIFT DCT", "2.0L Turbo")
      ]},
      { name: "GLC", trims: [
        makeTrim("GLC 300", "9G-TRONIC", "2.0L Turbo Mild Hybrid"),
        makeTrim("GLC 300 4MATIC", "9G-TRONIC", "2.0L Turbo Mild Hybrid"),
        makeTrim("AMG GLC 43", "AMG SPEEDSHIFT TCT", "2.0L Turbo Mild Hybrid"),
        makeTrim("AMG GLC 63 S", "AMG SPEEDSHIFT MCT", "2.0L Turbo Hybrid")
      ]},
      { name: "GLE", trims: [
        makeTrim("GLE 350", "9G-TRONIC", "2.0L Turbo Mild Hybrid"),
        makeTrim("GLE 450 4MATIC", "9G-TRONIC", "3.0L Turbo Mild Hybrid"),
        makeTrim("GLE 580 4MATIC", "9G-TRONIC", "4.0L Twin-Turbo V8 Mild Hybrid"),
        makeTrim("AMG GLE 53", "AMG SPEEDSHIFT TCT", "3.0L Turbo Mild Hybrid"),
        makeTrim("AMG GLE 63 S", "AMG SPEEDSHIFT TCT", "4.0L Twin-Turbo V8")
      ]},
      { name: "GLS", trims: [
        makeTrim("GLS 450 4MATIC", "9G-TRONIC", "3.0L Turbo Mild Hybrid"),
        makeTrim("GLS 580 4MATIC", "9G-TRONIC", "4.0L Twin-Turbo V8 Mild Hybrid"),
        makeTrim("AMG GLS 63", "AMG SPEEDSHIFT TCT", "4.0L Twin-Turbo V8"),
        makeTrim("Maybach GLS 600", "9G-TRONIC", "4.0L Twin-Turbo V8")
      ]},
      { name: "S-Class", trims: [
        makeTrim("S 500 4MATIC", "9G-TRONIC", "3.0L Turbo Mild Hybrid"),
        makeTrim("S 580 4MATIC", "9G-TRONIC", "4.0L Twin-Turbo V8 Mild Hybrid"),
        makeTrim("AMG S 63", "AMG SPEEDSHIFT MCT", "4.0L Twin-Turbo V8 Hybrid"),
        makeTrim("Maybach S 580", "9G-TRONIC", "4.0L Twin-Turbo V8"),
        makeTrim("Maybach S 680", "9G-TRONIC", "6.0L Twin-Turbo V12")
      ]},
      { name: "SL", trims: [
        makeTrim("AMG SL 43", "AMG SPEEDSHIFT MCT", "2.0L Turbo"),
        makeTrim("AMG SL 55", "AMG SPEEDSHIFT MCT", "4.0L Twin-Turbo V8"),
        makeTrim("AMG SL 63", "AMG SPEEDSHIFT MCT", "4.0L Twin-Turbo V8")
      ]},
      { name: "AMG GT", trims: [
        makeTrim("AMG GT 43", "AMG SPEEDSHIFT MCT", "2.0L Turbo Mild Hybrid"),
        makeTrim("AMG GT 55", "AMG SPEEDSHIFT MCT", "4.0L Twin-Turbo V8"),
        makeTrim("AMG GT 63", "AMG SPEEDSHIFT MCT", "4.0L Twin-Turbo V8"),
        makeTrim("AMG GT 63 S", "AMG SPEEDSHIFT MCT", "4.0L Twin-Turbo V8")
      ]}
    ]
  },
  {
    name: "Mini",
    models: [
      { name: "Cooper", trims: [
        makeTrim("Classic", "7-Speed DCT", "1.5L Turbo"),
        makeTrim("S", "7-Speed DCT", "2.0L Turbo"),
        makeTrim("John Cooper Works", "8-Speed Automatic", "2.0L Turbo")
      ]},
      { name: "Cooper Countryman", trims: [
        makeTrim("Classic", "7-Speed DCT", "1.5L Turbo"),
        makeTrim("S ALL4", "7-Speed DCT", "2.0L Turbo"),
        makeTrim("John Cooper Works ALL4", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("SE ALL4", "6-Speed Automatic", "1.5L Turbo PHEV")
      ]},
      { name: "Cooper Electric", trims: [
        makeTrim("E", "Single-Speed", "Electric"),
        makeTrim("SE", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Mitsubishi",
    models: [
      { name: "Eclipse Cross", trims: [
        makeTrim("ES", "CVT", "1.5L Turbo"),
        makeTrim("SE", "CVT", "1.5L Turbo"),
        makeTrim("GT", "CVT", "1.5L Turbo")
      ]},
      { name: "Mirage", trims: [
        makeTrim("ES", "CVT", "1.2L"),
        makeTrim("SE", "CVT", "1.2L"),
        makeTrim("GT", "CVT", "1.2L")
      ]},
      { name: "Outlander", trims: [
        makeTrim("ES", "CVT", "2.5L"),
        makeTrim("SE", "CVT", "2.5L"),
        makeTrim("SEL", "CVT", "2.5L"),
        makeTrim("GT", "CVT", "2.5L")
      ]},
      { name: "Outlander PHEV", trims: [
        makeTrim("ES", "CVT", "2.4L PHEV"),
        makeTrim("SE", "CVT", "2.4L PHEV"),
        makeTrim("SEL", "CVT", "2.4L PHEV"),
        makeTrim("GT", "CVT", "2.4L PHEV")
      ]},
      { name: "RVR", trims: [
        makeTrim("ES", "CVT", "2.0L"),
        makeTrim("SE", "CVT", "2.4L"),
        makeTrim("GT", "CVT", "2.4L")
      ]}
    ]
  },
  {
    name: "Nissan",
    models: [
      { name: "Altima", trims: [
        makeTrim("S", "CVT", "2.5L"),
        makeTrim("SV", "CVT", "2.5L"),
        makeTrim("SL", "CVT", "2.5L"),
        makeTrim("SR", "CVT", "2.5L"),
        makeTrim("Platinum", "CVT", "2.0L VC-Turbo")
      ]},
      { name: "ARIYA", trims: [
        makeTrim("Engage", "Single-Speed", "Electric"),
        makeTrim("Engage+", "Single-Speed", "Electric"),
        makeTrim("Evolve+", "Single-Speed", "Electric"),
        makeTrim("Empower+", "Single-Speed", "Electric"),
        makeTrim("Platinum+", "Single-Speed", "Electric")
      ]},
      { name: "Frontier", trims: [
        makeTrim("S", "9-Speed Automatic", "3.8L V6"),
        makeTrim("SV", "9-Speed Automatic", "3.8L V6"),
        makeTrim("PRO-4X", "9-Speed Automatic", "3.8L V6"),
        makeTrim("PRO-X", "9-Speed Automatic", "3.8L V6")
      ]},
      { name: "Kicks", trims: [
        makeTrim("S", "CVT", "1.6L"),
        makeTrim("SV", "CVT", "1.6L"),
        makeTrim("SR", "CVT", "1.6L")
      ]},
      { name: "LEAF", trims: [
        makeTrim("S", "Single-Speed", "Electric"),
        makeTrim("SV Plus", "Single-Speed", "Electric")
      ]},
      { name: "Maxima", trims: [
        makeTrim("SV", "CVT", "3.5L V6"),
        makeTrim("SR", "CVT", "3.5L V6"),
        makeTrim("Platinum", "CVT", "3.5L V6")
      ]},
      { name: "Murano", trims: [
        makeTrim("S", "CVT", "3.5L V6"),
        makeTrim("SV", "CVT", "3.5L V6"),
        makeTrim("SL", "CVT", "3.5L V6"),
        makeTrim("Platinum", "CVT", "3.5L V6")
      ]},
      { name: "Pathfinder", trims: [
        makeTrim("S", "9-Speed Automatic", "3.5L V6"),
        makeTrim("SV", "9-Speed Automatic", "3.5L V6"),
        makeTrim("SL", "9-Speed Automatic", "3.5L V6"),
        makeTrim("Platinum", "9-Speed Automatic", "3.5L V6"),
        makeTrim("Rock Creek", "9-Speed Automatic", "3.5L V6")
      ]},
      { name: "Qashqai", trims: [
        makeTrim("S", "CVT", "2.0L"),
        makeTrim("SV", "CVT", "2.0L"),
        makeTrim("SL", "CVT", "2.0L"),
        makeTrim("Platinum", "CVT", "2.0L")
      ]},
      { name: "Rogue", trims: [
        makeTrim("S", "CVT", "1.5L VC-Turbo"),
        makeTrim("SV", "CVT", "1.5L VC-Turbo"),
        makeTrim("SL", "CVT", "1.5L VC-Turbo"),
        makeTrim("Platinum", "CVT", "1.5L VC-Turbo")
      ]},
      { name: "Sentra", trims: [
        makeTrim("S", "CVT", "2.0L"),
        makeTrim("SV", "CVT", "2.0L"),
        makeTrim("SR", "CVT", "2.0L")
      ]},
      { name: "Titan", trims: [
        makeTrim("S", "9-Speed Automatic", "5.6L V8"),
        makeTrim("SV", "9-Speed Automatic", "5.6L V8"),
        makeTrim("PRO-4X", "9-Speed Automatic", "5.6L V8"),
        makeTrim("Platinum Reserve", "9-Speed Automatic", "5.6L V8")
      ]},
      { name: "Versa", trims: [
        makeTrim("S", "5-Speed Manual", "1.6L"),
        makeTrim("SV", "CVT", "1.6L"),
        makeTrim("SR", "CVT", "1.6L")
      ]},
      { name: "Z", trims: [
        makeTrim("Sport", "6-Speed Manual", "3.0L Twin-Turbo V6"),
        makeTrim("Performance", "6-Speed Manual", "3.0L Twin-Turbo V6"),
        makeTrim("NISMO", "9-Speed Automatic", "3.0L Twin-Turbo V6")
      ]}
    ]
  },
  {
    name: "Polestar",
    models: [
      { name: "Polestar 2", trims: [
        makeTrim("Standard Range Single Motor", "Single-Speed", "Electric"),
        makeTrim("Long Range Single Motor", "Single-Speed", "Electric"),
        makeTrim("Long Range Dual Motor", "Single-Speed", "Electric"),
        makeTrim("BST Edition 270", "Single-Speed", "Electric")
      ]},
      { name: "Polestar 3", trims: [
        makeTrim("Long Range Dual Motor", "Single-Speed", "Electric"),
        makeTrim("Long Range Dual Motor with Performance Pack", "Single-Speed", "Electric")
      ]},
      { name: "Polestar 4", trims: [
        makeTrim("Long Range Single Motor", "Single-Speed", "Electric"),
        makeTrim("Long Range Dual Motor", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Porsche",
    models: [
      { name: "718 Boxster", trims: [
        makeTrim("Base", "6-Speed Manual", "2.0L Turbo Flat-4"),
        makeTrim("S", "7-Speed PDK", "2.5L Turbo Flat-4"),
        makeTrim("GTS 4.0", "6-Speed Manual", "4.0L Flat-6"),
        makeTrim("Spyder", "6-Speed Manual", "4.0L Flat-6")
      ]},
      { name: "718 Cayman", trims: [
        makeTrim("Base", "6-Speed Manual", "2.0L Turbo Flat-4"),
        makeTrim("S", "7-Speed PDK", "2.5L Turbo Flat-4"),
        makeTrim("GTS 4.0", "6-Speed Manual", "4.0L Flat-6"),
        makeTrim("GT4", "6-Speed Manual", "4.0L Flat-6"),
        makeTrim("GT4 RS", "7-Speed PDK", "4.0L Flat-6")
      ]},
      { name: "911", trims: [
        makeTrim("Carrera", "8-Speed PDK", "3.0L Twin-Turbo Flat-6"),
        makeTrim("Carrera S", "8-Speed PDK", "3.0L Twin-Turbo Flat-6"),
        makeTrim("Carrera GTS", "8-Speed PDK", "3.0L Twin-Turbo Flat-6"),
        makeTrim("Carrera 4", "8-Speed PDK", "3.0L Twin-Turbo Flat-6"),
        makeTrim("Carrera 4S", "8-Speed PDK", "3.0L Twin-Turbo Flat-6"),
        makeTrim("Carrera 4 GTS", "8-Speed PDK", "3.0L Twin-Turbo Flat-6"),
        makeTrim("Targa 4", "8-Speed PDK", "3.0L Twin-Turbo Flat-6"),
        makeTrim("Targa 4S", "8-Speed PDK", "3.0L Twin-Turbo Flat-6"),
        makeTrim("Targa 4 GTS", "8-Speed PDK", "3.0L Twin-Turbo Flat-6"),
        makeTrim("Turbo", "8-Speed PDK", "3.7L Twin-Turbo Flat-6"),
        makeTrim("Turbo S", "8-Speed PDK", "3.7L Twin-Turbo Flat-6"),
        makeTrim("GT3", "7-Speed PDK", "4.0L Flat-6"),
        makeTrim("GT3 RS", "7-Speed PDK", "4.0L Flat-6")
      ]},
      { name: "Cayenne", trims: [
        makeTrim("Base", "8-Speed Tiptronic S", "3.0L Turbo V6"),
        makeTrim("S", "8-Speed Tiptronic S", "2.9L Twin-Turbo V6"),
        makeTrim("E-Hybrid", "8-Speed Tiptronic S", "3.0L V6 PHEV"),
        makeTrim("GTS", "8-Speed Tiptronic S", "4.0L Twin-Turbo V8"),
        makeTrim("Turbo GT", "8-Speed Tiptronic S", "4.0L Twin-Turbo V8")
      ]},
      { name: "Macan", trims: [
        makeTrim("Base", "7-Speed PDK", "2.0L Turbo"),
        makeTrim("S", "7-Speed PDK", "2.9L Twin-Turbo V6"),
        makeTrim("GTS", "7-Speed PDK", "2.9L Twin-Turbo V6"),
        makeTrim("Electric", "Single-Speed", "Electric"),
        makeTrim("Electric 4", "Single-Speed", "Electric"),
        makeTrim("Electric 4S", "Single-Speed", "Electric"),
        makeTrim("Electric Turbo", "Single-Speed", "Electric")
      ]},
      { name: "Panamera", trims: [
        makeTrim("Base", "8-Speed PDK", "2.9L Twin-Turbo V6"),
        makeTrim("4", "8-Speed PDK", "2.9L Twin-Turbo V6"),
        makeTrim("4 E-Hybrid", "8-Speed PDK", "2.9L Twin-Turbo V6 PHEV"),
        makeTrim("4S", "8-Speed PDK", "2.9L Twin-Turbo V6"),
        makeTrim("4S E-Hybrid", "8-Speed PDK", "2.9L Twin-Turbo V6 PHEV"),
        makeTrim("GTS", "8-Speed PDK", "4.0L Twin-Turbo V8"),
        makeTrim("Turbo S", "8-Speed PDK", "4.0L Twin-Turbo V8"),
        makeTrim("Turbo S E-Hybrid", "8-Speed PDK", "4.0L Twin-Turbo V8 PHEV")
      ]},
      { name: "Taycan", trims: [
        makeTrim("Base", "2-Speed", "Electric"),
        makeTrim("4S", "2-Speed", "Electric"),
        makeTrim("GTS", "2-Speed", "Electric"),
        makeTrim("Turbo", "2-Speed", "Electric"),
        makeTrim("Turbo S", "2-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Ram",
    models: [
      { name: "1500", trims: [
        makeTrim("Tradesman", "8-Speed Automatic", "3.6L V6"),
        makeTrim("Big Horn", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("Laramie", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("Rebel", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("Limited", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("Limited Longhorn", "8-Speed Automatic", "5.7L HEMI V8"),
        makeTrim("TRX", "8-Speed Automatic", "6.2L Supercharged HEMI V8")
      ]},
      { name: "1500 REV", trims: [
        makeTrim("Tradesman", "Single-Speed", "Electric"),
        makeTrim("Big Horn", "Single-Speed", "Electric"),
        makeTrim("Laramie", "Single-Speed", "Electric"),
        makeTrim("Limited", "Single-Speed", "Electric")
      ]},
      { name: "ProMaster", trims: [
        makeTrim("1500 Low Roof", "9-Speed Automatic", "3.6L V6"),
        makeTrim("2500 High Roof", "9-Speed Automatic", "3.6L V6"),
        makeTrim("3500 High Roof", "9-Speed Automatic", "3.6L V6")
      ]},
      { name: "ProMaster City", trims: [
        makeTrim("Tradesman", "9-Speed Automatic", "2.4L"),
        makeTrim("SLT", "9-Speed Automatic", "2.4L")
      ]}
    ]
  },
  {
    name: "Rivian",
    models: [
      { name: "R1S", trims: [
        makeTrim("Dual-Motor Standard Pack", "Single-Speed", "Electric"),
        makeTrim("Dual-Motor Large Pack", "Single-Speed", "Electric"),
        makeTrim("Dual-Motor Max Pack", "Single-Speed", "Electric"),
        makeTrim("Quad-Motor", "Single-Speed", "Electric")
      ]},
      { name: "R1T", trims: [
        makeTrim("Dual-Motor Standard Pack", "Single-Speed", "Electric"),
        makeTrim("Dual-Motor Large Pack", "Single-Speed", "Electric"),
        makeTrim("Dual-Motor Max Pack", "Single-Speed", "Electric"),
        makeTrim("Quad-Motor", "Single-Speed", "Electric")
      ]},
      { name: "R2", trims: [
        makeTrim("Dual-Motor", "Single-Speed", "Electric"),
        makeTrim("Tri-Motor", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Rolls-Royce",
    models: [
      { name: "Cullinan", trims: [
        makeTrim("Base", "8-Speed Automatic", "6.75L Twin-Turbo V12"),
        makeTrim("Black Badge", "8-Speed Automatic", "6.75L Twin-Turbo V12")
      ]},
      { name: "Ghost", trims: [
        makeTrim("Base", "8-Speed Automatic", "6.75L Twin-Turbo V12"),
        makeTrim("Extended", "8-Speed Automatic", "6.75L Twin-Turbo V12"),
        makeTrim("Black Badge", "8-Speed Automatic", "6.75L Twin-Turbo V12")
      ]},
      { name: "Phantom", trims: [
        makeTrim("Base", "8-Speed Automatic", "6.75L Twin-Turbo V12"),
        makeTrim("Extended", "8-Speed Automatic", "6.75L Twin-Turbo V12")
      ]},
      { name: "Spectre", trims: [
        makeTrim("Base", "Single-Speed", "Electric")
      ]},
      { name: "Wraith", trims: [
        makeTrim("Base", "8-Speed Automatic", "6.6L Twin-Turbo V12"),
        makeTrim("Black Badge", "8-Speed Automatic", "6.6L Twin-Turbo V12")
      ]}
    ]
  },
  {
    name: "Smart",
    models: [
      { name: "#1", trims: [
        makeTrim("Pro", "Single-Speed", "Electric"),
        makeTrim("Pro+", "Single-Speed", "Electric"),
        makeTrim("Premium", "Single-Speed", "Electric"),
        makeTrim("Brabus", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Subaru",
    models: [
      { name: "Ascent", trims: [
        makeTrim("Convenience", "CVT", "2.4L Turbo"),
        makeTrim("Touring", "CVT", "2.4L Turbo"),
        makeTrim("Limited", "CVT", "2.4L Turbo"),
        makeTrim("Premier", "CVT", "2.4L Turbo"),
        makeTrim("Onyx Edition", "CVT", "2.4L Turbo")
      ]},
      { name: "BRZ", trims: [
        makeTrim("Base", "6-Speed Manual", "2.4L Flat-4"),
        makeTrim("Sport-tech", "6-Speed Automatic", "2.4L Flat-4"),
        makeTrim("tS", "6-Speed Manual", "2.4L Flat-4")
      ]},
      { name: "Crosstrek", trims: [
        makeTrim("Convenience", "CVT", "2.0L Flat-4"),
        makeTrim("Touring", "CVT", "2.0L Flat-4"),
        makeTrim("Sport", "CVT", "2.5L Flat-4"),
        makeTrim("Limited", "CVT", "2.5L Flat-4"),
        makeTrim("Outdoor", "CVT", "2.5L Flat-4")
      ]},
      { name: "Forester", trims: [
        makeTrim("Base", "CVT", "2.5L Flat-4"),
        makeTrim("Convenience", "CVT", "2.5L Flat-4"),
        makeTrim("Touring", "CVT", "2.5L Flat-4"),
        makeTrim("Sport", "CVT", "2.5L Flat-4"),
        makeTrim("Limited", "CVT", "2.5L Flat-4"),
        makeTrim("Premier", "CVT", "2.5L Flat-4")
      ]},
      { name: "Impreza", trims: [
        makeTrim("Base", "CVT", "2.0L Flat-4"),
        makeTrim("Convenience", "CVT", "2.0L Flat-4"),
        makeTrim("Touring", "CVT", "2.0L Flat-4"),
        makeTrim("Sport", "CVT", "2.5L Flat-4"),
        makeTrim("Sport-tech", "CVT", "2.5L Flat-4"),
        makeTrim("RS", "CVT", "2.5L Flat-4")
      ]},
      { name: "Legacy", trims: [
        makeTrim("Base", "CVT", "2.5L Flat-4"),
        makeTrim("Touring", "CVT", "2.5L Flat-4"),
        makeTrim("Limited", "CVT", "2.5L Flat-4"),
        makeTrim("Premier", "CVT", "2.4L Turbo Flat-4"),
        makeTrim("Sport GT", "CVT", "2.4L Turbo Flat-4")
      ]},
      { name: "Outback", trims: [
        makeTrim("Base", "CVT", "2.5L Flat-4"),
        makeTrim("Convenience", "CVT", "2.5L Flat-4"),
        makeTrim("Touring", "CVT", "2.5L Flat-4"),
        makeTrim("Limited", "CVT", "2.5L Flat-4"),
        makeTrim("Premier", "CVT", "2.4L Turbo Flat-4"),
        makeTrim("Onyx Edition XT", "CVT", "2.4L Turbo Flat-4"),
        makeTrim("Wilderness", "CVT", "2.4L Turbo Flat-4")
      ]},
      { name: "Solterra", trims: [
        makeTrim("Base", "Single-Speed", "Electric"),
        makeTrim("Touring", "Single-Speed", "Electric"),
        makeTrim("Limited", "Single-Speed", "Electric"),
        makeTrim("Premier", "Single-Speed", "Electric")
      ]},
      { name: "WRX", trims: [
        makeTrim("Base", "6-Speed Manual", "2.4L Turbo Flat-4"),
        makeTrim("Sport", "6-Speed Manual", "2.4L Turbo Flat-4"),
        makeTrim("Sport-tech", "CVT", "2.4L Turbo Flat-4"),
        makeTrim("tS", "6-Speed Manual", "2.4L Turbo Flat-4")
      ]}
    ]
  },
  {
    name: "Tesla",
    models: [
      { name: "Model 3", trims: [
        makeTrim("RWD", "Single-Speed", "Electric"),
        makeTrim("Long Range", "Single-Speed", "Electric"),
        makeTrim("Performance", "Single-Speed", "Electric")
      ]},
      { name: "Model S", trims: [
        makeTrim("Dual Motor All-Wheel Drive", "Single-Speed", "Electric"),
        makeTrim("Plaid", "Single-Speed", "Electric")
      ]},
      { name: "Model X", trims: [
        makeTrim("Dual Motor All-Wheel Drive", "Single-Speed", "Electric"),
        makeTrim("Plaid", "Single-Speed", "Electric")
      ]},
      { name: "Model Y", trims: [
        makeTrim("RWD", "Single-Speed", "Electric"),
        makeTrim("Long Range", "Single-Speed", "Electric"),
        makeTrim("Performance", "Single-Speed", "Electric")
      ]},
      { name: "Cybertruck", trims: [
        makeTrim("RWD", "Single-Speed", "Electric"),
        makeTrim("All-Wheel Drive", "Single-Speed", "Electric"),
        makeTrim("Cyberbeast", "Single-Speed", "Electric")
      ]}
    ]
  },
  {
    name: "Toyota",
    models: [
      { name: "4Runner", trims: [
        makeTrim("SR5", "5-Speed Automatic", "4.0L V6"),
        makeTrim("SR5 Premium", "5-Speed Automatic", "4.0L V6"),
        makeTrim("TRD Sport", "5-Speed Automatic", "4.0L V6"),
        makeTrim("TRD Off-Road", "5-Speed Automatic", "4.0L V6"),
        makeTrim("TRD Off-Road Premium", "5-Speed Automatic", "4.0L V6"),
        makeTrim("Limited", "5-Speed Automatic", "4.0L V6"),
        makeTrim("TRD Pro", "5-Speed Automatic", "4.0L V6")
      ]},
      { name: "bZ4X", trims: [
        makeTrim("XLE", "Single-Speed", "Electric"),
        makeTrim("Limited", "Single-Speed", "Electric")
      ]},
      { name: "Camry", trims: [
        makeTrim("LE", "8-Speed Automatic", "2.5L"),
        makeTrim("SE", "8-Speed Automatic", "2.5L"),
        makeTrim("XLE", "8-Speed Automatic", "2.5L"),
        makeTrim("XSE", "8-Speed Automatic", "2.5L"),
        makeTrim("TRD", "8-Speed Automatic", "3.5L V6")
      ]},
      { name: "Camry Hybrid", trims: [
        makeTrim("LE", "CVT", "2.5L Hybrid"),
        makeTrim("SE", "CVT", "2.5L Hybrid"),
        makeTrim("XLE", "CVT", "2.5L Hybrid"),
        makeTrim("XSE", "CVT", "2.5L Hybrid")
      ]},
      { name: "Corolla", trims: [
        makeTrim("L", "CVT", "1.8L"),
        makeTrim("LE", "CVT", "1.8L"),
        makeTrim("SE", "CVT", "2.0L"),
        makeTrim("XLE", "CVT", "1.8L"),
        makeTrim("XSE", "CVT", "2.0L")
      ]},
      { name: "Corolla Cross", trims: [
        makeTrim("L", "CVT", "2.0L"),
        makeTrim("LE", "CVT", "2.0L"),
        makeTrim("XLE", "CVT", "2.0L")
      ]},
      { name: "Corolla Cross Hybrid", trims: [
        makeTrim("S", "CVT", "2.0L Hybrid"),
        makeTrim("SE", "CVT", "2.0L Hybrid"),
        makeTrim("XSE", "CVT", "2.0L Hybrid")
      ]},
      { name: "Corolla Hatchback", trims: [
        makeTrim("SE", "CVT", "2.0L"),
        makeTrim("XSE", "CVT", "2.0L")
      ]},
      { name: "Crown", trims: [
        makeTrim("XLE", "CVT", "2.5L Hybrid"),
        makeTrim("Limited", "CVT", "2.5L Hybrid"),
        makeTrim("Platinum", "6-Speed Automatic", "2.4L Turbo Hybrid")
      ]},
      { name: "Grand Highlander", trims: [
        makeTrim("XLE", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("Limited", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("Platinum", "8-Speed Automatic", "2.4L Turbo")
      ]},
      { name: "Grand Highlander Hybrid", trims: [
        makeTrim("XLE", "CVT", "2.5L Hybrid"),
        makeTrim("Limited", "CVT", "2.5L Hybrid"),
        makeTrim("Platinum", "6-Speed Automatic", "2.4L Turbo Hybrid")
      ]},
      { name: "GR86", trims: [
        makeTrim("Base", "6-Speed Manual", "2.4L Flat-4"),
        makeTrim("Premium", "6-Speed Automatic", "2.4L Flat-4")
      ]},
      { name: "GR Corolla", trims: [
        makeTrim("Core", "6-Speed Manual", "1.6L Turbo"),
        makeTrim("Circuit Edition", "6-Speed Manual", "1.6L Turbo"),
        makeTrim("Morizo Edition", "6-Speed Manual", "1.6L Turbo")
      ]},
      { name: "GR Supra", trims: [
        makeTrim("2.0", "8-Speed Automatic", "2.0L Turbo"),
        makeTrim("3.0", "8-Speed Automatic", "3.0L Turbo I6"),
        makeTrim("3.0 Premium", "8-Speed Automatic", "3.0L Turbo I6"),
        makeTrim("A91-MT Edition", "6-Speed Manual", "3.0L Turbo I6")
      ]},
      { name: "Highlander", trims: [
        makeTrim("LE", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("XLE", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("Limited", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("Platinum", "8-Speed Automatic", "2.4L Turbo")
      ]},
      { name: "Highlander Hybrid", trims: [
        makeTrim("LE", "CVT", "2.5L Hybrid"),
        makeTrim("XLE", "CVT", "2.5L Hybrid"),
        makeTrim("Limited", "CVT", "2.5L Hybrid"),
        makeTrim("Platinum", "CVT", "2.5L Hybrid")
      ]},
      { name: "Land Cruiser", trims: [
        makeTrim("1958", "8-Speed Automatic", "2.4L Turbo Hybrid"),
        makeTrim("First Edition", "8-Speed Automatic", "2.4L Turbo Hybrid")
      ]},
      { name: "Prius", trims: [
        makeTrim("LE", "CVT", "2.0L Hybrid"),
        makeTrim("XLE", "CVT", "2.0L Hybrid"),
        makeTrim("Limited", "CVT", "2.0L Hybrid")
      ]},
      { name: "Prius Prime", trims: [
        makeTrim("SE", "CVT", "2.0L PHEV"),
        makeTrim("XSE", "CVT", "2.0L PHEV"),
        makeTrim("XSE Premium", "CVT", "2.0L PHEV")
      ]},
      { name: "RAV4", trims: [
        makeTrim("LE", "8-Speed Automatic", "2.5L"),
        makeTrim("XLE", "8-Speed Automatic", "2.5L"),
        makeTrim("XLE Premium", "8-Speed Automatic", "2.5L"),
        makeTrim("Trail", "8-Speed Automatic", "2.5L"),
        makeTrim("Limited", "8-Speed Automatic", "2.5L"),
        makeTrim("TRD Off-Road", "8-Speed Automatic", "2.5L")
      ]},
      { name: "RAV4 Hybrid", trims: [
        makeTrim("LE", "CVT", "2.5L Hybrid"),
        makeTrim("XLE", "CVT", "2.5L Hybrid"),
        makeTrim("XLE Premium", "CVT", "2.5L Hybrid"),
        makeTrim("SE", "CVT", "2.5L Hybrid"),
        makeTrim("Limited", "CVT", "2.5L Hybrid")
      ]},
      { name: "RAV4 Prime", trims: [
        makeTrim("SE", "CVT", "2.5L PHEV"),
        makeTrim("XSE", "CVT", "2.5L PHEV")
      ]},
      { name: "Sequoia", trims: [
        makeTrim("SR5", "10-Speed Automatic", "3.4L Twin-Turbo V6 Hybrid"),
        makeTrim("Limited", "10-Speed Automatic", "3.4L Twin-Turbo V6 Hybrid"),
        makeTrim("Platinum", "10-Speed Automatic", "3.4L Twin-Turbo V6 Hybrid"),
        makeTrim("TRD Pro", "10-Speed Automatic", "3.4L Twin-Turbo V6 Hybrid"),
        makeTrim("Capstone", "10-Speed Automatic", "3.4L Twin-Turbo V6 Hybrid")
      ]},
      { name: "Sienna", trims: [
        makeTrim("LE", "CVT", "2.5L Hybrid"),
        makeTrim("XLE", "CVT", "2.5L Hybrid"),
        makeTrim("XSE", "CVT", "2.5L Hybrid"),
        makeTrim("Woodland Edition", "CVT", "2.5L Hybrid"),
        makeTrim("Limited", "CVT", "2.5L Hybrid"),
        makeTrim("Platinum", "CVT", "2.5L Hybrid")
      ]},
      { name: "Tacoma", trims: [
        makeTrim("SR", "6-Speed Automatic", "2.4L Turbo"),
        makeTrim("SR5", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("TRD Sport", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("TRD Off-Road", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("Limited", "8-Speed Automatic", "2.4L Turbo"),
        makeTrim("Trailhunter", "8-Speed Automatic", "2.4L Turbo Hybrid"),
        makeTrim("TRD Pro", "8-Speed Automatic", "2.4L Turbo Hybrid")
      ]},
      { name: "Tundra", trims: [
        makeTrim("SR", "10-Speed Automatic", "3.4L Twin-Turbo V6"),
        makeTrim("SR5", "10-Speed Automatic", "3.4L Twin-Turbo V6"),
        makeTrim("Limited", "10-Speed Automatic", "3.4L Twin-Turbo V6"),
        makeTrim("Platinum", "10-Speed Automatic", "3.4L Twin-Turbo V6 Hybrid"),
        makeTrim("1794 Edition", "10-Speed Automatic", "3.4L Twin-Turbo V6 Hybrid"),
        makeTrim("TRD Pro", "10-Speed Automatic", "3.4L Twin-Turbo V6 Hybrid"),
        makeTrim("Capstone", "10-Speed Automatic", "3.4L Twin-Turbo V6 Hybrid")
      ]},
      { name: "Venza", trims: [
        makeTrim("LE", "CVT", "2.5L Hybrid"),
        makeTrim("XLE", "CVT", "2.5L Hybrid"),
        makeTrim("Limited", "CVT", "2.5L Hybrid")
      ]}
    ]
  },
  {
    name: "Volkswagen",
    models: [
      { name: "Arteon", trims: [
        makeTrim("SE", "8-Speed Automatic", "2.0L TSI"),
        makeTrim("SEL Premium R-Line", "8-Speed Automatic", "2.0L TSI")
      ]},
      { name: "Atlas", trims: [
        makeTrim("SE", "8-Speed Automatic", "2.0L TSI"),
        makeTrim("SE with Technology", "8-Speed Automatic", "2.0L TSI"),
        makeTrim("SEL", "8-Speed Automatic", "3.6L VR6"),
        makeTrim("SEL Premium R-Line", "8-Speed Automatic", "3.6L VR6")
      ]},
      { name: "Atlas Cross Sport", trims: [
        makeTrim("SE", "8-Speed Automatic", "2.0L TSI"),
        makeTrim("SE with Technology", "8-Speed Automatic", "2.0L TSI"),
        makeTrim("SE with Technology R-Line", "8-Speed Automatic", "2.0L TSI"),
        makeTrim("SEL", "8-Speed Automatic", "3.6L VR6"),
        makeTrim("SEL R-Line", "8-Speed Automatic", "3.6L VR6"),
        makeTrim("SEL Premium R-Line", "8-Speed Automatic", "3.6L VR6")
      ]},
      { name: "Golf GTI", trims: [
        makeTrim("S", "6-Speed Manual", "2.0L TSI"),
        makeTrim("SE", "7-Speed DSG", "2.0L TSI"),
        makeTrim("Autobahn", "7-Speed DSG", "2.0L TSI")
      ]},
      { name: "Golf R", trims: [
        makeTrim("Base", "6-Speed Manual", "2.0L TSI"),
        makeTrim("Base", "7-Speed DSG", "2.0L TSI")
      ]},
      { name: "ID.4", trims: [
        makeTrim("Standard", "Single-Speed", "Electric"),
        makeTrim("Pro S", "Single-Speed", "Electric"),
        makeTrim("Pro S Plus", "Single-Speed", "Electric")
      ]},
      { name: "ID.Buzz", trims: [
        makeTrim("Pro S", "Single-Speed", "Electric"),
        makeTrim("Pro S Plus", "Single-Speed", "Electric")
      ]},
      { name: "Jetta", trims: [
        makeTrim("S", "6-Speed Manual", "1.5L TSI"),
        makeTrim("Sport", "8-Speed Automatic", "1.5L TSI"),
        makeTrim("SE", "8-Speed Automatic", "1.5L TSI"),
        makeTrim("SEL", "8-Speed Automatic", "1.5L TSI")
      ]},
      { name: "Jetta GLI", trims: [
        makeTrim("S", "6-Speed Manual", "2.0L TSI"),
        makeTrim("Autobahn", "7-Speed DSG", "2.0L TSI")
      ]},
      { name: "Taos", trims: [
        makeTrim("S", "8-Speed Automatic", "1.5L TSI"),
        makeTrim("SE", "8-Speed Automatic", "1.5L TSI"),
        makeTrim("SEL", "7-Speed DSG", "1.5L TSI")
      ]},
      { name: "Tiguan", trims: [
        makeTrim("S", "8-Speed Automatic", "2.0L TSI"),
        makeTrim("SE", "8-Speed Automatic", "2.0L TSI"),
        makeTrim("SE R-Line", "8-Speed Automatic", "2.0L TSI"),
        makeTrim("SEL R-Line", "8-Speed Automatic", "2.0L TSI")
      ]}
    ]
  },
  {
    name: "Volvo",
    models: [
      { name: "C40 Recharge", trims: [
        makeTrim("Core", "Single-Speed", "Electric"),
        makeTrim("Plus", "Single-Speed", "Electric"),
        makeTrim("Ultimate", "Single-Speed", "Electric")
      ]},
      { name: "EX30", trims: [
        makeTrim("Core", "Single-Speed", "Electric"),
        makeTrim("Plus", "Single-Speed", "Electric"),
        makeTrim("Ultra", "Single-Speed", "Electric")
      ]},
      { name: "EX90", trims: [
        makeTrim("Core", "Single-Speed", "Electric"),
        makeTrim("Plus", "Single-Speed", "Electric"),
        makeTrim("Ultra", "Single-Speed", "Electric")
      ]},
      { name: "S60", trims: [
        makeTrim("Core", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Plus Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Ultimate Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Polestar Engineered", "8-Speed Geartronic", "2.0L Turbo PHEV")
      ]},
      { name: "S90", trims: [
        makeTrim("Core", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Plus Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Ultimate Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid")
      ]},
      { name: "V60 Cross Country", trims: [
        makeTrim("Core", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Plus Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Ultimate Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid")
      ]},
      { name: "V90 Cross Country", trims: [
        makeTrim("Core", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Plus Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Ultimate Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid")
      ]},
      { name: "XC40", trims: [
        makeTrim("Core", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Plus Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Ultimate Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid")
      ]},
      { name: "XC40 Recharge", trims: [
        makeTrim("Core", "Single-Speed", "Electric"),
        makeTrim("Plus", "Single-Speed", "Electric"),
        makeTrim("Ultimate", "Single-Speed", "Electric")
      ]},
      { name: "XC60", trims: [
        makeTrim("Core", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Plus Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Ultimate Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Polestar Engineered", "8-Speed Geartronic", "2.0L Turbo PHEV")
      ]},
      { name: "XC90", trims: [
        makeTrim("Core", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Plus Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid"),
        makeTrim("Ultimate Dark Theme", "8-Speed Geartronic", "2.0L Turbo Mild Hybrid")
      ]}
    ]
  }
]

// Helper function to get all makes
export function getAllMakes(): string[] {
  return vehicleMakes.map(make => make.name).sort((a, b) => a.localeCompare(b))
}

// Helper function to get models for a specific make
export function getModelsForMake(makeName: string): string[] {
  const make = vehicleMakes.find(m => m.name === makeName)
  return make ? make.models.map(model => model.name).sort((a, b) => a.localeCompare(b)) : []
}

// Helper function to get trims for a specific make and model
export function getTrimsForModel(makeName: string, modelName: string): VehicleTrim[] {
  const make = vehicleMakes.find(m => m.name === makeName)
  if (!make) return []
  
  const model = make.models.find(mod => mod.name === modelName)
  return model ? model.trims : []
}

// Generate years (current year back to 2000)
export function getYears(): number[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i)
}

// Canadian postal code validation regex
export const POSTAL_CODE_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/

// Validate Canadian postal code
export function isValidPostalCode(postalCode: string): boolean {
  return POSTAL_CODE_REGEX.test(postalCode)
}

// Format postal code (uppercase with space)
export function formatPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
  }
  return cleaned
}
