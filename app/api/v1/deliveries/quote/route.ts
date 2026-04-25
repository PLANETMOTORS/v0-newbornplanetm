 
import { NextRequest, NextResponse } from "next/server"

// Origin location: Planet Motors, Richmond Hill, Ontario (L4B postal code area)


// Canadian postal code distance estimates (approximate — in production use Google Maps Distance Matrix API)
// First 3 characters of postal code (FSA) mapped to approximate distance from Richmond Hill
const POSTAL_DISTANCES: Record<string, number> = {
  // GTA - Very Close (0-50km) - FREE
  "L4B": 0, "L4C": 5, "L4E": 8, "L4G": 12, "L4H": 10,
  "L4J": 15, "L4K": 8, "L4L": 12, "L4S": 20, "L4T": 25,
  "L3P": 18, "L3R": 15, "L3S": 20, "L3T": 12, "L3Y": 25,
  "L6A": 30, "L6B": 28, "L6C": 32, "L6E": 35, "L6G": 38,
  "L6H": 40, "L6J": 42, "L6K": 45, "L6L": 48, "L6M": 50,
  "L6P": 35, "L6R": 38, "L6S": 40, "L6T": 42, "L6V": 45,
  "L6W": 48, "L6X": 50, "L6Y": 52, "L6Z": 55,
  "L7A": 60, "L7B": 65, "L7C": 70, "L7E": 45, "L7G": 50,
  "L7J": 75, "L7K": 80, "L7L": 85, "L7M": 90, "L7N": 95,
  "L7P": 100, "L7R": 105, "L7S": 110, "L7T": 115,
  
  // Toronto Core (15-40km) - FREE
  "M1A": 30, "M1B": 32, "M1C": 35, "M1E": 38, "M1G": 35,
  "M1H": 33, "M1J": 35, "M1K": 38, "M1L": 35, "M1M": 38,
  "M1N": 40, "M1P": 35, "M1R": 33, "M1S": 30, "M1T": 28,
  "M1V": 32, "M1W": 30, "M1X": 35,
  "M2H": 20, "M2J": 22, "M2K": 25, "M2L": 22, "M2M": 20,
  "M2N": 18, "M2P": 20, "M2R": 18,
  "M3A": 22, "M3B": 25, "M3C": 28, "M3H": 22, "M3J": 20,
  "M3K": 22, "M3L": 25, "M3M": 28, "M3N": 30,
  "M4A": 25, "M4B": 28, "M4C": 30, "M4E": 32, "M4G": 28,
  "M4H": 30, "M4J": 32, "M4K": 30, "M4L": 32, "M4M": 35,
  "M4N": 28, "M4P": 25, "M4R": 25, "M4S": 25, "M4T": 28,
  "M4V": 30, "M4W": 32, "M4X": 35, "M4Y": 35,
  "M5A": 35, "M5B": 35, "M5C": 38, "M5E": 38, "M5G": 35,
  "M5H": 35, "M5J": 38, "M5K": 38, "M5L": 35, "M5M": 30,
  "M5N": 28, "M5P": 28, "M5R": 30, "M5S": 32, "M5T": 35,
  "M5V": 38, "M5W": 40, "M5X": 40,
  "M6A": 25, "M6B": 28, "M6C": 30, "M6E": 32, "M6G": 35,
  "M6H": 35, "M6J": 38, "M6K": 40, "M6L": 28, "M6M": 30,
  "M6N": 32, "M6P": 35, "M6R": 38, "M6S": 40,
  "M7A": 35, "M7R": 55, "M7Y": 60,
  "M8V": 50, "M8W": 52, "M8X": 48, "M8Y": 50, "M8Z": 52,
  "M9A": 45, "M9B": 48, "M9C": 50, "M9L": 40, "M9M": 42,
  "M9N": 45, "M9P": 48, "M9R": 50, "M9V": 52, "M9W": 55,
  
  // Surrounding GTA (50-150km) - FREE
  "L0A": 80, "L0B": 90, "L0C": 100, "L0E": 70, "L0G": 60,
  "L0H": 85, "L0J": 90, "L0K": 95, "L0L": 100, "L0M": 110,
  "L0N": 75, "L0P": 80, "L0R": 90, "L0S": 140,
  "L1A": 70, "L1B": 75, "L1C": 80, "L1E": 65, "L1G": 70,
  "L1H": 72, "L1J": 75, "L1K": 78, "L1L": 80, "L1M": 85,
  "L1N": 68, "L1P": 70, "L1R": 75, "L1S": 65, "L1T": 62,
  "L1V": 60, "L1W": 62, "L1X": 65, "L1Y": 68, "L1Z": 70,
  "L2A": 130, "L2E": 135, "L2G": 140, "L2H": 145, "L2J": 150,
  "L2M": 155, "L2N": 150, "L2P": 145, "L2R": 140, "L2S": 135,
  "L2T": 130, "L2V": 125, "L2W": 120,
  "L5A": 50, "L5B": 52, "L5C": 55, "L5E": 58, "L5G": 60,
  "L5H": 55, "L5J": 58, "L5K": 60, "L5L": 55, "L5M": 52,
  "L5N": 50, "L5P": 48, "L5R": 50, "L5S": 52, "L5T": 55,
  "L5V": 58, "L5W": 60,
  "L8E": 75, "L8G": 78, "L8H": 80, "L8J": 82, "L8K": 85,
  "L8L": 88, "L8M": 90, "L8N": 85, "L8P": 82, "L8R": 80,
  "L8S": 78, "L8T": 80, "L8V": 82, "L8W": 85,
  "L9A": 90, "L9B": 95, "L9C": 100, "L9G": 110, "L9H": 115,
  "L9J": 120, "L9K": 95, "L9L": 90, "L9M": 85, "L9N": 80,
  "L9P": 95, "L9R": 100, "L9S": 105, "L9T": 85, "L9V": 90,
  "L9W": 95, "L9Y": 150, "L9Z": 155,
  
  // Southwestern Ontario (150-300km) - FREE
  "N0A": 200, "N0B": 180, "N0C": 250, "N0E": 190, "N0G": 210,
  "N0H": 240, "N0J": 220, "N0K": 200, "N0L": 230, "N0M": 250,
  "N0N": 280, "N0P": 260, "N0R": 270,
  "N1A": 170, "N1C": 175, "N1E": 165, "N1G": 160, "N1H": 155,
  "N1K": 160, "N1L": 165, "N1M": 170, "N1P": 175, "N1R": 180,
  "N1S": 185, "N1T": 190,
  "N2A": 110, "N2B": 115, "N2C": 120, "N2E": 115, "N2G": 110,
  "N2H": 108, "N2J": 112, "N2K": 115, "N2L": 110, "N2M": 108,
  "N2N": 112, "N2P": 115, "N2R": 120, "N2T": 118, "N2V": 115,
  "N3A": 130, "N3B": 135, "N3C": 140, "N3E": 145, "N3H": 150,
  "N3L": 155, "N3P": 160, "N3R": 165, "N3S": 170, "N3T": 175,
  "N3V": 180, "N3W": 185, "N3Y": 190,
  "N4B": 200, "N4G": 210, "N4K": 180, "N4L": 185, "N4N": 190,
  "N4S": 195, "N4T": 200, "N4V": 205, "N4W": 210, "N4X": 215,
  "N4Z": 220,
  "N5A": 200, "N5C": 210, "N5H": 220, "N5L": 215, "N5P": 220,
  "N5R": 225, "N5V": 230, "N5W": 235, "N5X": 240, "N5Y": 245,
  "N5Z": 250,
  "N6A": 200, "N6B": 205, "N6C": 210, "N6E": 215, "N6G": 200,
  "N6H": 205, "N6J": 210, "N6K": 215, "N6L": 220, "N6M": 225,
  "N6N": 230, "N6P": 235,
  "N7A": 250, "N7G": 260, "N7L": 270, "N7M": 280, "N7S": 290,
  "N7T": 295, "N7V": 300, "N7W": 305, "N7X": 310,
  "N8A": 350, "N8H": 340, "N8M": 330, "N8N": 320, "N8P": 310,
  "N8R": 300, "N8S": 295, "N8T": 290, "N8V": 285, "N8W": 280,
  "N8X": 275, "N8Y": 270,
  "N9A": 380, "N9B": 385, "N9C": 390, "N9E": 395, "N9G": 400,
  "N9H": 405, "N9J": 410, "N9K": 415, "N9V": 420, "N9Y": 425,
  
  // Eastern Ontario (150-500km)
  "K0A": 400, "K0B": 450, "K0C": 500, "K0E": 350, "K0G": 380,
  "K0H": 300, "K0J": 420, "K0K": 200, "K0L": 180, "K0M": 250,
  "K1A": 450, "K1B": 445, "K1C": 440, "K1E": 435, "K1G": 430,
  "K1H": 425, "K1J": 420, "K1K": 415, "K1L": 410, "K1M": 405,
  "K1N": 400, "K1P": 450, "K1R": 445, "K1S": 440, "K1T": 435,
  "K1V": 430, "K1W": 460, "K1X": 465, "K1Y": 450, "K1Z": 445,
  "K2A": 455, "K2B": 460, "K2C": 465, "K2E": 470, "K2G": 455,
  "K2H": 450, "K2J": 445, "K2K": 460, "K2L": 465, "K2M": 470,
  "K2P": 450, "K2R": 475, "K2S": 480, "K2T": 485, "K2V": 490,
  "K2W": 495,
  "K4A": 430, "K4B": 480, "K4C": 500, "K4K": 420, "K4M": 440,
  "K4P": 425, "K4R": 480,
  "K6A": 480, "K6H": 500, "K6J": 520, "K6K": 540, "K6T": 500,
  "K6V": 490,
  "K7A": 280, "K7C": 290, "K7G": 260, "K7H": 270, "K7K": 275,
  "K7L": 280, "K7M": 285, "K7N": 290, "K7P": 295, "K7R": 300,
  "K7S": 305, "K7V": 310,
  "K8A": 220, "K8B": 300, "K8H": 280, "K8N": 200, "K8P": 210,
  "K8R": 250, "K8V": 260,
  "K9A": 160, "K9H": 170, "K9J": 165, "K9K": 160, "K9L": 175,
  "K9V": 180,
  
  // Northern Ontario (300-1500km)
  "P0A": 400, "P0B": 450, "P0C": 350, "P0E": 500, "P0G": 550,
  "P0H": 600, "P0J": 700, "P0K": 750, "P0L": 800, "P0M": 400,
  "P0N": 450, "P0P": 900, "P0R": 500, "P0S": 1000, "P0T": 1100,
  "P0V": 1200, "P0W": 1300, "P0X": 1400, "P0Y": 1500,
  "P1A": 350, "P1B": 355, "P1C": 360, "P1H": 400, "P1L": 380,
  "P1P": 390,
  "P2A": 420, "P2B": 450, "P2N": 380,
  "P3A": 400, "P3B": 405, "P3C": 410, "P3E": 400, "P3G": 420,
  "P3L": 430, "P3N": 440, "P3P": 450, "P3Y": 460,
  "P4N": 500, "P4P": 510, "P4R": 520,
  "P5A": 550, "P5E": 560, "P5N": 580,
  "P6A": 450, "P6B": 460, "P6C": 470,
  "P7A": 1400, "P7B": 1410, "P7C": 1420, "P7E": 1430, "P7G": 1440,
  "P7J": 1450, "P7K": 1460, "P7L": 1470,
  "P8N": 800, "P8T": 850,
  "P9A": 900, "P9N": 950,
}

