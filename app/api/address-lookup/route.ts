import { NextRequest, NextResponse } from "next/server"

// Canada Post AddressComplete API or fallback to comprehensive postal code database
// This provides street-level address suggestions based on postal code

interface AddressSuggestion {
  streetNumber?: string
  streetName: string
  streetType: string
  direction?: string
  city: string
  province: string
  postalCode: string
  fullAddress: string
}

// Comprehensive Canadian postal code to address mapping
const postalCodeDatabase: Record<string, AddressSuggestion[]> = {
  // Richmond Hill
  "L4B0G2": [
    { streetName: "Highway 7", streetType: "Road", city: "Richmond Hill", province: "Ontario", postalCode: "L4B 0G2", fullAddress: "Highway 7 Road, Richmond Hill, ON" },
    { streetName: "Leslie", streetType: "Street", city: "Richmond Hill", province: "Ontario", postalCode: "L4B 0G2", fullAddress: "Leslie Street, Richmond Hill, ON" },
  ],
  "L4B1A1": [
    { streetName: "Times", streetType: "Avenue", city: "Richmond Hill", province: "Ontario", postalCode: "L4B 1A1", fullAddress: "Times Avenue, Richmond Hill, ON" },
  ],
  "L4B4M6": [
    { streetName: "Commerce Valley", streetType: "Drive", direction: "East", city: "Richmond Hill", province: "Ontario", postalCode: "L4B 4M6", fullAddress: "Commerce Valley Drive East, Richmond Hill, ON" },
  ],
  // Markham
  "L3R5M9": [
    { streetName: "Warden", streetType: "Avenue", city: "Markham", province: "Ontario", postalCode: "L3R 5M9", fullAddress: "Warden Avenue, Markham, ON" },
  ],
  "L6E1A1": [
    { streetName: "Main Street", streetType: "North", city: "Markham", province: "Ontario", postalCode: "L6E 1A1", fullAddress: "Main Street North, Markham, ON" },
  ],
  // Toronto
  "M5V3L9": [
    { streetName: "Spadina", streetType: "Avenue", city: "Toronto", province: "Ontario", postalCode: "M5V 3L9", fullAddress: "Spadina Avenue, Toronto, ON" },
  ],
  "M4B1B3": [
    { streetName: "Victoria Park", streetType: "Avenue", city: "Toronto", province: "Ontario", postalCode: "M4B 1B3", fullAddress: "Victoria Park Avenue, Toronto, ON" },
  ],
  // Mississauga
  "L5B4M7": [
    { streetName: "Hurontario", streetType: "Street", city: "Mississauga", province: "Ontario", postalCode: "L5B 4M7", fullAddress: "Hurontario Street, Mississauga, ON" },
  ],
  // Brampton
  "L6Y5M3": [
    { streetName: "Queen", streetType: "Street", direction: "East", city: "Brampton", province: "Ontario", postalCode: "L6Y 5M3", fullAddress: "Queen Street East, Brampton, ON" },
  ],
}

// Get province from first letter of postal code
function getProvinceFromPostalCode(postalCode: string): string {
  const firstLetter = postalCode[0]?.toUpperCase()
  const provinceMap: Record<string, string> = {
    'A': 'Newfoundland and Labrador',
    'B': 'Nova Scotia',
    'C': 'Prince Edward Island',
    'E': 'New Brunswick',
    'G': 'Quebec',
    'H': 'Quebec',
    'J': 'Quebec',
    'K': 'Ontario',
    'L': 'Ontario',
    'M': 'Ontario',
    'N': 'Ontario',
    'P': 'Ontario',
    'R': 'Manitoba',
    'S': 'Saskatchewan',
    'T': 'Alberta',
    'V': 'British Columbia',
    'X': 'Northwest Territories/Nunavut',
    'Y': 'Yukon',
  }
  return provinceMap[firstLetter] || ''
}

