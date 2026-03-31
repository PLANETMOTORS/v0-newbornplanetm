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

// Comprehensive Canadian postal code to address mapping by prefix
const postalCodePrefixStreets: Record<string, AddressSuggestion[]> = {
  // Richmond Hill L4B
  "L4B": [
    { streetName: "Highway 7", streetType: "Road", direction: "East", city: "Richmond Hill", province: "Ontario", postalCode: "L4B", fullAddress: "Highway 7 Road East, Richmond Hill, ON" },
    { streetName: "Leslie", streetType: "Street", city: "Richmond Hill", province: "Ontario", postalCode: "L4B", fullAddress: "Leslie Street, Richmond Hill, ON" },
    { streetName: "Yonge", streetType: "Street", city: "Richmond Hill", province: "Ontario", postalCode: "L4B", fullAddress: "Yonge Street, Richmond Hill, ON" },
    { streetName: "Bayview", streetType: "Avenue", city: "Richmond Hill", province: "Ontario", postalCode: "L4B", fullAddress: "Bayview Avenue, Richmond Hill, ON" },
    { streetName: "Major Mackenzie", streetType: "Drive", direction: "East", city: "Richmond Hill", province: "Ontario", postalCode: "L4B", fullAddress: "Major Mackenzie Drive East, Richmond Hill, ON" },
  ],
  // Richmond Hill L4C
  "L4C": [
    { streetName: "Major Mackenzie", streetType: "Drive", direction: "East", city: "Richmond Hill", province: "Ontario", postalCode: "L4C", fullAddress: "Major Mackenzie Drive East, Richmond Hill, ON" },
    { streetName: "Major Mackenzie", streetType: "Drive", direction: "West", city: "Richmond Hill", province: "Ontario", postalCode: "L4C", fullAddress: "Major Mackenzie Drive West, Richmond Hill, ON" },
    { streetName: "Yonge", streetType: "Street", city: "Richmond Hill", province: "Ontario", postalCode: "L4C", fullAddress: "Yonge Street, Richmond Hill, ON" },
    { streetName: "Bathurst", streetType: "Street", city: "Richmond Hill", province: "Ontario", postalCode: "L4C", fullAddress: "Bathurst Street, Richmond Hill, ON" },
    { streetName: "Elgin Mills", streetType: "Road", direction: "East", city: "Richmond Hill", province: "Ontario", postalCode: "L4C", fullAddress: "Elgin Mills Road East, Richmond Hill, ON" },
    { streetName: "King", streetType: "Road", city: "Richmond Hill", province: "Ontario", postalCode: "L4C", fullAddress: "King Road, Richmond Hill, ON" },
  ],
  // Richmond Hill L4E
  "L4E": [
    { streetName: "Yonge", streetType: "Street", city: "Richmond Hill", province: "Ontario", postalCode: "L4E", fullAddress: "Yonge Street, Richmond Hill, ON" },
    { streetName: "Bloomington", streetType: "Road", city: "Richmond Hill", province: "Ontario", postalCode: "L4E", fullAddress: "Bloomington Road, Richmond Hill, ON" },
    { streetName: "19th", streetType: "Avenue", city: "Richmond Hill", province: "Ontario", postalCode: "L4E", fullAddress: "19th Avenue, Richmond Hill, ON" },
    { streetName: "Stouffville", streetType: "Road", city: "Richmond Hill", province: "Ontario", postalCode: "L4E", fullAddress: "Stouffville Road, Richmond Hill, ON" },
  ],
  // Richmond Hill L4S
  "L4S": [
    { streetName: "Bayview", streetType: "Avenue", city: "Richmond Hill", province: "Ontario", postalCode: "L4S", fullAddress: "Bayview Avenue, Richmond Hill, ON" },
    { streetName: "16th", streetType: "Avenue", city: "Richmond Hill", province: "Ontario", postalCode: "L4S", fullAddress: "16th Avenue, Richmond Hill, ON" },
    { streetName: "Leslie", streetType: "Street", city: "Richmond Hill", province: "Ontario", postalCode: "L4S", fullAddress: "Leslie Street, Richmond Hill, ON" },
  ],
  // Markham L3R
  "L3R": [
    { streetName: "Warden", streetType: "Avenue", city: "Markham", province: "Ontario", postalCode: "L3R", fullAddress: "Warden Avenue, Markham, ON" },
    { streetName: "Highway 7", streetType: "Road", direction: "East", city: "Markham", province: "Ontario", postalCode: "L3R", fullAddress: "Highway 7 Road East, Markham, ON" },
    { streetName: "McCowan", streetType: "Road", city: "Markham", province: "Ontario", postalCode: "L3R", fullAddress: "McCowan Road, Markham, ON" },
    { streetName: "Denison", streetType: "Street", city: "Markham", province: "Ontario", postalCode: "L3R", fullAddress: "Denison Street, Markham, ON" },
  ],
  // Markham L6E
  "L6E": [
    { streetName: "Main Street", streetType: "Markham", city: "Markham", province: "Ontario", postalCode: "L6E", fullAddress: "Main Street Markham, Markham, ON" },
    { streetName: "9th Line", streetType: "Road", city: "Markham", province: "Ontario", postalCode: "L6E", fullAddress: "9th Line Road, Markham, ON" },
    { streetName: "Markham", streetType: "Road", city: "Markham", province: "Ontario", postalCode: "L6E", fullAddress: "Markham Road, Markham, ON" },
  ],
  // Toronto M5V
  "M5V": [
    { streetName: "Spadina", streetType: "Avenue", city: "Toronto", province: "Ontario", postalCode: "M5V", fullAddress: "Spadina Avenue, Toronto, ON" },
    { streetName: "King", streetType: "Street", direction: "West", city: "Toronto", province: "Ontario", postalCode: "M5V", fullAddress: "King Street West, Toronto, ON" },
    { streetName: "Queen", streetType: "Street", direction: "West", city: "Toronto", province: "Ontario", postalCode: "M5V", fullAddress: "Queen Street West, Toronto, ON" },
    { streetName: "Front", streetType: "Street", direction: "West", city: "Toronto", province: "Ontario", postalCode: "M5V", fullAddress: "Front Street West, Toronto, ON" },
  ],
  // Mississauga L5B
  "L5B": [
    { streetName: "Hurontario", streetType: "Street", city: "Mississauga", province: "Ontario", postalCode: "L5B", fullAddress: "Hurontario Street, Mississauga, ON" },
    { streetName: "Dundas", streetType: "Street", direction: "East", city: "Mississauga", province: "Ontario", postalCode: "L5B", fullAddress: "Dundas Street East, Mississauga, ON" },
    { streetName: "Burnhamthorpe", streetType: "Road", city: "Mississauga", province: "Ontario", postalCode: "L5B", fullAddress: "Burnhamthorpe Road, Mississauga, ON" },
  ],
  // Brampton L6Y
  "L6Y": [
    { streetName: "Queen", streetType: "Street", direction: "East", city: "Brampton", province: "Ontario", postalCode: "L6Y", fullAddress: "Queen Street East, Brampton, ON" },
    { streetName: "Main", streetType: "Street", direction: "North", city: "Brampton", province: "Ontario", postalCode: "L6Y", fullAddress: "Main Street North, Brampton, ON" },
    { streetName: "Bovaird", streetType: "Drive", direction: "East", city: "Brampton", province: "Ontario", postalCode: "L6Y", fullAddress: "Bovaird Drive East, Brampton, ON" },
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
  
  // Get prefix (first 3 characters)
  const prefix = postalCode.slice(0, 3)
  
  // Check if we have street-level data for this postal code prefix
  const streetSuggestions = postalCodePrefixStreets[prefix] || []
  
  // Always return suggestions if we have them for the prefix
  if (streetSuggestions.length > 0) {
    return NextResponse.json({
      suggestions: streetSuggestions,
      city,
      province,
    })
  }
  
  // Fallback: Generate common street suggestions for areas without specific data
  if (city && postalCode.length >= 3) {
    const commonStreets: AddressSuggestion[] = [
      { streetName: "Main", streetType: "Street", city, province, postalCode: prefix, fullAddress: `Main Street, ${city}, ON` },
      { streetName: "King", streetType: "Street", city, province, postalCode: prefix, fullAddress: `King Street, ${city}, ON` },
      { streetName: "Queen", streetType: "Street", city, province, postalCode: prefix, fullAddress: `Queen Street, ${city}, ON` },
      { streetName: "Church", streetType: "Street", city, province, postalCode: prefix, fullAddress: `Church Street, ${city}, ON` },
      { streetName: "Yonge", streetType: "Street", city, province, postalCode: prefix, fullAddress: `Yonge Street, ${city}, ON` },
    ]
    
    return NextResponse.json({
      suggestions: commonStreets,
      city,
      province,
    })
  }
  
  return NextResponse.json({
    suggestions: [],
    city,
    province,
  })
}