// Delivery pricing tiers (per km after free zone)
const DELIVERY_TIERS = [
  { maxKm: 300, pricePerKm: 0 }, // FREE within 300km
  { maxKm: 499, pricePerKm: 0.70 },
  { maxKm: 999, pricePerKm: 0.75 },
  { maxKm: 2000, pricePerKm: 0.80 },
  { maxKm: 5000, pricePerKm: 0.65 },
]

function normalizePostalCode(postalCode: string): string {
  return postalCode.toUpperCase().replaceAll(/\s/g, "").slice(0, 3)
}

// Out-of-province approximate distances from Richmond Hill
const OUT_OF_PROVINCE_DISTANCES: Record<string, number> = {
  "QC": 550, // Montreal area
  "NS": 1800, // Halifax
  "NB": 1400, // Fredericton
  "PE": 1600, // Charlottetown
  "NL": 2500, // St. John's
  "MB": 2200, // Winnipeg
  "SK": 2800, // Saskatoon
  "AB": 3400, // Calgary
  "BC": 4400, // Vancouver
  "NT": 4500, // Yellowknife
  "YT": 5500, // Whitehorse
  "NU": 3500, // Nunavut
}

function getProvinceFromPostal(fsa: string): string {
  const firstChar = fsa.charAt(0)
  switch (firstChar) {
    case "A": return "NL"
    case "B": return "NS"
    case "C": return "PE"
    case "E": return "NB"
    case "G": case "H": case "J": return "QC"
    case "K": case "L": case "M": case "N": case "P": return "ON"
    case "R": return "MB"
    case "S": return "SK"
    case "T": return "AB"
    case "V": return "BC"
    case "X": return "NT"
    case "Y": return "YT"
    default: return "ON"
  }
}

