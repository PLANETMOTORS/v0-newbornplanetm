export function mapDrivetrain(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("all wheel") || lower.includes("awd") || lower.includes("4wd")) return "AWD"
  if (lower.includes("front wheel") || lower.includes("fwd")) return "FWD"
  if (lower.includes("rear wheel") || lower.includes("rwd")) return "RWD"
  if (lower.includes("4x4") || lower.includes("four wheel")) return "4WD"
  return raw
}

export function mapFuelType(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("gasoline")) return "Gasoline"
  if (lower.includes("diesel")) return "Diesel"
  if (lower.includes("electric")) return "Electric"
  if (lower.includes("hybrid") && lower.includes("plug")) return "Plug-in Hybrid"
  if (lower.includes("hybrid")) return "Hybrid"
  if (lower.includes("flex")) return "Flex Fuel"
  return raw
}

export function mapTransmission(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("automatic")) return "Automatic"
  if (lower.includes("manual")) return "Manual"
  if (lower.includes("cvt")) return "CVT"
  if (lower.includes("dual clutch") || lower.includes("dct")) return "DCT"
  return raw
}
