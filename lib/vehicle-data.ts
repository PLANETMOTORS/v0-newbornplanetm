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

// All makes available in Canada (from Canadian Black Book)
export const vehicleMakes: VehicleMake[] = [
  {
    name: "Acura",
    models: [
      { name: "Integra", trims: [
        { name: "Base", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "A-Spec", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "A-Spec Elite", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "Type S", transmission: "6-Speed Manual", engine: "2.0L Turbo" }
      ]},
      { name: "MDX", trims: [
        { name: "Base", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "A-Spec", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Advance", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Type S", transmission: "10-Speed Automatic", engine: "3.0L Turbo V6" },
        { name: "Type S Advance", transmission: "10-Speed Automatic", engine: "3.0L Turbo V6" }
      ]},
      { name: "RDX", trims: [
        { name: "Base", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "A-Spec", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Advance", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Platinum Elite", transmission: "10-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "TLX", trims: [
        { name: "Base", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "A-Spec", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Advance", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Type S", transmission: "10-Speed Automatic", engine: "3.0L Turbo V6" }
      ]},
      { name: "ZDX", trims: [
        { name: "A-Spec", transmission: "Single-Speed", engine: "Electric" },
        { name: "Type S", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Alfa Romeo",
    models: [
      { name: "Giulia", trims: [
        { name: "Sprint", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Ti", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Veloce", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Quadrifoglio", transmission: "8-Speed Automatic", engine: "2.9L Twin-Turbo V6" }
      ]},
      { name: "Stelvio", trims: [
        { name: "Sprint", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Ti", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Veloce", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Quadrifoglio", transmission: "8-Speed Automatic", engine: "2.9L Twin-Turbo V6" }
      ]},
      { name: "Tonale", trims: [
        { name: "Sprint", transmission: "9-Speed Automatic", engine: "1.3L Turbo PHEV" },
        { name: "Ti", transmission: "9-Speed Automatic", engine: "1.3L Turbo PHEV" },
        { name: "Veloce", transmission: "9-Speed Automatic", engine: "1.3L Turbo PHEV" }
      ]}
    ]
  },
  {
    name: "Aston Martin",
    models: [
      { name: "DB11", trims: [
        { name: "V8", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" },
        { name: "V8 Volante", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "DB12", trims: [
        { name: "Coupe", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" },
        { name: "Volante", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "DBX", trims: [
        { name: "Base", transmission: "9-Speed Automatic", engine: "4.0L Twin-Turbo V8" },
        { name: "707", transmission: "9-Speed Automatic", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "Vantage", trims: [
        { name: "Coupe", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" },
        { name: "Roadster", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" }
      ]}
    ]
  },
  {
    name: "Audi",
    models: [
      { name: "A3", trims: [
        { name: "Komfort", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Progressiv", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Technik", transmission: "7-Speed S tronic", engine: "2.0L TFSI" }
      ]},
      { name: "A4", trims: [
        { name: "Komfort", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Progressiv", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Technik", transmission: "7-Speed S tronic", engine: "2.0L TFSI" }
      ]},
      { name: "A5", trims: [
        { name: "Komfort", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Progressiv", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Technik", transmission: "7-Speed S tronic", engine: "2.0L TFSI" }
      ]},
      { name: "A6", trims: [
        { name: "Komfort", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Progressiv", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Technik", transmission: "7-Speed S tronic", engine: "3.0L TFSI" }
      ]},
      { name: "A7", trims: [
        { name: "Progressiv", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Technik", transmission: "7-Speed S tronic", engine: "3.0L TFSI" }
      ]},
      { name: "A8", trims: [
        { name: "Base", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" },
        { name: "L", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" }
      ]},
      { name: "Q3", trims: [
        { name: "Komfort", transmission: "8-Speed Tiptronic", engine: "2.0L TFSI" },
        { name: "Progressiv", transmission: "8-Speed Tiptronic", engine: "2.0L TFSI" },
        { name: "Technik", transmission: "8-Speed Tiptronic", engine: "2.0L TFSI" }
      ]},
      { name: "Q4 e-tron", trims: [
        { name: "Komfort", transmission: "Single-Speed", engine: "Electric" },
        { name: "Progressiv", transmission: "Single-Speed", engine: "Electric" },
        { name: "Technik", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Q5", trims: [
        { name: "Komfort", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Progressiv", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Technik", transmission: "7-Speed S tronic", engine: "2.0L TFSI" }
      ]},
      { name: "Q7", trims: [
        { name: "Komfort", transmission: "8-Speed Tiptronic", engine: "2.0L TFSI" },
        { name: "Progressiv", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" },
        { name: "Technik", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" }
      ]},
      { name: "Q8", trims: [
        { name: "Progressiv", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" },
        { name: "Technik", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" }
      ]},
      { name: "Q8 e-tron", trims: [
        { name: "Progressiv", transmission: "Single-Speed", engine: "Electric" },
        { name: "Technik", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "e-tron GT", trims: [
        { name: "Base", transmission: "2-Speed", engine: "Electric" },
        { name: "RS", transmission: "2-Speed", engine: "Electric" }
      ]},
      { name: "RS 3", trims: [
        { name: "Sedan", transmission: "7-Speed S tronic", engine: "2.5L TFSI" }
      ]},
      { name: "RS 5", trims: [
        { name: "Coupe", transmission: "8-Speed Tiptronic", engine: "2.9L TFSI V6" },
        { name: "Sportback", transmission: "8-Speed Tiptronic", engine: "2.9L TFSI V6" }
      ]},
      { name: "RS 6 Avant", trims: [
        { name: "Base", transmission: "8-Speed Tiptronic", engine: "4.0L TFSI V8" }
      ]},
      { name: "RS 7", trims: [
        { name: "Base", transmission: "8-Speed Tiptronic", engine: "4.0L TFSI V8" }
      ]},
      { name: "RS Q8", trims: [
        { name: "Base", transmission: "8-Speed Tiptronic", engine: "4.0L TFSI V8" }
      ]},
      { name: "S3", trims: [
        { name: "Sedan", transmission: "7-Speed S tronic", engine: "2.0L TFSI" }
      ]},
      { name: "S4", trims: [
        { name: "Sedan", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" }
      ]},
      { name: "S5", trims: [
        { name: "Coupe", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" },
        { name: "Sportback", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" }
      ]},
      { name: "S6", trims: [
        { name: "Sedan", transmission: "8-Speed Tiptronic", engine: "2.9L TFSI V6" }
      ]},
      { name: "S7", trims: [
        { name: "Sportback", transmission: "8-Speed Tiptronic", engine: "2.9L TFSI V6" }
      ]},
      { name: "S8", trims: [
        { name: "Base", transmission: "8-Speed Tiptronic", engine: "4.0L TFSI V8" }
      ]},
      { name: "SQ5", trims: [
        { name: "Base", transmission: "8-Speed Tiptronic", engine: "3.0L TFSI" }
      ]},
      { name: "SQ7", trims: [
        { name: "Base", transmission: "8-Speed Tiptronic", engine: "4.0L TFSI V8" }
      ]},
      { name: "SQ8", trims: [
        { name: "Base", transmission: "8-Speed Tiptronic", engine: "4.0L TFSI V8" }
      ]},
      { name: "TT", trims: [
        { name: "Coupe", transmission: "7-Speed S tronic", engine: "2.0L TFSI" },
        { name: "Roadster", transmission: "7-Speed S tronic", engine: "2.0L TFSI" }
      ]}
    ]
  },
  {
    name: "Bentley",
    models: [
      { name: "Bentayga", trims: [
        { name: "V8", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" },
        { name: "Speed", transmission: "8-Speed Automatic", engine: "6.0L W12" },
        { name: "EWB", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "Continental GT", trims: [
        { name: "V8", transmission: "8-Speed DCT", engine: "4.0L Twin-Turbo V8" },
        { name: "Speed", transmission: "8-Speed DCT", engine: "6.0L W12" },
        { name: "Mulliner", transmission: "8-Speed DCT", engine: "6.0L W12" }
      ]},
      { name: "Flying Spur", trims: [
        { name: "V8", transmission: "8-Speed DCT", engine: "4.0L Twin-Turbo V8" },
        { name: "W12", transmission: "8-Speed DCT", engine: "6.0L W12" },
        { name: "Speed", transmission: "8-Speed DCT", engine: "6.0L W12" }
      ]}
    ]
  },
  {
    name: "BMW",
    models: [
      { name: "2-Series", trims: [
        { name: "228i xDrive Gran Coupe", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "M235i xDrive Gran Coupe", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "230i Coupe", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "M240i xDrive Coupe", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" }
      ]},
      { name: "3-Series", trims: [
        { name: "330i Sedan", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "330i xDrive Sedan", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "330e xDrive Sedan", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo PHEV" },
        { name: "M340i xDrive Sedan", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" }
      ]},
      { name: "4-Series", trims: [
        { name: "430i Coupe", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "430i xDrive Coupe", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "M440i xDrive Coupe", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "430i Gran Coupe", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "M440i xDrive Gran Coupe", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" }
      ]},
      { name: "5-Series", trims: [
        { name: "530i Sedan", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "530i xDrive Sedan", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "540i xDrive Sedan", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "550e xDrive Sedan", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo PHEV" }
      ]},
      { name: "7-Series", trims: [
        { name: "740i", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "740i xDrive", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "760i xDrive", transmission: "8-Speed Steptronic", engine: "4.4L TwinPower Turbo V8" }
      ]},
      { name: "8-Series", trims: [
        { name: "840i Coupe", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "840i xDrive Coupe", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "M850i xDrive Coupe", transmission: "8-Speed Steptronic", engine: "4.4L TwinPower Turbo V8" },
        { name: "840i xDrive Gran Coupe", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "M850i xDrive Gran Coupe", transmission: "8-Speed Steptronic", engine: "4.4L TwinPower Turbo V8" }
      ]},
      { name: "X1", trims: [
        { name: "xDrive28i", transmission: "7-Speed DCT", engine: "2.0L TwinPower Turbo" }
      ]},
      { name: "X2", trims: [
        { name: "xDrive28i", transmission: "7-Speed DCT", engine: "2.0L TwinPower Turbo" },
        { name: "M35i xDrive", transmission: "7-Speed DCT", engine: "2.0L TwinPower Turbo" }
      ]},
      { name: "X3", trims: [
        { name: "xDrive30i", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "M40i", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" }
      ]},
      { name: "X4", trims: [
        { name: "xDrive30i", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "M40i", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" }
      ]},
      { name: "X5", trims: [
        { name: "xDrive40i", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "xDrive50e", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo PHEV" },
        { name: "M60i xDrive", transmission: "8-Speed Steptronic", engine: "4.4L TwinPower Turbo V8" }
      ]},
      { name: "X6", trims: [
        { name: "xDrive40i", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "M60i xDrive", transmission: "8-Speed Steptronic", engine: "4.4L TwinPower Turbo V8" }
      ]},
      { name: "X7", trims: [
        { name: "xDrive40i", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "M60i xDrive", transmission: "8-Speed Steptronic", engine: "4.4L TwinPower Turbo V8" }
      ]},
      { name: "XM", trims: [
        { name: "Base", transmission: "8-Speed Steptronic", engine: "4.4L TwinPower Turbo V8 PHEV" },
        { name: "Label Red", transmission: "8-Speed Steptronic", engine: "4.4L TwinPower Turbo V8 PHEV" }
      ]},
      { name: "Z4", trims: [
        { name: "sDrive30i", transmission: "8-Speed Steptronic", engine: "2.0L TwinPower Turbo" },
        { name: "M40i", transmission: "8-Speed Steptronic", engine: "3.0L TwinPower Turbo" }
      ]},
      { name: "i4", trims: [
        { name: "eDrive35", transmission: "Single-Speed", engine: "Electric" },
        { name: "eDrive40", transmission: "Single-Speed", engine: "Electric" },
        { name: "xDrive40", transmission: "Single-Speed", engine: "Electric" },
        { name: "M50", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "i5", trims: [
        { name: "eDrive40", transmission: "Single-Speed", engine: "Electric" },
        { name: "xDrive40", transmission: "Single-Speed", engine: "Electric" },
        { name: "M60 xDrive", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "i7", trims: [
        { name: "xDrive60", transmission: "Single-Speed", engine: "Electric" },
        { name: "M70 xDrive", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "iX", trims: [
        { name: "xDrive40", transmission: "Single-Speed", engine: "Electric" },
        { name: "xDrive50", transmission: "Single-Speed", engine: "Electric" },
        { name: "M60", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "M2", trims: [
        { name: "Base", transmission: "6-Speed Manual", engine: "3.0L TwinPower Turbo" },
        { name: "Base", transmission: "8-Speed M Steptronic", engine: "3.0L TwinPower Turbo" }
      ]},
      { name: "M3", trims: [
        { name: "Base", transmission: "6-Speed Manual", engine: "3.0L TwinPower Turbo" },
        { name: "Competition", transmission: "8-Speed M Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "Competition xDrive", transmission: "8-Speed M Steptronic", engine: "3.0L TwinPower Turbo" }
      ]},
      { name: "M4", trims: [
        { name: "Competition", transmission: "8-Speed M Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "Competition xDrive", transmission: "8-Speed M Steptronic", engine: "3.0L TwinPower Turbo" },
        { name: "CSL", transmission: "8-Speed M Steptronic", engine: "3.0L TwinPower Turbo" }
      ]},
      { name: "M5", trims: [
        { name: "Base", transmission: "8-Speed M Steptronic", engine: "4.4L TwinPower Turbo V8" },
        { name: "Competition", transmission: "8-Speed M Steptronic", engine: "4.4L TwinPower Turbo V8" },
        { name: "CS", transmission: "8-Speed M Steptronic", engine: "4.4L TwinPower Turbo V8" }
      ]},
      { name: "M8", trims: [
        { name: "Competition Coupe", transmission: "8-Speed M Steptronic", engine: "4.4L TwinPower Turbo V8" },
        { name: "Competition Gran Coupe", transmission: "8-Speed M Steptronic", engine: "4.4L TwinPower Turbo V8" }
      ]}
    ]
  },
  {
    name: "Bugatti",
    models: [
      { name: "Chiron", trims: [
        { name: "Base", transmission: "7-Speed DSG", engine: "8.0L Quad-Turbo W16" },
        { name: "Sport", transmission: "7-Speed DSG", engine: "8.0L Quad-Turbo W16" },
        { name: "Pur Sport", transmission: "7-Speed DSG", engine: "8.0L Quad-Turbo W16" }
      ]}
    ]
  },
  {
    name: "Buick",
    models: [
      { name: "Enclave", trims: [
        { name: "Essence", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "Avenir", transmission: "9-Speed Automatic", engine: "3.6L V6" }
      ]},
      { name: "Encore GX", trims: [
        { name: "Preferred", transmission: "CVT", engine: "1.2L Turbo" },
        { name: "Select", transmission: "9-Speed Automatic", engine: "1.3L Turbo" },
        { name: "Essence", transmission: "9-Speed Automatic", engine: "1.3L Turbo" },
        { name: "Avenir", transmission: "9-Speed Automatic", engine: "1.3L Turbo" }
      ]},
      { name: "Envision", trims: [
        { name: "Preferred", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Essence", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Avenir", transmission: "9-Speed Automatic", engine: "2.0L Turbo" }
      ]}
    ]
  },
  {
    name: "Cadillac",
    models: [
      { name: "CT4", trims: [
        { name: "Luxury", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Premium Luxury", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Sport", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "V-Series", transmission: "10-Speed Automatic", engine: "2.7L Turbo" },
        { name: "CT4-V Blackwing", transmission: "6-Speed Manual", engine: "3.6L Twin-Turbo V6" }
      ]},
      { name: "CT5", trims: [
        { name: "Luxury", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Premium Luxury", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Sport", transmission: "10-Speed Automatic", engine: "2.0L Turbo" },
        { name: "V-Series", transmission: "10-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "CT5-V Blackwing", transmission: "6-Speed Manual", engine: "6.2L Supercharged V8" }
      ]},
      { name: "Escalade", trims: [
        { name: "Luxury", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "Premium Luxury", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "Sport", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "V-Series", transmission: "10-Speed Automatic", engine: "6.2L Supercharged V8" }
      ]},
      { name: "Escalade-V", trims: [
        { name: "Base", transmission: "10-Speed Automatic", engine: "6.2L Supercharged V8" }
      ]},
      { name: "XT4", trims: [
        { name: "Luxury", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Premium Luxury", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Sport", transmission: "9-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "XT5", trims: [
        { name: "Luxury", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Premium Luxury", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Sport", transmission: "9-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "XT6", trims: [
        { name: "Luxury", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "Premium Luxury", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "Sport", transmission: "9-Speed Automatic", engine: "3.6L V6" }
      ]},
      { name: "LYRIQ", trims: [
        { name: "Tech", transmission: "Single-Speed", engine: "Electric" },
        { name: "Luxury", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Chevrolet",
    models: [
      { name: "Blazer", trims: [
        { name: "2LT", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "3LT", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "RS", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "Premier", transmission: "9-Speed Automatic", engine: "3.6L V6" }
      ]},
      { name: "Blazer EV", trims: [
        { name: "1LT", transmission: "Single-Speed", engine: "Electric" },
        { name: "2LT", transmission: "Single-Speed", engine: "Electric" },
        { name: "RS", transmission: "Single-Speed", engine: "Electric" },
        { name: "SS", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Bolt EUV", trims: [
        { name: "1LT", transmission: "Single-Speed", engine: "Electric" },
        { name: "2LT", transmission: "Single-Speed", engine: "Electric" },
        { name: "Premier", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Bolt EV", trims: [
        { name: "1LT", transmission: "Single-Speed", engine: "Electric" },
        { name: "2LT", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Camaro", trims: [
        { name: "1LS", transmission: "6-Speed Manual", engine: "2.0L Turbo" },
        { name: "1LT", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "2LT", transmission: "10-Speed Automatic", engine: "3.6L V6" },
        { name: "1SS", transmission: "6-Speed Manual", engine: "6.2L V8" },
        { name: "2SS", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "ZL1", transmission: "10-Speed Automatic", engine: "6.2L Supercharged V8" }
      ]},
      { name: "Colorado", trims: [
        { name: "WT", transmission: "8-Speed Automatic", engine: "2.7L Turbo" },
        { name: "LT", transmission: "8-Speed Automatic", engine: "2.7L Turbo" },
        { name: "Z71", transmission: "8-Speed Automatic", engine: "2.7L Turbo" },
        { name: "Trail Boss", transmission: "8-Speed Automatic", engine: "2.7L Turbo" },
        { name: "ZR2", transmission: "8-Speed Automatic", engine: "2.7L Turbo" }
      ]},
      { name: "Corvette", trims: [
        { name: "1LT", transmission: "8-Speed DCT", engine: "6.2L V8" },
        { name: "2LT", transmission: "8-Speed DCT", engine: "6.2L V8" },
        { name: "3LT", transmission: "8-Speed DCT", engine: "6.2L V8" },
        { name: "Z06", transmission: "8-Speed DCT", engine: "5.5L V8" },
        { name: "E-Ray", transmission: "8-Speed DCT", engine: "6.2L V8 + Electric" }
      ]},
      { name: "Equinox", trims: [
        { name: "LS", transmission: "6-Speed Automatic", engine: "1.5L Turbo" },
        { name: "LT", transmission: "6-Speed Automatic", engine: "1.5L Turbo" },
        { name: "RS", transmission: "6-Speed Automatic", engine: "1.5L Turbo" },
        { name: "Premier", transmission: "6-Speed Automatic", engine: "1.5L Turbo" }
      ]},
      { name: "Equinox EV", trims: [
        { name: "1LT", transmission: "Single-Speed", engine: "Electric" },
        { name: "2LT", transmission: "Single-Speed", engine: "Electric" },
        { name: "3LT", transmission: "Single-Speed", engine: "Electric" },
        { name: "2RS", transmission: "Single-Speed", engine: "Electric" },
        { name: "3RS", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Malibu", trims: [
        { name: "LS", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "RS", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "LT", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "2LT", transmission: "CVT", engine: "1.5L Turbo" }
      ]},
      { name: "Silverado 1500", trims: [
        { name: "WT", transmission: "8-Speed Automatic", engine: "2.7L Turbo" },
        { name: "Custom", transmission: "8-Speed Automatic", engine: "5.3L V8" },
        { name: "LT", transmission: "8-Speed Automatic", engine: "5.3L V8" },
        { name: "RST", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "LT Trail Boss", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "LTZ", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "High Country", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "ZR2", transmission: "10-Speed Automatic", engine: "6.2L V8" }
      ]},
      { name: "Silverado EV", trims: [
        { name: "WT", transmission: "Single-Speed", engine: "Electric" },
        { name: "RST", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Suburban", trims: [
        { name: "LS", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "LT", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "RST", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "Z71", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "Premier", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "High Country", transmission: "10-Speed Automatic", engine: "6.2L V8" }
      ]},
      { name: "Tahoe", trims: [
        { name: "LS", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "LT", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "RST", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "Z71", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "Premier", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "High Country", transmission: "10-Speed Automatic", engine: "6.2L V8" }
      ]},
      { name: "Trailblazer", trims: [
        { name: "LS", transmission: "CVT", engine: "1.2L Turbo" },
        { name: "LT", transmission: "CVT", engine: "1.2L Turbo" },
        { name: "RS", transmission: "9-Speed Automatic", engine: "1.3L Turbo" },
        { name: "Activ", transmission: "9-Speed Automatic", engine: "1.3L Turbo" }
      ]},
      { name: "Traverse", trims: [
        { name: "LS", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "LT", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "RS", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Z71", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Premier", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "High Country", transmission: "9-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "Trax", trims: [
        { name: "LS", transmission: "6-Speed Automatic", engine: "1.2L Turbo" },
        { name: "LT", transmission: "6-Speed Automatic", engine: "1.2L Turbo" },
        { name: "RS", transmission: "6-Speed Automatic", engine: "1.2L Turbo" },
        { name: "Activ", transmission: "6-Speed Automatic", engine: "1.2L Turbo" }
      ]}
    ]
  },
  {
    name: "Chrysler",
    models: [
      { name: "300", trims: [
        { name: "Touring", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Touring L", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "300S", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "300C", transmission: "8-Speed Automatic", engine: "6.4L HEMI V8" }
      ]},
      { name: "Pacifica", trims: [
        { name: "Touring", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "Touring L", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "Limited", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "Pinnacle", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "Hybrid Touring", transmission: "CVT", engine: "3.6L V6 PHEV" },
        { name: "Hybrid Limited", transmission: "CVT", engine: "3.6L V6 PHEV" },
        { name: "Hybrid Pinnacle", transmission: "CVT", engine: "3.6L V6 PHEV" }
      ]},
      { name: "Grand Caravan", trims: [
        { name: "SXT", transmission: "9-Speed Automatic", engine: "3.6L V6" }
      ]}
    ]
  },
  {
    name: "Dodge",
    models: [
      { name: "Challenger", trims: [
        { name: "SXT", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "GT", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "R/T", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "R/T Scat Pack", transmission: "8-Speed Automatic", engine: "6.4L HEMI V8" },
        { name: "SRT Hellcat", transmission: "8-Speed Automatic", engine: "6.2L Supercharged HEMI V8" }
      ]},
      { name: "Charger", trims: [
        { name: "SXT", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "GT", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "R/T", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "Scat Pack", transmission: "8-Speed Automatic", engine: "6.4L HEMI V8" },
        { name: "SRT Hellcat", transmission: "8-Speed Automatic", engine: "6.2L Supercharged HEMI V8" }
      ]},
      { name: "Durango", trims: [
        { name: "SXT", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "GT", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Citadel", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "R/T", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "SRT 392", transmission: "8-Speed Automatic", engine: "6.4L HEMI V8" },
        { name: "SRT Hellcat", transmission: "8-Speed Automatic", engine: "6.2L Supercharged HEMI V8" }
      ]},
      { name: "Hornet", trims: [
        { name: "GT", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "GT Plus", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "R/T", transmission: "6-Speed Automatic", engine: "1.3L Turbo PHEV" },
        { name: "R/T Plus", transmission: "6-Speed Automatic", engine: "1.3L Turbo PHEV" }
      ]}
    ]
  },
  {
    name: "Ferrari",
    models: [
      { name: "296 GTB", trims: [
        { name: "Base", transmission: "8-Speed DCT", engine: "3.0L Twin-Turbo V6 PHEV" },
        { name: "Assetto Fiorano", transmission: "8-Speed DCT", engine: "3.0L Twin-Turbo V6 PHEV" }
      ]},
      { name: "296 GTS", trims: [
        { name: "Base", transmission: "8-Speed DCT", engine: "3.0L Twin-Turbo V6 PHEV" }
      ]},
      { name: "812 Competizione", trims: [
        { name: "Coupe", transmission: "7-Speed DCT", engine: "6.5L V12" },
        { name: "A", transmission: "7-Speed DCT", engine: "6.5L V12" }
      ]},
      { name: "F8 Tributo", trims: [
        { name: "Base", transmission: "7-Speed DCT", engine: "3.9L Twin-Turbo V8" }
      ]},
      { name: "F8 Spider", trims: [
        { name: "Base", transmission: "7-Speed DCT", engine: "3.9L Twin-Turbo V8" }
      ]},
      { name: "Roma", trims: [
        { name: "Base", transmission: "8-Speed DCT", engine: "3.9L Twin-Turbo V8" }
      ]},
      { name: "SF90 Stradale", trims: [
        { name: "Base", transmission: "8-Speed DCT", engine: "4.0L Twin-Turbo V8 PHEV" },
        { name: "Assetto Fiorano", transmission: "8-Speed DCT", engine: "4.0L Twin-Turbo V8 PHEV" }
      ]},
      { name: "Purosangue", trims: [
        { name: "Base", transmission: "8-Speed DCT", engine: "6.5L V12" }
      ]}
    ]
  },
  {
    name: "Fiat",
    models: [
      { name: "500e", trims: [
        { name: "Hatchback", transmission: "Single-Speed", engine: "Electric" },
        { name: "Cabrio", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Ford",
    models: [
      { name: "Bronco", trims: [
        { name: "Base", transmission: "7-Speed Manual", engine: "2.3L EcoBoost" },
        { name: "Big Bend", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "Black Diamond", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "Outer Banks", transmission: "10-Speed Automatic", engine: "2.7L EcoBoost V6" },
        { name: "Badlands", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "Wildtrak", transmission: "10-Speed Automatic", engine: "2.7L EcoBoost V6" },
        { name: "Raptor", transmission: "10-Speed Automatic", engine: "3.0L EcoBoost V6" }
      ]},
      { name: "Bronco Sport", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "1.5L EcoBoost" },
        { name: "Big Bend", transmission: "8-Speed Automatic", engine: "1.5L EcoBoost" },
        { name: "Outer Banks", transmission: "8-Speed Automatic", engine: "1.5L EcoBoost" },
        { name: "Badlands", transmission: "8-Speed Automatic", engine: "2.0L EcoBoost" },
        { name: "Heritage", transmission: "8-Speed Automatic", engine: "2.0L EcoBoost" }
      ]},
      { name: "Edge", trims: [
        { name: "SE", transmission: "8-Speed Automatic", engine: "2.0L EcoBoost" },
        { name: "SEL", transmission: "8-Speed Automatic", engine: "2.0L EcoBoost" },
        { name: "ST-Line", transmission: "8-Speed Automatic", engine: "2.0L EcoBoost" },
        { name: "Titanium", transmission: "8-Speed Automatic", engine: "2.0L EcoBoost" },
        { name: "ST", transmission: "8-Speed Automatic", engine: "2.7L EcoBoost V6" }
      ]},
      { name: "Escape", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "1.5L EcoBoost" },
        { name: "Active", transmission: "8-Speed Automatic", engine: "1.5L EcoBoost" },
        { name: "ST-Line", transmission: "8-Speed Automatic", engine: "1.5L EcoBoost" },
        { name: "Platinum", transmission: "8-Speed Automatic", engine: "2.0L EcoBoost" },
        { name: "PHEV", transmission: "CVT", engine: "2.5L Atkinson PHEV" }
      ]},
      { name: "Expedition", trims: [
        { name: "XL STX", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "XLT", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "Limited", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "King Ranch", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "Platinum", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "Timberline", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" }
      ]},
      { name: "Explorer", trims: [
        { name: "Base", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "XLT", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "ST-Line", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "Limited", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "Timberline", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "ST", transmission: "10-Speed Automatic", engine: "3.0L EcoBoost V6" },
        { name: "Platinum", transmission: "10-Speed Automatic", engine: "3.0L EcoBoost V6" }
      ]},
      { name: "F-150", trims: [
        { name: "XL", transmission: "10-Speed Automatic", engine: "3.3L V6" },
        { name: "XLT", transmission: "10-Speed Automatic", engine: "2.7L EcoBoost V6" },
        { name: "Lariat", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "King Ranch", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "Platinum", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "Limited", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "Tremor", transmission: "10-Speed Automatic", engine: "3.5L EcoBoost V6" },
        { name: "Raptor", transmission: "10-Speed Automatic", engine: "3.5L High Output EcoBoost V6" },
        { name: "Raptor R", transmission: "10-Speed Automatic", engine: "5.2L Supercharged V8" }
      ]},
      { name: "F-150 Lightning", trims: [
        { name: "Pro", transmission: "Single-Speed", engine: "Electric" },
        { name: "XLT", transmission: "Single-Speed", engine: "Electric" },
        { name: "Lariat", transmission: "Single-Speed", engine: "Electric" },
        { name: "Platinum", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Maverick", trims: [
        { name: "XL", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "XLT", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Lariat", transmission: "8-Speed Automatic", engine: "2.0L EcoBoost" },
        { name: "Tremor", transmission: "8-Speed Automatic", engine: "2.0L EcoBoost" }
      ]},
      { name: "Mustang", trims: [
        { name: "EcoBoost", transmission: "6-Speed Manual", engine: "2.3L EcoBoost" },
        { name: "EcoBoost Premium", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "GT", transmission: "6-Speed Manual", engine: "5.0L Coyote V8" },
        { name: "GT Premium", transmission: "10-Speed Automatic", engine: "5.0L Coyote V8" },
        { name: "Dark Horse", transmission: "6-Speed Manual", engine: "5.0L Coyote V8" }
      ]},
      { name: "Mustang Mach-E", trims: [
        { name: "Select", transmission: "Single-Speed", engine: "Electric" },
        { name: "Premium", transmission: "Single-Speed", engine: "Electric" },
        { name: "California Route 1", transmission: "Single-Speed", engine: "Electric" },
        { name: "GT", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Ranger", trims: [
        { name: "XL", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "XLT", transmission: "10-Speed Automatic", engine: "2.3L EcoBoost" },
        { name: "Lariat", transmission: "10-Speed Automatic", engine: "2.7L EcoBoost V6" },
        { name: "Tremor", transmission: "10-Speed Automatic", engine: "2.7L EcoBoost V6" },
        { name: "Raptor", transmission: "10-Speed Automatic", engine: "3.0L EcoBoost V6" }
      ]}
    ]
  },
  {
    name: "Genesis",
    models: [
      { name: "G70", trims: [
        { name: "2.0T", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "2.0T Sport", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "3.3T", transmission: "8-Speed Automatic", engine: "3.3L Twin-Turbo V6" },
        { name: "3.3T Sport", transmission: "8-Speed Automatic", engine: "3.3L Twin-Turbo V6" }
      ]},
      { name: "G80", trims: [
        { name: "2.5T", transmission: "8-Speed Automatic", engine: "2.5L Turbo" },
        { name: "2.5T Advanced", transmission: "8-Speed Automatic", engine: "2.5L Turbo" },
        { name: "3.5T Sport", transmission: "8-Speed Automatic", engine: "3.5L Twin-Turbo V6" },
        { name: "Electrified G80", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "G90", trims: [
        { name: "3.5T", transmission: "8-Speed Automatic", engine: "3.5L Twin-Turbo V6" },
        { name: "3.5T E-Supercharger", transmission: "8-Speed Automatic", engine: "3.5L Twin-Turbo V6 Mild Hybrid" }
      ]},
      { name: "GV60", trims: [
        { name: "Advanced", transmission: "Single-Speed", engine: "Electric" },
        { name: "Performance", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "GV70", trims: [
        { name: "2.5T", transmission: "8-Speed Automatic", engine: "2.5L Turbo" },
        { name: "2.5T Advanced", transmission: "8-Speed Automatic", engine: "2.5L Turbo" },
        { name: "3.5T Sport", transmission: "8-Speed Automatic", engine: "3.5L Twin-Turbo V6" },
        { name: "Electrified GV70", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "GV80", trims: [
        { name: "2.5T", transmission: "8-Speed Automatic", engine: "2.5L Turbo" },
        { name: "2.5T Advanced", transmission: "8-Speed Automatic", engine: "2.5L Turbo" },
        { name: "3.5T", transmission: "8-Speed Automatic", engine: "3.5L Twin-Turbo V6" },
        { name: "3.5T Advanced+", transmission: "8-Speed Automatic", engine: "3.5L Twin-Turbo V6" }
      ]}
    ]
  },
  {
    name: "GMC",
    models: [
      { name: "Acadia", trims: [
        { name: "SLE", transmission: "9-Speed Automatic", engine: "2.5L" },
        { name: "AT4", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "Denali", transmission: "9-Speed Automatic", engine: "3.6L V6" }
      ]},
      { name: "Canyon", trims: [
        { name: "Elevation", transmission: "8-Speed Automatic", engine: "2.7L Turbo" },
        { name: "AT4", transmission: "8-Speed Automatic", engine: "2.7L Turbo" },
        { name: "AT4X", transmission: "8-Speed Automatic", engine: "2.7L Turbo" },
        { name: "Denali", transmission: "8-Speed Automatic", engine: "2.7L Turbo" }
      ]},
      { name: "Hummer EV Pickup", trims: [
        { name: "EV2", transmission: "Single-Speed", engine: "Electric" },
        { name: "EV2X", transmission: "Single-Speed", engine: "Electric" },
        { name: "EV3X", transmission: "Single-Speed", engine: "Electric" },
        { name: "Edition 1", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Hummer EV SUV", trims: [
        { name: "EV2", transmission: "Single-Speed", engine: "Electric" },
        { name: "EV2X", transmission: "Single-Speed", engine: "Electric" },
        { name: "EV3X", transmission: "Single-Speed", engine: "Electric" },
        { name: "Edition 1", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Sierra 1500", trims: [
        { name: "Pro", transmission: "8-Speed Automatic", engine: "2.7L Turbo" },
        { name: "SLE", transmission: "8-Speed Automatic", engine: "5.3L V8" },
        { name: "Elevation", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "SLT", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "AT4", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "AT4X", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "Denali", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "Denali Ultimate", transmission: "10-Speed Automatic", engine: "6.2L V8" }
      ]},
      { name: "Sierra EV", trims: [
        { name: "Elevation", transmission: "Single-Speed", engine: "Electric" },
        { name: "AT4", transmission: "Single-Speed", engine: "Electric" },
        { name: "Denali Edition 1", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Terrain", trims: [
        { name: "SLE", transmission: "9-Speed Automatic", engine: "1.5L Turbo" },
        { name: "AT4", transmission: "9-Speed Automatic", engine: "1.5L Turbo" },
        { name: "Denali", transmission: "9-Speed Automatic", engine: "1.5L Turbo" }
      ]},
      { name: "Yukon", trims: [
        { name: "SLE", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "SLT", transmission: "10-Speed Automatic", engine: "5.3L V8" },
        { name: "AT4", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "Denali", transmission: "10-Speed Automatic", engine: "6.2L V8" },
        { name: "Denali Ultimate", transmission: "10-Speed Automatic", engine: "6.2L V8" }
      ]}
    ]
  },
  {
    name: "Honda",
    models: [
      { name: "Accord", trims: [
        { name: "LX", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "EX", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "Sport", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "EX-L", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "Sport-L", transmission: "CVT", engine: "2.0L Turbo" },
        { name: "Touring", transmission: "10-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "Accord Hybrid", trims: [
        { name: "Sport", transmission: "e-CVT", engine: "2.0L Hybrid" },
        { name: "Sport-L", transmission: "e-CVT", engine: "2.0L Hybrid" },
        { name: "Touring", transmission: "e-CVT", engine: "2.0L Hybrid" }
      ]},
      { name: "Civic", trims: [
        { name: "LX", transmission: "CVT", engine: "2.0L" },
        { name: "Sport", transmission: "CVT", engine: "2.0L" },
        { name: "EX", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "Touring", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "Si", transmission: "6-Speed Manual", engine: "1.5L Turbo" },
        { name: "Type R", transmission: "6-Speed Manual", engine: "2.0L Turbo" }
      ]},
      { name: "Civic Hatchback", trims: [
        { name: "LX", transmission: "CVT", engine: "2.0L" },
        { name: "Sport", transmission: "CVT", engine: "2.0L" },
        { name: "EX-L", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "Sport Touring", transmission: "CVT", engine: "1.5L Turbo" }
      ]},
      { name: "CR-V", trims: [
        { name: "LX", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "EX", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "EX-L", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "Sport", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "Sport Touring", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "Touring", transmission: "CVT", engine: "1.5L Turbo" }
      ]},
      { name: "CR-V Hybrid", trims: [
        { name: "Sport", transmission: "e-CVT", engine: "2.0L Hybrid" },
        { name: "Sport-L", transmission: "e-CVT", engine: "2.0L Hybrid" },
        { name: "Sport Touring", transmission: "e-CVT", engine: "2.0L Hybrid" }
      ]},
      { name: "HR-V", trims: [
        { name: "LX", transmission: "CVT", engine: "2.0L" },
        { name: "Sport", transmission: "CVT", engine: "2.0L" },
        { name: "EX-L", transmission: "CVT", engine: "2.0L" }
      ]},
      { name: "Odyssey", trims: [
        { name: "LX", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "EX", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "EX-L", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Sport", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Touring", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Elite", transmission: "10-Speed Automatic", engine: "3.5L V6" }
      ]},
      { name: "Passport", trims: [
        { name: "Sport", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "EX-L", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "TrailSport", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Touring", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Elite", transmission: "10-Speed Automatic", engine: "3.5L V6" }
      ]},
      { name: "Pilot", trims: [
        { name: "LX", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Sport", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "EX-L", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "TrailSport", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Touring", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Elite", transmission: "10-Speed Automatic", engine: "3.5L V6" },
        { name: "Black Edition", transmission: "10-Speed Automatic", engine: "3.5L V6" }
      ]},
      { name: "Prologue", trims: [
        { name: "EX", transmission: "Single-Speed", engine: "Electric" },
        { name: "Touring", transmission: "Single-Speed", engine: "Electric" },
        { name: "Elite", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Ridgeline", trims: [
        { name: "Sport", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "RTL", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "RTL-E", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "TrailSport", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "Black Edition", transmission: "9-Speed Automatic", engine: "3.5L V6" }
      ]}
    ]
  },
  {
    name: "Hyundai",
    models: [
      { name: "Elantra", trims: [
        { name: "Essential", transmission: "CVT", engine: "2.0L" },
        { name: "Preferred", transmission: "CVT", engine: "2.0L" },
        { name: "Luxury", transmission: "CVT", engine: "2.0L" },
        { name: "N Line", transmission: "7-Speed DCT", engine: "1.6L Turbo" },
        { name: "N", transmission: "6-Speed Manual", engine: "2.0L Turbo" }
      ]},
      { name: "Elantra Hybrid", trims: [
        { name: "Essential", transmission: "6-Speed DCT", engine: "1.6L Hybrid" },
        { name: "Preferred", transmission: "6-Speed DCT", engine: "1.6L Hybrid" },
        { name: "Luxury", transmission: "6-Speed DCT", engine: "1.6L Hybrid" }
      ]},
      { name: "IONIQ 5", trims: [
        { name: "Essential", transmission: "Single-Speed", engine: "Electric" },
        { name: "Preferred", transmission: "Single-Speed", engine: "Electric" },
        { name: "Preferred Long Range", transmission: "Single-Speed", engine: "Electric" },
        { name: "Ultimate", transmission: "Single-Speed", engine: "Electric" },
        { name: "N", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "IONIQ 6", trims: [
        { name: "Essential", transmission: "Single-Speed", engine: "Electric" },
        { name: "Preferred", transmission: "Single-Speed", engine: "Electric" },
        { name: "Ultimate", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Kona", trims: [
        { name: "Essential", transmission: "CVT", engine: "2.0L" },
        { name: "Preferred", transmission: "CVT", engine: "2.0L" },
        { name: "Preferred Trend", transmission: "CVT", engine: "2.0L" },
        { name: "N Line", transmission: "7-Speed DCT", engine: "1.6L Turbo" },
        { name: "Ultimate", transmission: "CVT", engine: "2.0L" },
        { name: "N", transmission: "8-Speed DCT", engine: "2.0L Turbo" }
      ]},
      { name: "Kona Electric", trims: [
        { name: "Essential", transmission: "Single-Speed", engine: "Electric" },
        { name: "Preferred", transmission: "Single-Speed", engine: "Electric" },
        { name: "Ultimate", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Palisade", trims: [
        { name: "Essential", transmission: "8-Speed Automatic", engine: "3.8L V6" },
        { name: "Preferred", transmission: "8-Speed Automatic", engine: "3.8L V6" },
        { name: "Luxury", transmission: "8-Speed Automatic", engine: "3.8L V6" },
        { name: "Ultimate Calligraphy", transmission: "8-Speed Automatic", engine: "3.8L V6" }
      ]},
      { name: "Santa Cruz", trims: [
        { name: "Essential", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Preferred", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Preferred Trend", transmission: "8-Speed DCT", engine: "2.5L Turbo" },
        { name: "Ultimate", transmission: "8-Speed DCT", engine: "2.5L Turbo" }
      ]},
      { name: "Santa Fe", trims: [
        { name: "Essential", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Preferred", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Preferred Trend", transmission: "8-Speed DCT", engine: "2.5L Turbo" },
        { name: "Calligraphy", transmission: "8-Speed DCT", engine: "2.5L Turbo" },
        { name: "Ultimate Calligraphy", transmission: "8-Speed DCT", engine: "2.5L Turbo" }
      ]},
      { name: "Santa Fe Hybrid", trims: [
        { name: "Preferred", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" },
        { name: "Luxury", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" },
        { name: "Ultimate Calligraphy", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" }
      ]},
      { name: "Sonata", trims: [
        { name: "Essential", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Preferred", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Luxury", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "N Line", transmission: "8-Speed DCT", engine: "2.5L Turbo" }
      ]},
      { name: "Tucson", trims: [
        { name: "Essential", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Preferred", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Preferred Trend", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "N Line", transmission: "8-Speed DCT", engine: "2.5L Turbo" },
        { name: "Ultimate", transmission: "8-Speed Automatic", engine: "2.5L" }
      ]},
      { name: "Tucson Hybrid", trims: [
        { name: "Preferred", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" },
        { name: "Luxury", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" },
        { name: "Ultimate", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" }
      ]},
      { name: "Venue", trims: [
        { name: "Essential", transmission: "CVT", engine: "1.6L" },
        { name: "Preferred", transmission: "CVT", engine: "1.6L" },
        { name: "Ultimate", transmission: "CVT", engine: "1.6L" }
      ]}
    ]
  },
  {
    name: "INEOS",
    models: [
      { name: "Grenadier", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6" },
        { name: "Trialmaster Edition", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6" },
        { name: "Fieldmaster Edition", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6" }
      ]}
    ]
  },
  {
    name: "Infiniti",
    models: [
      { name: "Q50", trims: [
        { name: "Pure", transmission: "7-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Luxe", transmission: "7-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Sensory", transmission: "7-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Red Sport 400", transmission: "7-Speed Automatic", engine: "3.0L Twin-Turbo V6" }
      ]},
      { name: "QX50", trims: [
        { name: "Pure", transmission: "CVT", engine: "2.0L VC-Turbo" },
        { name: "Luxe", transmission: "CVT", engine: "2.0L VC-Turbo" },
        { name: "Essential", transmission: "CVT", engine: "2.0L VC-Turbo" },
        { name: "Sensory", transmission: "CVT", engine: "2.0L VC-Turbo" },
        { name: "Autograph", transmission: "CVT", engine: "2.0L VC-Turbo" }
      ]},
      { name: "QX55", trims: [
        { name: "Luxe", transmission: "CVT", engine: "2.0L VC-Turbo" },
        { name: "Essential", transmission: "CVT", engine: "2.0L VC-Turbo" },
        { name: "Sensory", transmission: "CVT", engine: "2.0L VC-Turbo" }
      ]},
      { name: "QX60", trims: [
        { name: "Pure", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "Luxe", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "Sensory", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "Autograph", transmission: "9-Speed Automatic", engine: "3.5L V6" }
      ]},
      { name: "QX80", trims: [
        { name: "Luxe", transmission: "7-Speed Automatic", engine: "5.6L V8" },
        { name: "Sensory", transmission: "7-Speed Automatic", engine: "5.6L V8" },
        { name: "Autograph", transmission: "7-Speed Automatic", engine: "5.6L V8" }
      ]}
    ]
  },
  {
    name: "Jaguar",
    models: [
      { name: "E-PACE", trims: [
        { name: "P250", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "P250 S", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "P250 SE", transmission: "9-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "F-PACE", trims: [
        { name: "P250", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "P250 S", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "P340 S", transmission: "8-Speed Automatic", engine: "3.0L Inline-6" },
        { name: "P400 R-Dynamic S", transmission: "8-Speed Automatic", engine: "3.0L Inline-6 MHEV" },
        { name: "SVR", transmission: "8-Speed Automatic", engine: "5.0L Supercharged V8" }
      ]},
      { name: "F-TYPE", trims: [
        { name: "P300", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "P380", transmission: "8-Speed Automatic", engine: "3.0L Supercharged V6" },
        { name: "P450", transmission: "8-Speed Automatic", engine: "5.0L Supercharged V8" },
        { name: "P575 R", transmission: "8-Speed Automatic", engine: "5.0L Supercharged V8" }
      ]},
      { name: "I-PACE", trims: [
        { name: "S", transmission: "Single-Speed", engine: "Electric" },
        { name: "SE", transmission: "Single-Speed", engine: "Electric" },
        { name: "HSE", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Jeep",
    models: [
      { name: "Compass", trims: [
        { name: "Sport", transmission: "8-Speed Automatic", engine: "2.4L" },
        { name: "North", transmission: "8-Speed Automatic", engine: "2.4L" },
        { name: "Altitude", transmission: "8-Speed Automatic", engine: "2.4L" },
        { name: "Limited", transmission: "8-Speed Automatic", engine: "2.4L" },
        { name: "Trailhawk", transmission: "9-Speed Automatic", engine: "2.4L" }
      ]},
      { name: "Gladiator", trims: [
        { name: "Sport S", transmission: "6-Speed Manual", engine: "3.6L V6" },
        { name: "Willys", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Rubicon", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Mojave", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "High Altitude", transmission: "8-Speed Automatic", engine: "3.6L V6" }
      ]},
      { name: "Grand Cherokee", trims: [
        { name: "Laredo", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Altitude", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Limited", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Overland", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "Trailhawk", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "Summit", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "Summit Reserve", transmission: "8-Speed Automatic", engine: "6.4L HEMI V8" }
      ]},
      { name: "Grand Cherokee 4xe", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "2.0L Turbo PHEV" },
        { name: "Trailhawk", transmission: "8-Speed Automatic", engine: "2.0L Turbo PHEV" },
        { name: "Summit", transmission: "8-Speed Automatic", engine: "2.0L Turbo PHEV" },
        { name: "Summit Reserve", transmission: "8-Speed Automatic", engine: "2.0L Turbo PHEV" }
      ]},
      { name: "Grand Wagoneer", trims: [
        { name: "Series I", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo I6" },
        { name: "Series II", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo I6" },
        { name: "Series III", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo I6" },
        { name: "Obsidian", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo I6" }
      ]},
      { name: "Wagoneer", trims: [
        { name: "Series I", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo I6" },
        { name: "Series II", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo I6" },
        { name: "Series III", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo I6" },
        { name: "Carbide", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo I6" }
      ]},
      { name: "Wrangler", trims: [
        { name: "Sport", transmission: "6-Speed Manual", engine: "3.6L V6" },
        { name: "Sport S", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Willys", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Sahara", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Rubicon", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Rubicon 392", transmission: "8-Speed Automatic", engine: "6.4L HEMI V8" }
      ]},
      { name: "Wrangler 4xe", trims: [
        { name: "Sahara", transmission: "8-Speed Automatic", engine: "2.0L Turbo PHEV" },
        { name: "Rubicon", transmission: "8-Speed Automatic", engine: "2.0L Turbo PHEV" },
        { name: "High Altitude", transmission: "8-Speed Automatic", engine: "2.0L Turbo PHEV" }
      ]}
    ]
  },
  {
    name: "Kia",
    models: [
      { name: "Carnival", trims: [
        { name: "LX", transmission: "8-Speed Automatic", engine: "3.5L V6" },
        { name: "LX+", transmission: "8-Speed Automatic", engine: "3.5L V6" },
        { name: "EX", transmission: "8-Speed Automatic", engine: "3.5L V6" },
        { name: "EX+", transmission: "8-Speed Automatic", engine: "3.5L V6" },
        { name: "SX", transmission: "8-Speed Automatic", engine: "3.5L V6" }
      ]},
      { name: "EV6", trims: [
        { name: "Standard Range RWD", transmission: "Single-Speed", engine: "Electric" },
        { name: "Long Range RWD", transmission: "Single-Speed", engine: "Electric" },
        { name: "Long Range AWD", transmission: "Single-Speed", engine: "Electric" },
        { name: "GT-Line", transmission: "Single-Speed", engine: "Electric" },
        { name: "GT", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "EV9", trims: [
        { name: "Light Long Range RWD", transmission: "Single-Speed", engine: "Electric" },
        { name: "Wind Long Range AWD", transmission: "Single-Speed", engine: "Electric" },
        { name: "Land Long Range AWD", transmission: "Single-Speed", engine: "Electric" },
        { name: "GT-Line", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Forte", trims: [
        { name: "LX", transmission: "CVT", engine: "2.0L" },
        { name: "EX", transmission: "CVT", engine: "2.0L" },
        { name: "GT-Line", transmission: "CVT", engine: "2.0L" },
        { name: "GT", transmission: "7-Speed DCT", engine: "1.6L Turbo" }
      ]},
      { name: "K5", trims: [
        { name: "LX", transmission: "8-Speed Automatic", engine: "1.6L Turbo" },
        { name: "LXS", transmission: "8-Speed Automatic", engine: "1.6L Turbo" },
        { name: "GT-Line", transmission: "8-Speed Automatic", engine: "1.6L Turbo" },
        { name: "EX", transmission: "8-Speed Automatic", engine: "1.6L Turbo" },
        { name: "GT", transmission: "8-Speed DCT", engine: "2.5L Turbo" }
      ]},
      { name: "Niro", trims: [
        { name: "LX", transmission: "6-Speed DCT", engine: "1.6L Hybrid" },
        { name: "EX", transmission: "6-Speed DCT", engine: "1.6L Hybrid" },
        { name: "EX Premium", transmission: "6-Speed DCT", engine: "1.6L Hybrid" },
        { name: "SX Touring", transmission: "6-Speed DCT", engine: "1.6L Hybrid" }
      ]},
      { name: "Niro EV", trims: [
        { name: "Wind", transmission: "Single-Speed", engine: "Electric" },
        { name: "Wave", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Seltos", trims: [
        { name: "LX", transmission: "CVT", engine: "2.0L" },
        { name: "EX", transmission: "CVT", engine: "2.0L" },
        { name: "EX Premium", transmission: "8-Speed Automatic", engine: "1.6L Turbo" },
        { name: "SX Turbo", transmission: "7-Speed DCT", engine: "1.6L Turbo" }
      ]},
      { name: "Sorento", trims: [
        { name: "LX", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "LX+", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "EX", transmission: "8-Speed DCT", engine: "2.5L Turbo" },
        { name: "EX+", transmission: "8-Speed DCT", engine: "2.5L Turbo" },
        { name: "SX", transmission: "8-Speed DCT", engine: "2.5L Turbo" },
        { name: "X-Line", transmission: "8-Speed DCT", engine: "2.5L Turbo" }
      ]},
      { name: "Sorento Hybrid", trims: [
        { name: "LX+", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" },
        { name: "EX+", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" },
        { name: "SX", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" }
      ]},
      { name: "Soul", trims: [
        { name: "LX", transmission: "CVT", engine: "2.0L" },
        { name: "EX", transmission: "CVT", engine: "2.0L" },
        { name: "GT-Line", transmission: "7-Speed DCT", engine: "1.6L Turbo" }
      ]},
      { name: "Sportage", trims: [
        { name: "LX", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "EX", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "EX Premium", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "X-Line", transmission: "8-Speed DCT", engine: "2.5L Turbo" },
        { name: "SX", transmission: "8-Speed DCT", engine: "2.5L Turbo" }
      ]},
      { name: "Sportage Hybrid", trims: [
        { name: "LX", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" },
        { name: "EX", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" },
        { name: "EX Premium", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" },
        { name: "SX", transmission: "6-Speed Automatic", engine: "1.6L Turbo Hybrid" }
      ]},
      { name: "Stinger", trims: [
        { name: "GT-Line", transmission: "8-Speed Automatic", engine: "2.5L Turbo" },
        { name: "GT Elite", transmission: "8-Speed Automatic", engine: "3.3L Twin-Turbo V6" }
      ]},
      { name: "Telluride", trims: [
        { name: "LX", transmission: "8-Speed Automatic", engine: "3.8L V6" },
        { name: "EX", transmission: "8-Speed Automatic", engine: "3.8L V6" },
        { name: "SX", transmission: "8-Speed Automatic", engine: "3.8L V6" },
        { name: "X-Line", transmission: "8-Speed Automatic", engine: "3.8L V6" },
        { name: "X-Pro", transmission: "8-Speed Automatic", engine: "3.8L V6" }
      ]}
    ]
  },
  {
    name: "Lamborghini",
    models: [
      { name: "Huracán", trims: [
        { name: "EVO Coupe", transmission: "7-Speed DCT", engine: "5.2L V10" },
        { name: "EVO Spyder", transmission: "7-Speed DCT", engine: "5.2L V10" },
        { name: "Tecnica", transmission: "7-Speed DCT", engine: "5.2L V10" },
        { name: "STO", transmission: "7-Speed DCT", engine: "5.2L V10" },
        { name: "Sterrato", transmission: "7-Speed DCT", engine: "5.2L V10" }
      ]},
      { name: "Revuelto", trims: [
        { name: "Base", transmission: "8-Speed DCT", engine: "6.5L V12 PHEV" }
      ]},
      { name: "Urus", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" },
        { name: "S", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" },
        { name: "Performante", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8" },
        { name: "SE", transmission: "8-Speed Automatic", engine: "4.0L Twin-Turbo V8 PHEV" }
      ]}
    ]
  },
  {
    name: "Land Rover",
    models: [
      { name: "Defender", trims: [
        { name: "90 S", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "90 SE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "90 X-Dynamic HSE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "90 V8", transmission: "8-Speed Automatic", engine: "5.0L Supercharged V8" },
        { name: "110 S", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "110 SE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "110 X", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "130 SE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" }
      ]},
      { name: "Discovery", trims: [
        { name: "S", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "SE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "Dynamic SE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "HSE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "Metropolitan Edition", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" }
      ]},
      { name: "Discovery Sport", trims: [
        { name: "S", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "SE", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Dynamic SE", transmission: "9-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "Range Rover", trims: [
        { name: "SE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "HSE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "Autobiography", transmission: "8-Speed Automatic", engine: "4.4L Twin-Turbo V8" },
        { name: "SV", transmission: "8-Speed Automatic", engine: "4.4L Twin-Turbo V8" },
        { name: "First Edition", transmission: "8-Speed Automatic", engine: "4.4L Twin-Turbo V8" }
      ]},
      { name: "Range Rover Evoque", trims: [
        { name: "S", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "SE", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Dynamic SE", transmission: "9-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Autobiography", transmission: "9-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "Range Rover Sport", trims: [
        { name: "SE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "Dynamic SE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "Autobiography", transmission: "8-Speed Automatic", engine: "4.4L Twin-Turbo V8" },
        { name: "First Edition", transmission: "8-Speed Automatic", engine: "4.4L Twin-Turbo V8" },
        { name: "SVR", transmission: "8-Speed Automatic", engine: "4.4L Twin-Turbo V8" }
      ]},
      { name: "Range Rover Velar", trims: [
        { name: "S", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "SE", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Dynamic SE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" },
        { name: "HSE", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6 MHEV" }
      ]}
    ]
  },
  {
    name: "Lexus",
    models: [
      { name: "ES", trims: [
        { name: "ES 250", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "ES 300h", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "ES 350", transmission: "8-Speed Automatic", engine: "3.5L V6" }
      ]},
      { name: "GX", trims: [
        { name: "GX 460", transmission: "6-Speed Automatic", engine: "4.6L V8" },
        { name: "GX 550", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6" }
      ]},
      { name: "IS", trims: [
        { name: "IS 300", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "IS 300 AWD", transmission: "6-Speed Automatic", engine: "3.5L V6" },
        { name: "IS 350", transmission: "8-Speed Automatic", engine: "3.5L V6" },
        { name: "IS 500", transmission: "8-Speed Automatic", engine: "5.0L V8" }
      ]},
      { name: "LC", trims: [
        { name: "LC 500", transmission: "10-Speed Automatic", engine: "5.0L V8" },
        { name: "LC 500h", transmission: "CVT", engine: "3.5L V6 Hybrid" },
        { name: "LC 500 Convertible", transmission: "10-Speed Automatic", engine: "5.0L V8" }
      ]},
      { name: "LS", trims: [
        { name: "LS 500", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6" },
        { name: "LS 500h", transmission: "CVT", engine: "3.5L V6 Hybrid" }
      ]},
      { name: "LX", trims: [
        { name: "LX 600", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6" },
        { name: "LX 600 F Sport", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6" }
      ]},
      { name: "NX", trims: [
        { name: "NX 250", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "NX 350", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "NX 350h", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "NX 450h+", transmission: "CVT", engine: "2.5L PHEV" }
      ]},
      { name: "RC", trims: [
        { name: "RC 300", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "RC 350", transmission: "8-Speed Automatic", engine: "3.5L V6" },
        { name: "RC F", transmission: "8-Speed Automatic", engine: "5.0L V8" }
      ]},
      { name: "RX", trims: [
        { name: "RX 350", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "RX 350h", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "RX 450h+", transmission: "CVT", engine: "2.5L PHEV" },
        { name: "RX 500h", transmission: "6-Speed Automatic", engine: "2.4L Turbo Hybrid" }
      ]},
      { name: "RZ", trims: [
        { name: "RZ 450e", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "TX", trims: [
        { name: "TX 350", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "TX 500h", transmission: "6-Speed Automatic", engine: "2.4L Turbo Hybrid" },
        { name: "TX 550h+", transmission: "6-Speed Automatic", engine: "2.4L Turbo PHEV" }
      ]},
      { name: "UX", trims: [
        { name: "UX 200", transmission: "CVT", engine: "2.0L" },
        { name: "UX 250h", transmission: "CVT", engine: "2.0L Hybrid" }
      ]}
    ]
  },
  {
    name: "Lincoln",
    models: [
      { name: "Aviator", trims: [
        { name: "Standard", transmission: "10-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Reserve", transmission: "10-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Black Label", transmission: "10-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Grand Touring", transmission: "10-Speed Automatic", engine: "3.0L Twin-Turbo V6 PHEV" }
      ]},
      { name: "Corsair", trims: [
        { name: "Standard", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Reserve", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Grand Touring", transmission: "CVT", engine: "2.5L Atkinson PHEV" }
      ]},
      { name: "Nautilus", trims: [
        { name: "Standard", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Reserve", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "Black Label", transmission: "8-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "Navigator", trims: [
        { name: "Standard", transmission: "10-Speed Automatic", engine: "3.5L Twin-Turbo V6" },
        { name: "Reserve", transmission: "10-Speed Automatic", engine: "3.5L Twin-Turbo V6" },
        { name: "Black Label", transmission: "10-Speed Automatic", engine: "3.5L Twin-Turbo V6" }
      ]}
    ]
  },
  {
    name: "Lotus",
    models: [
      { name: "Eletre", trims: [
        { name: "Base", transmission: "Single-Speed", engine: "Electric" },
        { name: "S", transmission: "Single-Speed", engine: "Electric" },
        { name: "R", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Emira", trims: [
        { name: "First Edition", transmission: "6-Speed Manual", engine: "3.5L V6" },
        { name: "V6", transmission: "6-Speed Manual", engine: "3.5L V6" },
        { name: "i4", transmission: "8-Speed DCT", engine: "2.0L AMG Turbo" }
      ]}
    ]
  },
  {
    name: "Lucid",
    models: [
      { name: "Air", trims: [
        { name: "Pure", transmission: "Single-Speed", engine: "Electric" },
        { name: "Touring", transmission: "Single-Speed", engine: "Electric" },
        { name: "Grand Touring", transmission: "Single-Speed", engine: "Electric" },
        { name: "Sapphire", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Maserati",
    models: [
      { name: "Ghibli", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Modena", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Trofeo", transmission: "8-Speed Automatic", engine: "3.8L Twin-Turbo V8" }
      ]},
      { name: "GranTurismo", trims: [
        { name: "Modena", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Trofeo", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Folgore", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Grecale", trims: [
        { name: "GT", transmission: "8-Speed Automatic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Modena", transmission: "8-Speed Automatic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Trofeo", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Folgore", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Levante", trims: [
        { name: "GT", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Modena", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Trofeo", transmission: "8-Speed Automatic", engine: "3.8L Twin-Turbo V8" }
      ]},
      { name: "MC20", trims: [
        { name: "Coupe", transmission: "8-Speed DCT", engine: "3.0L Twin-Turbo V6" },
        { name: "Cielo", transmission: "8-Speed DCT", engine: "3.0L Twin-Turbo V6" }
      ]},
      { name: "Quattroporte", trims: [
        { name: "Modena", transmission: "8-Speed Automatic", engine: "3.0L Twin-Turbo V6" },
        { name: "Trofeo", transmission: "8-Speed Automatic", engine: "3.8L Twin-Turbo V8" }
      ]}
    ]
  },
  {
    name: "Mazda",
    models: [
      { name: "CX-30", trims: [
        { name: "GX", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GS", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GT", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GT Turbo", transmission: "6-Speed Automatic", engine: "2.5L Turbo" }
      ]},
      { name: "CX-5", trims: [
        { name: "GX", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GS", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GT", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "Signature", transmission: "6-Speed Automatic", engine: "2.5L Turbo" }
      ]},
      { name: "CX-50", trims: [
        { name: "GX", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GS", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GT", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GT Turbo", transmission: "6-Speed Automatic", engine: "2.5L Turbo" },
        { name: "Meridian Edition", transmission: "6-Speed Automatic", engine: "2.5L Turbo" }
      ]},
      { name: "CX-70", trims: [
        { name: "GS-L", transmission: "8-Speed Automatic", engine: "3.3L Turbo" },
        { name: "GT", transmission: "8-Speed Automatic", engine: "3.3L Turbo" },
        { name: "PHEV", transmission: "8-Speed Automatic", engine: "2.5L PHEV" }
      ]},
      { name: "CX-90", trims: [
        { name: "GS", transmission: "8-Speed Automatic", engine: "3.3L Turbo Mild Hybrid" },
        { name: "GS-L", transmission: "8-Speed Automatic", engine: "3.3L Turbo Mild Hybrid" },
        { name: "GT", transmission: "8-Speed Automatic", engine: "3.3L Turbo Mild Hybrid" },
        { name: "Signature", transmission: "8-Speed Automatic", engine: "3.3L Turbo Mild Hybrid" },
        { name: "PHEV", transmission: "8-Speed Automatic", engine: "2.5L PHEV" }
      ]},
      { name: "Mazda3", trims: [
        { name: "GX", transmission: "6-Speed Automatic", engine: "2.0L" },
        { name: "GS", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GT", transmission: "6-Speed Automatic", engine: "2.5L" },
        { name: "GT Turbo", transmission: "6-Speed Automatic", engine: "2.5L Turbo" }
      ]},
      { name: "MX-5 Miata", trims: [
        { name: "GS", transmission: "6-Speed Manual", engine: "2.0L" },
        { name: "GS-P", transmission: "6-Speed Manual", engine: "2.0L" },
        { name: "GT", transmission: "6-Speed Manual", engine: "2.0L" },
        { name: "RF GS-P", transmission: "6-Speed Manual", engine: "2.0L" },
        { name: "RF GT", transmission: "6-Speed Manual", engine: "2.0L" }
      ]}
    ]
  },
  {
    name: "McLaren",
    models: [
      { name: "720S", trims: [
        { name: "Coupe", transmission: "7-Speed SSG", engine: "4.0L Twin-Turbo V8" },
        { name: "Spider", transmission: "7-Speed SSG", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "750S", trims: [
        { name: "Coupe", transmission: "7-Speed SSG", engine: "4.0L Twin-Turbo V8" },
        { name: "Spider", transmission: "7-Speed SSG", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "Artura", trims: [
        { name: "Base", transmission: "8-Speed DCT", engine: "3.0L Twin-Turbo V6 PHEV" },
        { name: "Spider", transmission: "8-Speed DCT", engine: "3.0L Twin-Turbo V6 PHEV" }
      ]},
      { name: "GT", trims: [
        { name: "Base", transmission: "7-Speed SSG", engine: "4.0L Twin-Turbo V8" }
      ]}
    ]
  },
  {
    name: "Mercedes-Benz",
    models: [
      { name: "A-Class", trims: [
        { name: "A 220", transmission: "7G-DCT", engine: "2.0L Turbo" },
        { name: "A 220 4MATIC", transmission: "7G-DCT", engine: "2.0L Turbo" },
        { name: "AMG A 35", transmission: "AMG SPEEDSHIFT DCT", engine: "2.0L Turbo" }
      ]},
      { name: "C-Class", trims: [
        { name: "C 300", transmission: "9G-TRONIC", engine: "2.0L Turbo" },
        { name: "C 300 4MATIC", transmission: "9G-TRONIC", engine: "2.0L Turbo" },
        { name: "AMG C 43", transmission: "AMG SPEEDSHIFT MCT", engine: "2.0L Turbo Mild Hybrid" },
        { name: "AMG C 63 S", transmission: "AMG SPEEDSHIFT MCT", engine: "2.0L Turbo Hybrid" }
      ]},
      { name: "CLA", trims: [
        { name: "CLA 250", transmission: "7G-DCT", engine: "2.0L Turbo" },
        { name: "CLA 250 4MATIC", transmission: "7G-DCT", engine: "2.0L Turbo" },
        { name: "AMG CLA 35", transmission: "AMG SPEEDSHIFT DCT", engine: "2.0L Turbo" },
        { name: "AMG CLA 45", transmission: "AMG SPEEDSHIFT DCT", engine: "2.0L Turbo" }
      ]},
      { name: "E-Class", trims: [
        { name: "E 350", transmission: "9G-TRONIC", engine: "2.0L Turbo Mild Hybrid" },
        { name: "E 350 4MATIC", transmission: "9G-TRONIC", engine: "2.0L Turbo Mild Hybrid" },
        { name: "E 450 4MATIC", transmission: "9G-TRONIC", engine: "3.0L Turbo Mild Hybrid" },
        { name: "AMG E 53", transmission: "AMG SPEEDSHIFT TCT", engine: "3.0L Turbo Mild Hybrid" },
        { name: "AMG E 63 S", transmission: "AMG SPEEDSHIFT MCT", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "EQB", trims: [
        { name: "EQB 250+", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQB 300 4MATIC", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQB 350 4MATIC", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "EQE", trims: [
        { name: "EQE 350+", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQE 350 4MATIC", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQE 500 4MATIC", transmission: "Single-Speed", engine: "Electric" },
        { name: "AMG EQE 43", transmission: "Single-Speed", engine: "Electric" },
        { name: "AMG EQE 53", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "EQE SUV", trims: [
        { name: "EQE 350+", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQE 350 4MATIC", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQE 500 4MATIC", transmission: "Single-Speed", engine: "Electric" },
        { name: "AMG EQE 53", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "EQS", trims: [
        { name: "EQS 450+", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQS 450 4MATIC", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQS 580 4MATIC", transmission: "Single-Speed", engine: "Electric" },
        { name: "AMG EQS 53", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "EQS SUV", trims: [
        { name: "EQS 450+", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQS 450 4MATIC", transmission: "Single-Speed", engine: "Electric" },
        { name: "EQS 580 4MATIC", transmission: "Single-Speed", engine: "Electric" },
        { name: "AMG EQS 53", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "G-Class", trims: [
        { name: "G 550", transmission: "9G-TRONIC", engine: "4.0L Twin-Turbo V8" },
        { name: "AMG G 63", transmission: "AMG SPEEDSHIFT TCT", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "GLA", trims: [
        { name: "GLA 250", transmission: "8G-DCT", engine: "2.0L Turbo" },
        { name: "GLA 250 4MATIC", transmission: "8G-DCT", engine: "2.0L Turbo" },
        { name: "AMG GLA 35", transmission: "AMG SPEEDSHIFT DCT", engine: "2.0L Turbo" },
        { name: "AMG GLA 45", transmission: "AMG SPEEDSHIFT DCT", engine: "2.0L Turbo" }
      ]},
      { name: "GLB", trims: [
        { name: "GLB 250", transmission: "8G-DCT", engine: "2.0L Turbo" },
        { name: "GLB 250 4MATIC", transmission: "8G-DCT", engine: "2.0L Turbo" },
        { name: "AMG GLB 35", transmission: "AMG SPEEDSHIFT DCT", engine: "2.0L Turbo" }
      ]},
      { name: "GLC", trims: [
        { name: "GLC 300", transmission: "9G-TRONIC", engine: "2.0L Turbo Mild Hybrid" },
        { name: "GLC 300 4MATIC", transmission: "9G-TRONIC", engine: "2.0L Turbo Mild Hybrid" },
        { name: "AMG GLC 43", transmission: "AMG SPEEDSHIFT TCT", engine: "2.0L Turbo Mild Hybrid" },
        { name: "AMG GLC 63 S", transmission: "AMG SPEEDSHIFT MCT", engine: "2.0L Turbo Hybrid" }
      ]},
      { name: "GLE", trims: [
        { name: "GLE 350", transmission: "9G-TRONIC", engine: "2.0L Turbo Mild Hybrid" },
        { name: "GLE 450 4MATIC", transmission: "9G-TRONIC", engine: "3.0L Turbo Mild Hybrid" },
        { name: "GLE 580 4MATIC", transmission: "9G-TRONIC", engine: "4.0L Twin-Turbo V8 Mild Hybrid" },
        { name: "AMG GLE 53", transmission: "AMG SPEEDSHIFT TCT", engine: "3.0L Turbo Mild Hybrid" },
        { name: "AMG GLE 63 S", transmission: "AMG SPEEDSHIFT TCT", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "GLS", trims: [
        { name: "GLS 450 4MATIC", transmission: "9G-TRONIC", engine: "3.0L Turbo Mild Hybrid" },
        { name: "GLS 580 4MATIC", transmission: "9G-TRONIC", engine: "4.0L Twin-Turbo V8 Mild Hybrid" },
        { name: "AMG GLS 63", transmission: "AMG SPEEDSHIFT TCT", engine: "4.0L Twin-Turbo V8" },
        { name: "Maybach GLS 600", transmission: "9G-TRONIC", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "S-Class", trims: [
        { name: "S 500 4MATIC", transmission: "9G-TRONIC", engine: "3.0L Turbo Mild Hybrid" },
        { name: "S 580 4MATIC", transmission: "9G-TRONIC", engine: "4.0L Twin-Turbo V8 Mild Hybrid" },
        { name: "AMG S 63", transmission: "AMG SPEEDSHIFT MCT", engine: "4.0L Twin-Turbo V8 Hybrid" },
        { name: "Maybach S 580", transmission: "9G-TRONIC", engine: "4.0L Twin-Turbo V8" },
        { name: "Maybach S 680", transmission: "9G-TRONIC", engine: "6.0L Twin-Turbo V12" }
      ]},
      { name: "SL", trims: [
        { name: "AMG SL 43", transmission: "AMG SPEEDSHIFT MCT", engine: "2.0L Turbo" },
        { name: "AMG SL 55", transmission: "AMG SPEEDSHIFT MCT", engine: "4.0L Twin-Turbo V8" },
        { name: "AMG SL 63", transmission: "AMG SPEEDSHIFT MCT", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "AMG GT", trims: [
        { name: "AMG GT 43", transmission: "AMG SPEEDSHIFT MCT", engine: "2.0L Turbo Mild Hybrid" },
        { name: "AMG GT 55", transmission: "AMG SPEEDSHIFT MCT", engine: "4.0L Twin-Turbo V8" },
        { name: "AMG GT 63", transmission: "AMG SPEEDSHIFT MCT", engine: "4.0L Twin-Turbo V8" },
        { name: "AMG GT 63 S", transmission: "AMG SPEEDSHIFT MCT", engine: "4.0L Twin-Turbo V8" }
      ]}
    ]
  },
  {
    name: "Mini",
    models: [
      { name: "Cooper", trims: [
        { name: "Classic", transmission: "7-Speed DCT", engine: "1.5L Turbo" },
        { name: "S", transmission: "7-Speed DCT", engine: "2.0L Turbo" },
        { name: "John Cooper Works", transmission: "8-Speed Automatic", engine: "2.0L Turbo" }
      ]},
      { name: "Cooper Countryman", trims: [
        { name: "Classic", transmission: "7-Speed DCT", engine: "1.5L Turbo" },
        { name: "S ALL4", transmission: "7-Speed DCT", engine: "2.0L Turbo" },
        { name: "John Cooper Works ALL4", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "SE ALL4", transmission: "6-Speed Automatic", engine: "1.5L Turbo PHEV" }
      ]},
      { name: "Cooper Electric", trims: [
        { name: "E", transmission: "Single-Speed", engine: "Electric" },
        { name: "SE", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Mitsubishi",
    models: [
      { name: "Eclipse Cross", trims: [
        { name: "ES", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "SE", transmission: "CVT", engine: "1.5L Turbo" },
        { name: "GT", transmission: "CVT", engine: "1.5L Turbo" }
      ]},
      { name: "Mirage", trims: [
        { name: "ES", transmission: "CVT", engine: "1.2L" },
        { name: "SE", transmission: "CVT", engine: "1.2L" },
        { name: "GT", transmission: "CVT", engine: "1.2L" }
      ]},
      { name: "Outlander", trims: [
        { name: "ES", transmission: "CVT", engine: "2.5L" },
        { name: "SE", transmission: "CVT", engine: "2.5L" },
        { name: "SEL", transmission: "CVT", engine: "2.5L" },
        { name: "GT", transmission: "CVT", engine: "2.5L" }
      ]},
      { name: "Outlander PHEV", trims: [
        { name: "ES", transmission: "CVT", engine: "2.4L PHEV" },
        { name: "SE", transmission: "CVT", engine: "2.4L PHEV" },
        { name: "SEL", transmission: "CVT", engine: "2.4L PHEV" },
        { name: "GT", transmission: "CVT", engine: "2.4L PHEV" }
      ]},
      { name: "RVR", trims: [
        { name: "ES", transmission: "CVT", engine: "2.0L" },
        { name: "SE", transmission: "CVT", engine: "2.4L" },
        { name: "GT", transmission: "CVT", engine: "2.4L" }
      ]}
    ]
  },
  {
    name: "Nissan",
    models: [
      { name: "Altima", trims: [
        { name: "S", transmission: "CVT", engine: "2.5L" },
        { name: "SV", transmission: "CVT", engine: "2.5L" },
        { name: "SL", transmission: "CVT", engine: "2.5L" },
        { name: "SR", transmission: "CVT", engine: "2.5L" },
        { name: "Platinum", transmission: "CVT", engine: "2.0L VC-Turbo" }
      ]},
      { name: "ARIYA", trims: [
        { name: "Engage", transmission: "Single-Speed", engine: "Electric" },
        { name: "Engage+", transmission: "Single-Speed", engine: "Electric" },
        { name: "Evolve+", transmission: "Single-Speed", engine: "Electric" },
        { name: "Empower+", transmission: "Single-Speed", engine: "Electric" },
        { name: "Platinum+", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Frontier", trims: [
        { name: "S", transmission: "9-Speed Automatic", engine: "3.8L V6" },
        { name: "SV", transmission: "9-Speed Automatic", engine: "3.8L V6" },
        { name: "PRO-4X", transmission: "9-Speed Automatic", engine: "3.8L V6" },
        { name: "PRO-X", transmission: "9-Speed Automatic", engine: "3.8L V6" }
      ]},
      { name: "Kicks", trims: [
        { name: "S", transmission: "CVT", engine: "1.6L" },
        { name: "SV", transmission: "CVT", engine: "1.6L" },
        { name: "SR", transmission: "CVT", engine: "1.6L" }
      ]},
      { name: "LEAF", trims: [
        { name: "S", transmission: "Single-Speed", engine: "Electric" },
        { name: "SV Plus", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Maxima", trims: [
        { name: "SV", transmission: "CVT", engine: "3.5L V6" },
        { name: "SR", transmission: "CVT", engine: "3.5L V6" },
        { name: "Platinum", transmission: "CVT", engine: "3.5L V6" }
      ]},
      { name: "Murano", trims: [
        { name: "S", transmission: "CVT", engine: "3.5L V6" },
        { name: "SV", transmission: "CVT", engine: "3.5L V6" },
        { name: "SL", transmission: "CVT", engine: "3.5L V6" },
        { name: "Platinum", transmission: "CVT", engine: "3.5L V6" }
      ]},
      { name: "Pathfinder", trims: [
        { name: "S", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "SV", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "SL", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "Platinum", transmission: "9-Speed Automatic", engine: "3.5L V6" },
        { name: "Rock Creek", transmission: "9-Speed Automatic", engine: "3.5L V6" }
      ]},
      { name: "Qashqai", trims: [
        { name: "S", transmission: "CVT", engine: "2.0L" },
        { name: "SV", transmission: "CVT", engine: "2.0L" },
        { name: "SL", transmission: "CVT", engine: "2.0L" },
        { name: "Platinum", transmission: "CVT", engine: "2.0L" }
      ]},
      { name: "Rogue", trims: [
        { name: "S", transmission: "CVT", engine: "1.5L VC-Turbo" },
        { name: "SV", transmission: "CVT", engine: "1.5L VC-Turbo" },
        { name: "SL", transmission: "CVT", engine: "1.5L VC-Turbo" },
        { name: "Platinum", transmission: "CVT", engine: "1.5L VC-Turbo" }
      ]},
      { name: "Sentra", trims: [
        { name: "S", transmission: "CVT", engine: "2.0L" },
        { name: "SV", transmission: "CVT", engine: "2.0L" },
        { name: "SR", transmission: "CVT", engine: "2.0L" }
      ]},
      { name: "Titan", trims: [
        { name: "S", transmission: "9-Speed Automatic", engine: "5.6L V8" },
        { name: "SV", transmission: "9-Speed Automatic", engine: "5.6L V8" },
        { name: "PRO-4X", transmission: "9-Speed Automatic", engine: "5.6L V8" },
        { name: "Platinum Reserve", transmission: "9-Speed Automatic", engine: "5.6L V8" }
      ]},
      { name: "Versa", trims: [
        { name: "S", transmission: "5-Speed Manual", engine: "1.6L" },
        { name: "SV", transmission: "CVT", engine: "1.6L" },
        { name: "SR", transmission: "CVT", engine: "1.6L" }
      ]},
      { name: "Z", trims: [
        { name: "Sport", transmission: "6-Speed Manual", engine: "3.0L Twin-Turbo V6" },
        { name: "Performance", transmission: "6-Speed Manual", engine: "3.0L Twin-Turbo V6" },
        { name: "NISMO", transmission: "9-Speed Automatic", engine: "3.0L Twin-Turbo V6" }
      ]}
    ]
  },
  {
    name: "Polestar",
    models: [
      { name: "Polestar 2", trims: [
        { name: "Standard Range Single Motor", transmission: "Single-Speed", engine: "Electric" },
        { name: "Long Range Single Motor", transmission: "Single-Speed", engine: "Electric" },
        { name: "Long Range Dual Motor", transmission: "Single-Speed", engine: "Electric" },
        { name: "BST Edition 270", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Polestar 3", trims: [
        { name: "Long Range Dual Motor", transmission: "Single-Speed", engine: "Electric" },
        { name: "Long Range Dual Motor with Performance Pack", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Polestar 4", trims: [
        { name: "Long Range Single Motor", transmission: "Single-Speed", engine: "Electric" },
        { name: "Long Range Dual Motor", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Porsche",
    models: [
      { name: "718 Boxster", trims: [
        { name: "Base", transmission: "6-Speed Manual", engine: "2.0L Turbo Flat-4" },
        { name: "S", transmission: "7-Speed PDK", engine: "2.5L Turbo Flat-4" },
        { name: "GTS 4.0", transmission: "6-Speed Manual", engine: "4.0L Flat-6" },
        { name: "Spyder", transmission: "6-Speed Manual", engine: "4.0L Flat-6" }
      ]},
      { name: "718 Cayman", trims: [
        { name: "Base", transmission: "6-Speed Manual", engine: "2.0L Turbo Flat-4" },
        { name: "S", transmission: "7-Speed PDK", engine: "2.5L Turbo Flat-4" },
        { name: "GTS 4.0", transmission: "6-Speed Manual", engine: "4.0L Flat-6" },
        { name: "GT4", transmission: "6-Speed Manual", engine: "4.0L Flat-6" },
        { name: "GT4 RS", transmission: "7-Speed PDK", engine: "4.0L Flat-6" }
      ]},
      { name: "911", trims: [
        { name: "Carrera", transmission: "8-Speed PDK", engine: "3.0L Twin-Turbo Flat-6" },
        { name: "Carrera S", transmission: "8-Speed PDK", engine: "3.0L Twin-Turbo Flat-6" },
        { name: "Carrera GTS", transmission: "8-Speed PDK", engine: "3.0L Twin-Turbo Flat-6" },
        { name: "Carrera 4", transmission: "8-Speed PDK", engine: "3.0L Twin-Turbo Flat-6" },
        { name: "Carrera 4S", transmission: "8-Speed PDK", engine: "3.0L Twin-Turbo Flat-6" },
        { name: "Carrera 4 GTS", transmission: "8-Speed PDK", engine: "3.0L Twin-Turbo Flat-6" },
        { name: "Targa 4", transmission: "8-Speed PDK", engine: "3.0L Twin-Turbo Flat-6" },
        { name: "Targa 4S", transmission: "8-Speed PDK", engine: "3.0L Twin-Turbo Flat-6" },
        { name: "Targa 4 GTS", transmission: "8-Speed PDK", engine: "3.0L Twin-Turbo Flat-6" },
        { name: "Turbo", transmission: "8-Speed PDK", engine: "3.7L Twin-Turbo Flat-6" },
        { name: "Turbo S", transmission: "8-Speed PDK", engine: "3.7L Twin-Turbo Flat-6" },
        { name: "GT3", transmission: "7-Speed PDK", engine: "4.0L Flat-6" },
        { name: "GT3 RS", transmission: "7-Speed PDK", engine: "4.0L Flat-6" }
      ]},
      { name: "Cayenne", trims: [
        { name: "Base", transmission: "8-Speed Tiptronic S", engine: "3.0L Turbo V6" },
        { name: "S", transmission: "8-Speed Tiptronic S", engine: "2.9L Twin-Turbo V6" },
        { name: "E-Hybrid", transmission: "8-Speed Tiptronic S", engine: "3.0L V6 PHEV" },
        { name: "GTS", transmission: "8-Speed Tiptronic S", engine: "4.0L Twin-Turbo V8" },
        { name: "Turbo GT", transmission: "8-Speed Tiptronic S", engine: "4.0L Twin-Turbo V8" }
      ]},
      { name: "Macan", trims: [
        { name: "Base", transmission: "7-Speed PDK", engine: "2.0L Turbo" },
        { name: "S", transmission: "7-Speed PDK", engine: "2.9L Twin-Turbo V6" },
        { name: "GTS", transmission: "7-Speed PDK", engine: "2.9L Twin-Turbo V6" },
        { name: "Electric", transmission: "Single-Speed", engine: "Electric" },
        { name: "Electric 4", transmission: "Single-Speed", engine: "Electric" },
        { name: "Electric 4S", transmission: "Single-Speed", engine: "Electric" },
        { name: "Electric Turbo", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Panamera", trims: [
        { name: "Base", transmission: "8-Speed PDK", engine: "2.9L Twin-Turbo V6" },
        { name: "4", transmission: "8-Speed PDK", engine: "2.9L Twin-Turbo V6" },
        { name: "4 E-Hybrid", transmission: "8-Speed PDK", engine: "2.9L Twin-Turbo V6 PHEV" },
        { name: "4S", transmission: "8-Speed PDK", engine: "2.9L Twin-Turbo V6" },
        { name: "4S E-Hybrid", transmission: "8-Speed PDK", engine: "2.9L Twin-Turbo V6 PHEV" },
        { name: "GTS", transmission: "8-Speed PDK", engine: "4.0L Twin-Turbo V8" },
        { name: "Turbo S", transmission: "8-Speed PDK", engine: "4.0L Twin-Turbo V8" },
        { name: "Turbo S E-Hybrid", transmission: "8-Speed PDK", engine: "4.0L Twin-Turbo V8 PHEV" }
      ]},
      { name: "Taycan", trims: [
        { name: "Base", transmission: "2-Speed", engine: "Electric" },
        { name: "4S", transmission: "2-Speed", engine: "Electric" },
        { name: "GTS", transmission: "2-Speed", engine: "Electric" },
        { name: "Turbo", transmission: "2-Speed", engine: "Electric" },
        { name: "Turbo S", transmission: "2-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Ram",
    models: [
      { name: "1500", trims: [
        { name: "Tradesman", transmission: "8-Speed Automatic", engine: "3.6L V6" },
        { name: "Big Horn", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "Laramie", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "Rebel", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "Limited", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "Limited Longhorn", transmission: "8-Speed Automatic", engine: "5.7L HEMI V8" },
        { name: "TRX", transmission: "8-Speed Automatic", engine: "6.2L Supercharged HEMI V8" }
      ]},
      { name: "1500 REV", trims: [
        { name: "Tradesman", transmission: "Single-Speed", engine: "Electric" },
        { name: "Big Horn", transmission: "Single-Speed", engine: "Electric" },
        { name: "Laramie", transmission: "Single-Speed", engine: "Electric" },
        { name: "Limited", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "ProMaster", trims: [
        { name: "1500 Low Roof", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "2500 High Roof", transmission: "9-Speed Automatic", engine: "3.6L V6" },
        { name: "3500 High Roof", transmission: "9-Speed Automatic", engine: "3.6L V6" }
      ]},
      { name: "ProMaster City", trims: [
        { name: "Tradesman", transmission: "9-Speed Automatic", engine: "2.4L" },
        { name: "SLT", transmission: "9-Speed Automatic", engine: "2.4L" }
      ]}
    ]
  },
  {
    name: "Rivian",
    models: [
      { name: "R1S", trims: [
        { name: "Dual-Motor Standard Pack", transmission: "Single-Speed", engine: "Electric" },
        { name: "Dual-Motor Large Pack", transmission: "Single-Speed", engine: "Electric" },
        { name: "Dual-Motor Max Pack", transmission: "Single-Speed", engine: "Electric" },
        { name: "Quad-Motor", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "R1T", trims: [
        { name: "Dual-Motor Standard Pack", transmission: "Single-Speed", engine: "Electric" },
        { name: "Dual-Motor Large Pack", transmission: "Single-Speed", engine: "Electric" },
        { name: "Dual-Motor Max Pack", transmission: "Single-Speed", engine: "Electric" },
        { name: "Quad-Motor", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "R2", trims: [
        { name: "Dual-Motor", transmission: "Single-Speed", engine: "Electric" },
        { name: "Tri-Motor", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Rolls-Royce",
    models: [
      { name: "Cullinan", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "6.75L Twin-Turbo V12" },
        { name: "Black Badge", transmission: "8-Speed Automatic", engine: "6.75L Twin-Turbo V12" }
      ]},
      { name: "Ghost", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "6.75L Twin-Turbo V12" },
        { name: "Extended", transmission: "8-Speed Automatic", engine: "6.75L Twin-Turbo V12" },
        { name: "Black Badge", transmission: "8-Speed Automatic", engine: "6.75L Twin-Turbo V12" }
      ]},
      { name: "Phantom", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "6.75L Twin-Turbo V12" },
        { name: "Extended", transmission: "8-Speed Automatic", engine: "6.75L Twin-Turbo V12" }
      ]},
      { name: "Spectre", trims: [
        { name: "Base", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Wraith", trims: [
        { name: "Base", transmission: "8-Speed Automatic", engine: "6.6L Twin-Turbo V12" },
        { name: "Black Badge", transmission: "8-Speed Automatic", engine: "6.6L Twin-Turbo V12" }
      ]}
    ]
  },
  {
    name: "Smart",
    models: [
      { name: "#1", trims: [
        { name: "Pro", transmission: "Single-Speed", engine: "Electric" },
        { name: "Pro+", transmission: "Single-Speed", engine: "Electric" },
        { name: "Premium", transmission: "Single-Speed", engine: "Electric" },
        { name: "Brabus", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Subaru",
    models: [
      { name: "Ascent", trims: [
        { name: "Convenience", transmission: "CVT", engine: "2.4L Turbo" },
        { name: "Touring", transmission: "CVT", engine: "2.4L Turbo" },
        { name: "Limited", transmission: "CVT", engine: "2.4L Turbo" },
        { name: "Premier", transmission: "CVT", engine: "2.4L Turbo" },
        { name: "Onyx Edition", transmission: "CVT", engine: "2.4L Turbo" }
      ]},
      { name: "BRZ", trims: [
        { name: "Base", transmission: "6-Speed Manual", engine: "2.4L Flat-4" },
        { name: "Sport-tech", transmission: "6-Speed Automatic", engine: "2.4L Flat-4" },
        { name: "tS", transmission: "6-Speed Manual", engine: "2.4L Flat-4" }
      ]},
      { name: "Crosstrek", trims: [
        { name: "Convenience", transmission: "CVT", engine: "2.0L Flat-4" },
        { name: "Touring", transmission: "CVT", engine: "2.0L Flat-4" },
        { name: "Sport", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Outdoor", transmission: "CVT", engine: "2.5L Flat-4" }
      ]},
      { name: "Forester", trims: [
        { name: "Base", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Convenience", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Touring", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Sport", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Premier", transmission: "CVT", engine: "2.5L Flat-4" }
      ]},
      { name: "Impreza", trims: [
        { name: "Base", transmission: "CVT", engine: "2.0L Flat-4" },
        { name: "Convenience", transmission: "CVT", engine: "2.0L Flat-4" },
        { name: "Touring", transmission: "CVT", engine: "2.0L Flat-4" },
        { name: "Sport", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Sport-tech", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "RS", transmission: "CVT", engine: "2.5L Flat-4" }
      ]},
      { name: "Legacy", trims: [
        { name: "Base", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Touring", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Premier", transmission: "CVT", engine: "2.4L Turbo Flat-4" },
        { name: "Sport GT", transmission: "CVT", engine: "2.4L Turbo Flat-4" }
      ]},
      { name: "Outback", trims: [
        { name: "Base", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Convenience", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Touring", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Flat-4" },
        { name: "Premier", transmission: "CVT", engine: "2.4L Turbo Flat-4" },
        { name: "Onyx Edition XT", transmission: "CVT", engine: "2.4L Turbo Flat-4" },
        { name: "Wilderness", transmission: "CVT", engine: "2.4L Turbo Flat-4" }
      ]},
      { name: "Solterra", trims: [
        { name: "Base", transmission: "Single-Speed", engine: "Electric" },
        { name: "Touring", transmission: "Single-Speed", engine: "Electric" },
        { name: "Limited", transmission: "Single-Speed", engine: "Electric" },
        { name: "Premier", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "WRX", trims: [
        { name: "Base", transmission: "6-Speed Manual", engine: "2.4L Turbo Flat-4" },
        { name: "Sport", transmission: "6-Speed Manual", engine: "2.4L Turbo Flat-4" },
        { name: "Sport-tech", transmission: "CVT", engine: "2.4L Turbo Flat-4" },
        { name: "tS", transmission: "6-Speed Manual", engine: "2.4L Turbo Flat-4" }
      ]}
    ]
  },
  {
    name: "Tesla",
    models: [
      { name: "Model 3", trims: [
        { name: "RWD", transmission: "Single-Speed", engine: "Electric" },
        { name: "Long Range", transmission: "Single-Speed", engine: "Electric" },
        { name: "Performance", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Model S", trims: [
        { name: "Dual Motor All-Wheel Drive", transmission: "Single-Speed", engine: "Electric" },
        { name: "Plaid", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Model X", trims: [
        { name: "Dual Motor All-Wheel Drive", transmission: "Single-Speed", engine: "Electric" },
        { name: "Plaid", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Model Y", trims: [
        { name: "RWD", transmission: "Single-Speed", engine: "Electric" },
        { name: "Long Range", transmission: "Single-Speed", engine: "Electric" },
        { name: "Performance", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Cybertruck", trims: [
        { name: "RWD", transmission: "Single-Speed", engine: "Electric" },
        { name: "All-Wheel Drive", transmission: "Single-Speed", engine: "Electric" },
        { name: "Cyberbeast", transmission: "Single-Speed", engine: "Electric" }
      ]}
    ]
  },
  {
    name: "Toyota",
    models: [
      { name: "4Runner", trims: [
        { name: "SR5", transmission: "5-Speed Automatic", engine: "4.0L V6" },
        { name: "SR5 Premium", transmission: "5-Speed Automatic", engine: "4.0L V6" },
        { name: "TRD Sport", transmission: "5-Speed Automatic", engine: "4.0L V6" },
        { name: "TRD Off-Road", transmission: "5-Speed Automatic", engine: "4.0L V6" },
        { name: "TRD Off-Road Premium", transmission: "5-Speed Automatic", engine: "4.0L V6" },
        { name: "Limited", transmission: "5-Speed Automatic", engine: "4.0L V6" },
        { name: "TRD Pro", transmission: "5-Speed Automatic", engine: "4.0L V6" }
      ]},
      { name: "bZ4X", trims: [
        { name: "XLE", transmission: "Single-Speed", engine: "Electric" },
        { name: "Limited", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Camry", trims: [
        { name: "LE", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "SE", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "XLE", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "XSE", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "TRD", transmission: "8-Speed Automatic", engine: "3.5L V6" }
      ]},
      { name: "Camry Hybrid", trims: [
        { name: "LE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "SE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "XLE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "XSE", transmission: "CVT", engine: "2.5L Hybrid" }
      ]},
      { name: "Corolla", trims: [
        { name: "L", transmission: "CVT", engine: "1.8L" },
        { name: "LE", transmission: "CVT", engine: "1.8L" },
        { name: "SE", transmission: "CVT", engine: "2.0L" },
        { name: "XLE", transmission: "CVT", engine: "1.8L" },
        { name: "XSE", transmission: "CVT", engine: "2.0L" }
      ]},
      { name: "Corolla Cross", trims: [
        { name: "L", transmission: "CVT", engine: "2.0L" },
        { name: "LE", transmission: "CVT", engine: "2.0L" },
        { name: "XLE", transmission: "CVT", engine: "2.0L" }
      ]},
      { name: "Corolla Cross Hybrid", trims: [
        { name: "S", transmission: "CVT", engine: "2.0L Hybrid" },
        { name: "SE", transmission: "CVT", engine: "2.0L Hybrid" },
        { name: "XSE", transmission: "CVT", engine: "2.0L Hybrid" }
      ]},
      { name: "Corolla Hatchback", trims: [
        { name: "SE", transmission: "CVT", engine: "2.0L" },
        { name: "XSE", transmission: "CVT", engine: "2.0L" }
      ]},
      { name: "Crown", trims: [
        { name: "XLE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Platinum", transmission: "6-Speed Automatic", engine: "2.4L Turbo Hybrid" }
      ]},
      { name: "Grand Highlander", trims: [
        { name: "XLE", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "Limited", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "Platinum", transmission: "8-Speed Automatic", engine: "2.4L Turbo" }
      ]},
      { name: "Grand Highlander Hybrid", trims: [
        { name: "XLE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Platinum", transmission: "6-Speed Automatic", engine: "2.4L Turbo Hybrid" }
      ]},
      { name: "GR86", trims: [
        { name: "Base", transmission: "6-Speed Manual", engine: "2.4L Flat-4" },
        { name: "Premium", transmission: "6-Speed Automatic", engine: "2.4L Flat-4" }
      ]},
      { name: "GR Corolla", trims: [
        { name: "Core", transmission: "6-Speed Manual", engine: "1.6L Turbo" },
        { name: "Circuit Edition", transmission: "6-Speed Manual", engine: "1.6L Turbo" },
        { name: "Morizo Edition", transmission: "6-Speed Manual", engine: "1.6L Turbo" }
      ]},
      { name: "GR Supra", trims: [
        { name: "2.0", transmission: "8-Speed Automatic", engine: "2.0L Turbo" },
        { name: "3.0", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6" },
        { name: "3.0 Premium", transmission: "8-Speed Automatic", engine: "3.0L Turbo I6" },
        { name: "A91-MT Edition", transmission: "6-Speed Manual", engine: "3.0L Turbo I6" }
      ]},
      { name: "Highlander", trims: [
        { name: "LE", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "XLE", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "Limited", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "Platinum", transmission: "8-Speed Automatic", engine: "2.4L Turbo" }
      ]},
      { name: "Highlander Hybrid", trims: [
        { name: "LE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "XLE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Platinum", transmission: "CVT", engine: "2.5L Hybrid" }
      ]},
      { name: "Land Cruiser", trims: [
        { name: "1958", transmission: "8-Speed Automatic", engine: "2.4L Turbo Hybrid" },
        { name: "First Edition", transmission: "8-Speed Automatic", engine: "2.4L Turbo Hybrid" }
      ]},
      { name: "Prius", trims: [
        { name: "LE", transmission: "CVT", engine: "2.0L Hybrid" },
        { name: "XLE", transmission: "CVT", engine: "2.0L Hybrid" },
        { name: "Limited", transmission: "CVT", engine: "2.0L Hybrid" }
      ]},
      { name: "Prius Prime", trims: [
        { name: "SE", transmission: "CVT", engine: "2.0L PHEV" },
        { name: "XSE", transmission: "CVT", engine: "2.0L PHEV" },
        { name: "XSE Premium", transmission: "CVT", engine: "2.0L PHEV" }
      ]},
      { name: "RAV4", trims: [
        { name: "LE", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "XLE", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "XLE Premium", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Trail", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "Limited", transmission: "8-Speed Automatic", engine: "2.5L" },
        { name: "TRD Off-Road", transmission: "8-Speed Automatic", engine: "2.5L" }
      ]},
      { name: "RAV4 Hybrid", trims: [
        { name: "LE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "XLE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "XLE Premium", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "SE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Hybrid" }
      ]},
      { name: "RAV4 Prime", trims: [
        { name: "SE", transmission: "CVT", engine: "2.5L PHEV" },
        { name: "XSE", transmission: "CVT", engine: "2.5L PHEV" }
      ]},
      { name: "Sequoia", trims: [
        { name: "SR5", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6 Hybrid" },
        { name: "Limited", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6 Hybrid" },
        { name: "Platinum", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6 Hybrid" },
        { name: "TRD Pro", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6 Hybrid" },
        { name: "Capstone", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6 Hybrid" }
      ]},
      { name: "Sienna", trims: [
        { name: "LE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "XLE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "XSE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Woodland Edition", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Platinum", transmission: "CVT", engine: "2.5L Hybrid" }
      ]},
      { name: "Tacoma", trims: [
        { name: "SR", transmission: "6-Speed Automatic", engine: "2.4L Turbo" },
        { name: "SR5", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "TRD Sport", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "TRD Off-Road", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "Limited", transmission: "8-Speed Automatic", engine: "2.4L Turbo" },
        { name: "Trailhunter", transmission: "8-Speed Automatic", engine: "2.4L Turbo Hybrid" },
        { name: "TRD Pro", transmission: "8-Speed Automatic", engine: "2.4L Turbo Hybrid" }
      ]},
      { name: "Tundra", trims: [
        { name: "SR", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6" },
        { name: "SR5", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6" },
        { name: "Limited", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6" },
        { name: "Platinum", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6 Hybrid" },
        { name: "1794 Edition", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6 Hybrid" },
        { name: "TRD Pro", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6 Hybrid" },
        { name: "Capstone", transmission: "10-Speed Automatic", engine: "3.4L Twin-Turbo V6 Hybrid" }
      ]},
      { name: "Venza", trims: [
        { name: "LE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "XLE", transmission: "CVT", engine: "2.5L Hybrid" },
        { name: "Limited", transmission: "CVT", engine: "2.5L Hybrid" }
      ]}
    ]
  },
  {
    name: "Volkswagen",
    models: [
      { name: "Arteon", trims: [
        { name: "SE", transmission: "8-Speed Automatic", engine: "2.0L TSI" },
        { name: "SEL Premium R-Line", transmission: "8-Speed Automatic", engine: "2.0L TSI" }
      ]},
      { name: "Atlas", trims: [
        { name: "SE", transmission: "8-Speed Automatic", engine: "2.0L TSI" },
        { name: "SE with Technology", transmission: "8-Speed Automatic", engine: "2.0L TSI" },
        { name: "SEL", transmission: "8-Speed Automatic", engine: "3.6L VR6" },
        { name: "SEL Premium R-Line", transmission: "8-Speed Automatic", engine: "3.6L VR6" }
      ]},
      { name: "Atlas Cross Sport", trims: [
        { name: "SE", transmission: "8-Speed Automatic", engine: "2.0L TSI" },
        { name: "SE with Technology", transmission: "8-Speed Automatic", engine: "2.0L TSI" },
        { name: "SE with Technology R-Line", transmission: "8-Speed Automatic", engine: "2.0L TSI" },
        { name: "SEL", transmission: "8-Speed Automatic", engine: "3.6L VR6" },
        { name: "SEL R-Line", transmission: "8-Speed Automatic", engine: "3.6L VR6" },
        { name: "SEL Premium R-Line", transmission: "8-Speed Automatic", engine: "3.6L VR6" }
      ]},
      { name: "Golf GTI", trims: [
        { name: "S", transmission: "6-Speed Manual", engine: "2.0L TSI" },
        { name: "SE", transmission: "7-Speed DSG", engine: "2.0L TSI" },
        { name: "Autobahn", transmission: "7-Speed DSG", engine: "2.0L TSI" }
      ]},
      { name: "Golf R", trims: [
        { name: "Base", transmission: "6-Speed Manual", engine: "2.0L TSI" },
        { name: "Base", transmission: "7-Speed DSG", engine: "2.0L TSI" }
      ]},
      { name: "ID.4", trims: [
        { name: "Standard", transmission: "Single-Speed", engine: "Electric" },
        { name: "Pro S", transmission: "Single-Speed", engine: "Electric" },
        { name: "Pro S Plus", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "ID.Buzz", trims: [
        { name: "Pro S", transmission: "Single-Speed", engine: "Electric" },
        { name: "Pro S Plus", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "Jetta", trims: [
        { name: "S", transmission: "6-Speed Manual", engine: "1.5L TSI" },
        { name: "Sport", transmission: "8-Speed Automatic", engine: "1.5L TSI" },
        { name: "SE", transmission: "8-Speed Automatic", engine: "1.5L TSI" },
        { name: "SEL", transmission: "8-Speed Automatic", engine: "1.5L TSI" }
      ]},
      { name: "Jetta GLI", trims: [
        { name: "S", transmission: "6-Speed Manual", engine: "2.0L TSI" },
        { name: "Autobahn", transmission: "7-Speed DSG", engine: "2.0L TSI" }
      ]},
      { name: "Taos", trims: [
        { name: "S", transmission: "8-Speed Automatic", engine: "1.5L TSI" },
        { name: "SE", transmission: "8-Speed Automatic", engine: "1.5L TSI" },
        { name: "SEL", transmission: "7-Speed DSG", engine: "1.5L TSI" }
      ]},
      { name: "Tiguan", trims: [
        { name: "S", transmission: "8-Speed Automatic", engine: "2.0L TSI" },
        { name: "SE", transmission: "8-Speed Automatic", engine: "2.0L TSI" },
        { name: "SE R-Line", transmission: "8-Speed Automatic", engine: "2.0L TSI" },
        { name: "SEL R-Line", transmission: "8-Speed Automatic", engine: "2.0L TSI" }
      ]}
    ]
  },
  {
    name: "Volvo",
    models: [
      { name: "C40 Recharge", trims: [
        { name: "Core", transmission: "Single-Speed", engine: "Electric" },
        { name: "Plus", transmission: "Single-Speed", engine: "Electric" },
        { name: "Ultimate", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "EX30", trims: [
        { name: "Core", transmission: "Single-Speed", engine: "Electric" },
        { name: "Plus", transmission: "Single-Speed", engine: "Electric" },
        { name: "Ultra", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "EX90", trims: [
        { name: "Core", transmission: "Single-Speed", engine: "Electric" },
        { name: "Plus", transmission: "Single-Speed", engine: "Electric" },
        { name: "Ultra", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "S60", trims: [
        { name: "Core", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Plus Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Ultimate Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Polestar Engineered", transmission: "8-Speed Geartronic", engine: "2.0L Turbo PHEV" }
      ]},
      { name: "S90", trims: [
        { name: "Core", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Plus Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Ultimate Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" }
      ]},
      { name: "V60 Cross Country", trims: [
        { name: "Core", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Plus Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Ultimate Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" }
      ]},
      { name: "V90 Cross Country", trims: [
        { name: "Core", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Plus Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Ultimate Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" }
      ]},
      { name: "XC40", trims: [
        { name: "Core", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Plus Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Ultimate Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" }
      ]},
      { name: "XC40 Recharge", trims: [
        { name: "Core", transmission: "Single-Speed", engine: "Electric" },
        { name: "Plus", transmission: "Single-Speed", engine: "Electric" },
        { name: "Ultimate", transmission: "Single-Speed", engine: "Electric" }
      ]},
      { name: "XC60", trims: [
        { name: "Core", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Plus Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Ultimate Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Polestar Engineered", transmission: "8-Speed Geartronic", engine: "2.0L Turbo PHEV" }
      ]},
      { name: "XC90", trims: [
        { name: "Core", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Plus Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" },
        { name: "Ultimate Dark Theme", transmission: "8-Speed Geartronic", engine: "2.0L Turbo Mild Hybrid" }
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
  const cleaned = postalCode.replaceAll(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
  }
  return cleaned
}