function getDistanceFromPostalCode(postalCode: string): { distance: number; isEstimate: boolean } {
  const fsa = normalizePostalCode(postalCode)
  const province = getProvinceFromPostal(fsa)
  
  // Check if we have exact distance data
  if (POSTAL_DISTANCES[fsa] !== undefined) {
    return { distance: POSTAL_DISTANCES[fsa], isEstimate: false }
  }
  
  // For out-of-province or unknown Ontario postal codes, use province estimate
  if (province !== "ON") {
    return { distance: OUT_OF_PROVINCE_DISTANCES[province] ?? 2000, isEstimate: true }
  }
  
  // Unknown Ontario postal code - estimate based on first character pattern
  return { distance: 300, isEstimate: true }
}

function calculateDeliveryCost(distanceKm: number): { cost: number; isFree: boolean; distance: number } {
  if (distanceKm <= 300) {
    return { cost: 0, isFree: true, distance: distanceKm }
  }
  
  let cost = 0
  let remainingKm = distanceKm - 300 // Only charge for km beyond 300
  
  // Calculate tiered pricing for km beyond 300
  const paidTiers = DELIVERY_TIERS.filter(t => t.maxKm > 300)
  let lastMaxKm = 300
  
  for (const tier of paidTiers) {
    if (remainingKm <= 0) break
    
    const kmInTier = Math.min(remainingKm, tier.maxKm - lastMaxKm)
    if (kmInTier > 0) {
      cost += kmInTier * tier.pricePerKm
    }
    remainingKm -= kmInTier
    lastMaxKm = tier.maxKm
  }
  
  // Minimum charge $99 for any paid delivery
  cost = Math.max(cost, 99)
  
  return { 
    cost: Math.round(cost * 100) / 100, 
    isFree: false, 
    distance: distanceKm 
  }
}