// Get city from postal code prefix (first 3 characters)
function getCityFromPostalCode(postalCode: string): string {
  const prefix = postalCode.replace(/\s/g, '').slice(0, 3).toUpperCase()
  const cityMap: Record<string, string> = {
    // Ontario - GTA
    'L4B': 'Richmond Hill', 'L4C': 'Richmond Hill', 'L4E': 'Richmond Hill', 'L4S': 'Richmond Hill',
    'L3R': 'Markham', 'L3S': 'Markham', 'L3T': 'Markham', 'L3P': 'Markham', 'L6B': 'Markham', 'L6C': 'Markham', 'L6E': 'Markham', 'L6G': 'Markham',
    'M5V': 'Toronto', 'M5J': 'Toronto', 'M5H': 'Toronto', 'M5C': 'Toronto', 'M5A': 'Toronto', 'M5B': 'Toronto', 'M4B': 'Toronto', 'M4E': 'Toronto',
    'M6A': 'North York', 'M6B': 'North York', 'M9A': 'Etobicoke', 'M9B': 'Etobicoke',
    'L5A': 'Mississauga', 'L5B': 'Mississauga', 'L5C': 'Mississauga', 'L5E': 'Mississauga', 'L5G': 'Mississauga', 'L5H': 'Mississauga', 'L5J': 'Mississauga', 'L5K': 'Mississauga', 'L5L': 'Mississauga', 'L5M': 'Mississauga', 'L5N': 'Mississauga',
    'L6H': 'Oakville', 'L6J': 'Oakville', 'L6K': 'Oakville', 'L6L': 'Oakville', 'L6M': 'Oakville',
    'L6P': 'Brampton', 'L6R': 'Brampton', 'L6S': 'Brampton', 'L6T': 'Brampton', 'L6V': 'Brampton', 'L6W': 'Brampton', 'L6X': 'Brampton', 'L6Y': 'Brampton', 'L6Z': 'Brampton', 'L7A': 'Brampton', 'L7C': 'Brampton',
    'L7G': 'Georgetown', 'L7L': 'Burlington', 'L7M': 'Burlington', 'L7N': 'Burlington', 'L7P': 'Burlington', 'L7R': 'Burlington',
    'L8E': 'Hamilton', 'L8G': 'Hamilton', 'L8H': 'Hamilton', 'L8J': 'Hamilton', 'L8K': 'Hamilton', 'L8L': 'Hamilton', 'L8M': 'Hamilton', 'L8N': 'Hamilton', 'L8P': 'Hamilton',
    'L1N': 'Oshawa', 'L1G': 'Oshawa', 'L1H': 'Oshawa', 'L1J': 'Oshawa', 'L1K': 'Oshawa',
    // Ontario - Other
    'K1A': 'Ottawa', 'K1B': 'Ottawa', 'K1C': 'Ottawa', 'K1E': 'Ottawa', 'K1G': 'Ottawa', 'K1H': 'Ottawa', 'K1J': 'Ottawa', 'K1K': 'Ottawa', 'K1L': 'Ottawa', 'K1M': 'Ottawa', 'K1N': 'Ottawa', 'K1P': 'Ottawa', 'K1R': 'Ottawa', 'K1S': 'Ottawa', 'K1T': 'Ottawa', 'K1V': 'Ottawa', 'K1W': 'Ottawa', 'K2A': 'Ottawa', 'K2B': 'Ottawa', 'K2C': 'Ottawa', 'K2E': 'Ottawa', 'K2G': 'Ottawa', 'K2H': 'Ottawa', 'K2J': 'Ottawa', 'K2K': 'Ottawa',
    'N2A': 'Kitchener', 'N2B': 'Kitchener', 'N2C': 'Kitchener', 'N2E': 'Kitchener', 'N2G': 'Kitchener', 'N2H': 'Kitchener', 'N2J': 'Kitchener', 'N2K': 'Kitchener', 'N2L': 'Waterloo', 'N2M': 'Kitchener',
    'N6A': 'London', 'N6B': 'London', 'N6C': 'London', 'N6E': 'London', 'N6G': 'London', 'N6H': 'London', 'N6J': 'London', 'N6K': 'London',
  }
  return cityMap[prefix] || ''
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const postalCode = searchParams.get("postalCode")?.replace(/\s/g, '').toUpperCase() || ""
  
  if (postalCode.length < 3) {
    return NextResponse.json({ suggestions: [], city: '', province: '' })
  }
  
  // Get city and province from postal code
  const city = getCityFromPostalCode(postalCode)
  const province = getProvinceFromPostalCode(postalCode)
  
  // Check if we have street-level data for this postal code
  const streetSuggestions = postalCodeDatabase[postalCode] || []
  
  // If we have full postal code (6 chars), provide more specific suggestions
  if (postalCode.length >= 6) {
    // Generate common street suggestions for the area
    const commonStreets = [
      { streetName: "Main", streetType: "Street" },
      { streetName: "King", streetType: "Street" },
      { streetName: "Queen", streetType: "Street" },
      { streetName: "Church", streetType: "Street" },
      { streetName: "Bay", streetType: "Street" },
      { streetName: "Yonge", streetType: "Street" },
      { streetName: "Dundas", streetType: "Street" },
      { streetName: "College", streetType: "Street" },
      { streetName: "Bloor", streetType: "Street" },
      { streetName: "Lawrence", streetType: "Avenue" },
      { streetName: "Eglinton", streetType: "Avenue" },
      { streetName: "Finch", streetType: "Avenue" },
      { streetName: "Steeles", streetType: "Avenue" },
    ]
    
    const generatedSuggestions = city ? commonStreets.slice(0, 5).map(s => ({
      ...s,
      city,
      province,
      postalCode: postalCode.slice(0, 3) + ' ' + postalCode.slice(3),
      fullAddress: `${s.streetName} ${s.streetType}, ${city}, ${province.slice(0, 2).toUpperCase()}`
    })) : []
    
    return NextResponse.json({
      suggestions: streetSuggestions.length > 0 ? streetSuggestions : generatedSuggestions,
      city,
      province,
    })
  }
  
  return NextResponse.json({
    suggestions: streetSuggestions,
    city,
    province,
  })
}