// GET /api/v1/deliveries/quote?postalCode=M5V1A1
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postalCode = searchParams.get("postalCode")

  if (!postalCode) {
    return NextResponse.json(
      { error: "Postal code is required" },
      { status: 400 }
    )
  }

  // Validate Canadian postal code format
  const cleanPostal = postalCode.toUpperCase().replaceAll(/\s/g, "")
  
  // Must be at least 3 characters and start with valid Canadian province letter
  const validFirstChars = "ABCEGHJKLMNPRSTVXY"
  if (cleanPostal.length < 3 || !validFirstChars.includes(cleanPostal.charAt(0))) {
    return NextResponse.json(
      { error: "Invalid Canadian postal code format" },
      { status: 400 }
    )
  }
  
  // Validate FSA pattern (Letter-Number-Letter)
  const fsaPattern = /^[A-Z]\d[A-Z]/
  if (!fsaPattern.test(cleanPostal)) {
    return NextResponse.json(
      { error: "Invalid postal code format. Expected format: A1A or A1A 1A1" },
      { status: 400 }
    )
  }

  const fsa = cleanPostal.slice(0, 3)
  const province = getProvinceFromPostal(fsa)
  const { distance, isEstimate } = getDistanceFromPostalCode(cleanPostal)
  const { cost, isFree } = calculateDeliveryCost(distance)

  // Check if delivery is available (max 5000km)
  const isDeliveryAvailable = distance <= 5000

  let message: string
  if (!isDeliveryAvailable) {
    message = `Delivery not available to ${province} (${distance}km)`
  } else if (isFree) {
    message = `Free delivery to ${cleanPostal} (estimated ${distance}km from Richmond Hill)`
  } else {
    message = `Estimated delivery fee: $${cost.toFixed(2)} (estimated ${distance}km from Richmond Hill)`
  }

  let ratePerKm: number
  if (distance <= 500) {
    ratePerKm = 0.70
  } else if (distance <= 1000) {
    ratePerKm = 0.75
  } else {
    ratePerKm = 0.80
  }

  return NextResponse.json({
    postalCode: cleanPostal,
    province,
    distanceKm: distance,
    isDistanceEstimate: isEstimate,
    deliveryCost: cost,
    isFreeDelivery: isFree,
    isDeliveryAvailable,
    freeDeliveryThreshold: 300,
    _disclaimer: "Delivery distance and cost are estimates only. Final delivery fees will be confirmed at time of purchase. Contact Planet Motors for an exact quote.",
    message,
    breakdown: isFree ? null : {
      baseDistance: 300,
      chargeableDistance: distance - 300,
      ratePerKm,
    }
  })
}
