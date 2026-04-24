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
  const prefix = postalCode.replaceAll(/\s/g, '').slice(0, 3).toUpperCase()
  const cityMap: Record<string, string> = {
    // Ontario - GTA
    'L4B': 'Richmond Hill', 'L4C': 'Richmond Hill', 'L4E': 'Richmond Hill', 'L4S': 'Richmond Hill',
    'L3R': 'Markham', 'L3S': 'Markham', 'L3T': 'Markham', 'L3P': 'Markham', 'L6B': 'Markham', 'L6C': 'Markham', 'L6E': 'Markham', 'L6G': 'Markham',
    'M1B': 'Scarborough', 'M1C': 'Scarborough', 'M1E': 'Scarborough', 'M1G': 'Scarborough', 'M1H': 'Scarborough', 'M1J': 'Scarborough', 'M1K': 'Scarborough', 'M1L': 'Scarborough', 'M1M': 'Scarborough', 'M1N': 'Scarborough', 'M1P': 'Scarborough', 'M1R': 'Scarborough', 'M1S': 'Scarborough', 'M1T': 'Scarborough', 'M1V': 'Scarborough', 'M1W': 'Scarborough', 'M1X': 'Scarborough',
    'M2H': 'North York', 'M2J': 'North York', 'M2K': 'North York', 'M2L': 'North York', 'M2M': 'North York', 'M2N': 'North York', 'M2P': 'North York', 'M2R': 'North York', 'M3A': 'North York', 'M3B': 'North York', 'M3C': 'North York', 'M3H': 'North York', 'M3J': 'North York', 'M3K': 'North York', 'M3L': 'North York', 'M3M': 'North York', 'M3N': 'North York',
    'M4A': 'Toronto', 'M4B': 'Toronto', 'M4C': 'Toronto', 'M4E': 'Toronto', 'M4G': 'Toronto', 'M4H': 'Toronto', 'M4J': 'Toronto', 'M4K': 'Toronto', 'M4L': 'Toronto', 'M4M': 'Toronto', 'M4N': 'Toronto', 'M4P': 'Toronto', 'M4R': 'Toronto', 'M4S': 'Toronto', 'M4T': 'Toronto', 'M4V': 'Toronto', 'M4W': 'Toronto', 'M4X': 'Toronto', 'M4Y': 'Toronto',
    'M5A': 'Toronto', 'M5B': 'Toronto', 'M5C': 'Toronto', 'M5E': 'Toronto', 'M5G': 'Toronto', 'M5H': 'Toronto', 'M5J': 'Toronto', 'M5K': 'Toronto', 'M5L': 'Toronto', 'M5M': 'Toronto', 'M5N': 'Toronto', 'M5P': 'Toronto', 'M5R': 'Toronto', 'M5S': 'Toronto', 'M5T': 'Toronto', 'M5V': 'Toronto', 'M5W': 'Toronto', 'M5X': 'Toronto',
    'M6A': 'North York', 'M6B': 'North York', 'M6C': 'Toronto', 'M6E': 'Toronto', 'M6G': 'Toronto', 'M6H': 'Toronto', 'M6J': 'Toronto', 'M6K': 'Toronto', 'M6L': 'North York', 'M6M': 'Toronto', 'M6N': 'Toronto', 'M6P': 'Toronto', 'M6R': 'Toronto', 'M6S': 'Toronto',
    'M8V': 'Etobicoke', 'M8W': 'Etobicoke', 'M8X': 'Etobicoke', 'M8Y': 'Etobicoke', 'M8Z': 'Etobicoke', 'M9A': 'Etobicoke', 'M9B': 'Etobicoke', 'M9C': 'Etobicoke', 'M9L': 'North York', 'M9M': 'North York', 'M9N': 'Toronto', 'M9P': 'Etobicoke', 'M9R': 'Etobicoke', 'M9V': 'Etobicoke', 'M9W': 'Etobicoke',
    'L1S': 'Ajax', 'L1T': 'Ajax', 'L1Z': 'Ajax',
    'L1C': 'Whitby', 'L1M': 'Whitby', 'L1N': 'Oshawa', 'L1G': 'Oshawa', 'L1H': 'Oshawa', 'L1J': 'Oshawa', 'L1K': 'Oshawa', 'L1L': 'Oshawa',
    'L1P': 'Pickering', 'L1V': 'Pickering', 'L1W': 'Pickering', 'L1X': 'Pickering', 'L1Y': 'Pickering',
    'L3Y': 'Newmarket', 'L3X': 'Newmarket',
    'L4G': 'Aurora', 'L4H': 'Vaughan', 'L4J': 'Vaughan', 'L4K': 'Vaughan', 'L4L': 'Vaughan',
    'L5A': 'Mississauga', 'L5B': 'Mississauga', 'L5C': 'Mississauga', 'L5E': 'Mississauga', 'L5G': 'Mississauga', 'L5H': 'Mississauga', 'L5J': 'Mississauga', 'L5K': 'Mississauga', 'L5L': 'Mississauga', 'L5M': 'Mississauga', 'L5N': 'Mississauga', 'L5P': 'Mississauga', 'L5R': 'Mississauga', 'L5S': 'Mississauga', 'L5T': 'Mississauga', 'L5V': 'Mississauga', 'L5W': 'Mississauga',
    'L6H': 'Oakville', 'L6J': 'Oakville', 'L6K': 'Oakville', 'L6L': 'Oakville', 'L6M': 'Oakville',
    'L6P': 'Brampton', 'L6R': 'Brampton', 'L6S': 'Brampton', 'L6T': 'Brampton', 'L6V': 'Brampton', 'L6W': 'Brampton', 'L6X': 'Brampton', 'L6Y': 'Brampton', 'L6Z': 'Brampton', 'L7A': 'Brampton', 'L7C': 'Brampton',
    'L7G': 'Georgetown', 'L7L': 'Burlington', 'L7M': 'Burlington', 'L7N': 'Burlington', 'L7P': 'Burlington', 'L7R': 'Burlington', 'L7S': 'Burlington', 'L7T': 'Burlington',
    'L8E': 'Hamilton', 'L8G': 'Hamilton', 'L8H': 'Hamilton', 'L8J': 'Hamilton', 'L8K': 'Hamilton', 'L8L': 'Hamilton', 'L8M': 'Hamilton', 'L8N': 'Hamilton', 'L8P': 'Hamilton', 'L8R': 'Hamilton', 'L8S': 'Hamilton', 'L8T': 'Hamilton', 'L8V': 'Hamilton', 'L8W': 'Hamilton', 'L9A': 'Hamilton', 'L9B': 'Hamilton', 'L9C': 'Hamilton', 'L9G': 'Hamilton', 'L9H': 'Hamilton', 'L9K': 'Milton',
    // Ontario - Other
    'K1A': 'Ottawa', 'K1B': 'Ottawa', 'K1C': 'Ottawa', 'K1E': 'Ottawa', 'K1G': 'Ottawa', 'K1H': 'Ottawa', 'K1J': 'Ottawa', 'K1K': 'Ottawa', 'K1L': 'Ottawa', 'K1M': 'Ottawa', 'K1N': 'Ottawa', 'K1P': 'Ottawa', 'K1R': 'Ottawa', 'K1S': 'Ottawa', 'K1T': 'Ottawa', 'K1V': 'Ottawa', 'K1W': 'Ottawa', 'K1X': 'Ottawa', 'K1Y': 'Ottawa', 'K1Z': 'Ottawa', 'K2A': 'Ottawa', 'K2B': 'Ottawa', 'K2C': 'Ottawa', 'K2E': 'Ottawa', 'K2G': 'Ottawa', 'K2H': 'Ottawa', 'K2J': 'Ottawa', 'K2K': 'Ottawa', 'K2L': 'Ottawa', 'K2M': 'Ottawa', 'K2P': 'Ottawa', 'K2R': 'Ottawa', 'K2S': 'Ottawa', 'K2T': 'Ottawa', 'K2V': 'Ottawa', 'K2W': 'Ottawa', 'K4A': 'Ottawa', 'K4B': 'Ottawa', 'K4C': 'Ottawa', 'K4K': 'Ottawa', 'K4M': 'Ottawa', 'K4P': 'Ottawa', 'K4R': 'Ottawa',
    'K7A': 'Belleville', 'K7G': 'Trenton', 'K7K': 'Kingston', 'K7L': 'Kingston', 'K7M': 'Kingston', 'K7N': 'Kingston', 'K7P': 'Kingston',
    'K8A': 'Campbellford', 'K8N': 'Cobourg', 'K8P': 'Cobourg', 'K8V': 'Peterborough', 'K9H': 'Peterborough', 'K9J': 'Peterborough', 'K9K': 'Peterborough', 'K9L': 'Peterborough',
    'N1E': 'Guelph', 'N1G': 'Guelph', 'N1H': 'Guelph', 'N1K': 'Guelph', 'N1L': 'Guelph',
    'N2A': 'Kitchener', 'N2B': 'Kitchener', 'N2C': 'Kitchener', 'N2E': 'Kitchener', 'N2G': 'Kitchener', 'N2H': 'Kitchener', 'N2J': 'Kitchener', 'N2K': 'Kitchener', 'N2L': 'Waterloo', 'N2M': 'Kitchener', 'N2N': 'Kitchener', 'N2P': 'Kitchener', 'N2R': 'Kitchener', 'N2T': 'Kitchener', 'N2V': 'Waterloo',
    'N3H': 'Cambridge', 'N3C': 'Cambridge', 'N1R': 'Cambridge', 'N1S': 'Cambridge', 'N1T': 'Cambridge',
    'N5A': 'Woodstock', 'N4S': 'Woodstock',
    'N6A': 'London', 'N6B': 'London', 'N6C': 'London', 'N6E': 'London', 'N6G': 'London', 'N6H': 'London', 'N6J': 'London', 'N6K': 'London', 'N6L': 'London', 'N6M': 'London', 'N6N': 'London', 'N6P': 'London',
    'N7A': 'Stratford', 'N7G': 'Stratford',
    'N8H': 'Leamington', 'N8N': 'Windsor', 'N8P': 'Windsor', 'N8R': 'Windsor', 'N8S': 'Windsor', 'N8T': 'Windsor', 'N8W': 'Windsor', 'N8X': 'Windsor', 'N8Y': 'Windsor', 'N9A': 'Windsor', 'N9B': 'Windsor', 'N9C': 'Windsor', 'N9E': 'Windsor', 'N9G': 'Windsor', 'N9H': 'Windsor', 'N9J': 'Windsor', 'N9K': 'Windsor', 'N9V': 'Windsor', 'N9Y': 'Amherstburg',
    'P1A': 'North Bay', 'P1B': 'North Bay', 'P1C': 'North Bay',
    'P3A': 'Sudbury', 'P3B': 'Sudbury', 'P3C': 'Sudbury', 'P3E': 'Sudbury', 'P3G': 'Sudbury', 'P3L': 'Sudbury', 'P3N': 'Sudbury', 'P3P': 'Sudbury', 'P3Y': 'Sudbury',
    'P6A': 'Sault Ste. Marie', 'P6B': 'Sault Ste. Marie', 'P6C': 'Sault Ste. Marie',
    'P7A': 'Thunder Bay', 'P7B': 'Thunder Bay', 'P7C': 'Thunder Bay', 'P7E': 'Thunder Bay', 'P7G': 'Thunder Bay', 'P7J': 'Thunder Bay', 'P7K': 'Thunder Bay',
    // Alberta
    'T1X': 'Chestermere', 'T1Y': 'Calgary', 'T2A': 'Calgary', 'T2B': 'Calgary', 'T2C': 'Calgary', 'T2E': 'Calgary', 'T2G': 'Calgary', 'T2H': 'Calgary', 'T2J': 'Calgary', 'T2K': 'Calgary', 'T2L': 'Calgary', 'T2M': 'Calgary', 'T2N': 'Calgary', 'T2P': 'Calgary', 'T2R': 'Calgary', 'T2S': 'Calgary', 'T2T': 'Calgary', 'T2V': 'Calgary', 'T2W': 'Calgary', 'T2X': 'Calgary', 'T2Y': 'Calgary', 'T2Z': 'Calgary', 'T3A': 'Calgary', 'T3B': 'Calgary', 'T3C': 'Calgary', 'T3E': 'Calgary', 'T3G': 'Calgary', 'T3H': 'Calgary', 'T3J': 'Calgary', 'T3K': 'Calgary', 'T3L': 'Calgary', 'T3M': 'Calgary', 'T3N': 'Calgary', 'T3P': 'Calgary', 'T3R': 'Calgary', 'T3S': 'Calgary', 'T3Z': 'Calgary',
    'T5A': 'Edmonton', 'T5B': 'Edmonton', 'T5C': 'Edmonton', 'T5E': 'Edmonton', 'T5G': 'Edmonton', 'T5H': 'Edmonton', 'T5J': 'Edmonton', 'T5K': 'Edmonton', 'T5L': 'Edmonton', 'T5M': 'Edmonton', 'T5N': 'Edmonton', 'T5P': 'Edmonton', 'T5R': 'Edmonton', 'T5S': 'Edmonton', 'T5T': 'Edmonton', 'T5V': 'Edmonton', 'T5W': 'Edmonton', 'T5X': 'Edmonton', 'T5Y': 'Edmonton', 'T5Z': 'Edmonton', 'T6A': 'Edmonton', 'T6B': 'Edmonton', 'T6C': 'Edmonton', 'T6E': 'Edmonton', 'T6G': 'Edmonton', 'T6H': 'Edmonton', 'T6J': 'Edmonton', 'T6K': 'Edmonton', 'T6L': 'Edmonton', 'T6M': 'Edmonton', 'T6N': 'Edmonton', 'T6P': 'Edmonton', 'T6R': 'Edmonton', 'T6S': 'Edmonton', 'T6T': 'Edmonton', 'T6V': 'Edmonton', 'T6W': 'Edmonton', 'T6X': 'Edmonton',
    'T4B': 'Red Deer', 'T4E': 'Red Deer', 'T4N': 'Red Deer', 'T4P': 'Red Deer', 'T4R': 'Red Deer',
    'T1H': 'Lethbridge', 'T1J': 'Lethbridge', 'T1K': 'Lethbridge',
    'T8N': 'St. Albert', 'T8T': 'Spruce Grove', 'T8V': 'Sherwood Park', 'T8A': 'Sherwood Park', 'T8B': 'Sherwood Park', 'T8C': 'Sherwood Park', 'T8E': 'Sherwood Park', 'T8G': 'Sherwood Park', 'T8H': 'Sherwood Park',
    // British Columbia
    'V5A': 'Burnaby', 'V5B': 'Burnaby', 'V5C': 'Burnaby', 'V5E': 'Burnaby', 'V5G': 'Burnaby', 'V5H': 'Burnaby', 'V5J': 'Burnaby', 'V3N': 'Burnaby', 'V3J': 'Burnaby',
    'V6A': 'Vancouver', 'V6B': 'Vancouver', 'V6C': 'Vancouver', 'V6E': 'Vancouver', 'V6G': 'Vancouver', 'V6H': 'Vancouver', 'V6J': 'Vancouver', 'V6K': 'Vancouver', 'V6L': 'Vancouver', 'V6M': 'Vancouver', 'V6N': 'Vancouver', 'V6P': 'Vancouver', 'V6R': 'Vancouver', 'V6S': 'Vancouver', 'V6T': 'Vancouver', 'V6Z': 'Vancouver', 'V5K': 'Vancouver', 'V5L': 'Vancouver', 'V5M': 'Vancouver', 'V5N': 'Vancouver', 'V5P': 'Vancouver', 'V5R': 'Vancouver', 'V5S': 'Vancouver', 'V5T': 'Vancouver', 'V5V': 'Vancouver', 'V5W': 'Vancouver', 'V5X': 'Vancouver', 'V5Y': 'Vancouver', 'V5Z': 'Vancouver',
    'V3H': 'Port Moody', 'V3K': 'New Westminster', 'V3L': 'New Westminster', 'V3M': 'New Westminster',
    'V3R': 'Surrey', 'V3S': 'Surrey', 'V3T': 'Surrey', 'V3V': 'Surrey', 'V3W': 'Surrey', 'V3X': 'Surrey', 'V4A': 'Surrey', 'V4N': 'Surrey', 'V4P': 'Surrey',
    'V7A': 'Richmond', 'V7B': 'Richmond', 'V7C': 'Richmond', 'V7E': 'Richmond', 'V6V': 'Richmond', 'V6W': 'Richmond', 'V6X': 'Richmond', 'V6Y': 'Richmond',
    'V1V': 'Kelowna', 'V1W': 'Kelowna', 'V1X': 'Kelowna', 'V1Y': 'Kelowna', 'V2A': 'Penticton',
    'V2B': 'Kamloops', 'V2C': 'Kamloops', 'V2E': 'Kamloops', 'V2H': 'Kamloops',
    'V8N': 'Victoria', 'V8P': 'Victoria', 'V8R': 'Victoria', 'V8S': 'Victoria', 'V8T': 'Victoria', 'V8V': 'Victoria', 'V8W': 'Victoria', 'V8X': 'Victoria', 'V8Z': 'Victoria', 'V9A': 'Victoria', 'V9B': 'Victoria',
    'V2S': 'Abbotsford', 'V2T': 'Abbotsford', 'V3G': 'Abbotsford',
    'V3A': 'Langley', 'V3E': 'Port Coquitlam',
    'V7G': 'North Vancouver', 'V7H': 'North Vancouver', 'V7J': 'North Vancouver', 'V7K': 'North Vancouver', 'V7L': 'North Vancouver', 'V7M': 'North Vancouver', 'V7N': 'North Vancouver', 'V7P': 'North Vancouver', 'V7R': 'North Vancouver', 'V7S': 'West Vancouver', 'V7T': 'West Vancouver', 'V7V': 'West Vancouver', 'V7W': 'West Vancouver',
    'V2G': 'Prince George', 'V2K': 'Prince George', 'V2L': 'Prince George', 'V2M': 'Prince George', 'V2N': 'Prince George',
    // Quebec
    'H1A': 'Montreal', 'H1B': 'Montreal', 'H1C': 'Montreal', 'H1E': 'Montreal', 'H1G': 'Montreal', 'H1H': 'Montreal', 'H1J': 'Montreal', 'H1K': 'Montreal', 'H1L': 'Montreal', 'H1M': 'Montreal', 'H1N': 'Montreal', 'H1P': 'Montreal', 'H1R': 'Montreal', 'H1S': 'Montreal', 'H1T': 'Montreal', 'H1V': 'Montreal', 'H1W': 'Montreal', 'H1X': 'Montreal', 'H1Y': 'Montreal', 'H1Z': 'Montreal',
    'H2A': 'Montreal', 'H2B': 'Montreal', 'H2C': 'Montreal', 'H2E': 'Montreal', 'H2G': 'Montreal', 'H2H': 'Montreal', 'H2J': 'Montreal', 'H2K': 'Montreal', 'H2L': 'Montreal', 'H2M': 'Montreal', 'H2N': 'Montreal', 'H2P': 'Montreal', 'H2R': 'Montreal', 'H2S': 'Montreal', 'H2T': 'Montreal', 'H2V': 'Montreal', 'H2W': 'Montreal', 'H2X': 'Montreal', 'H2Y': 'Montreal', 'H2Z': 'Montreal',
    'H3A': 'Montreal', 'H3B': 'Montreal', 'H3C': 'Montreal', 'H3E': 'Montreal', 'H3G': 'Montreal', 'H3H': 'Montreal', 'H3J': 'Montreal', 'H3K': 'Montreal', 'H3L': 'Montreal', 'H3M': 'Montreal', 'H3N': 'Montreal', 'H3P': 'Montreal', 'H3R': 'Montreal', 'H3S': 'Montreal', 'H3T': 'Montreal', 'H3V': 'Montreal', 'H3W': 'Montreal', 'H3X': 'Montreal', 'H3Y': 'Montreal', 'H3Z': 'Montreal',
    'H4A': 'Montreal', 'H4B': 'Montreal', 'H4C': 'Montreal', 'H4E': 'Montreal', 'H4G': 'Montreal', 'H4H': 'Montreal', 'H4J': 'Montreal', 'H4K': 'Montreal', 'H4L': 'Montreal', 'H4M': 'Montreal', 'H4N': 'Montreal', 'H4P': 'Montreal', 'H4R': 'Montreal', 'H4S': 'Montreal', 'H4T': 'Montreal', 'H4V': 'Montreal', 'H4W': 'Montreal', 'H4X': 'Montreal', 'H4Y': 'Montreal', 'H4Z': 'Montreal',
    'H7A': 'Laval', 'H7B': 'Laval', 'H7C': 'Laval', 'H7E': 'Laval', 'H7G': 'Laval', 'H7H': 'Laval', 'H7J': 'Laval', 'H7K': 'Laval', 'H7L': 'Laval', 'H7M': 'Laval', 'H7N': 'Laval', 'H7P': 'Laval', 'H7R': 'Laval', 'H7S': 'Laval', 'H7T': 'Laval', 'H7V': 'Laval', 'H7W': 'Laval', 'H7X': 'Laval', 'H7Y': 'Laval',
    'G1A': 'Quebec City', 'G1B': 'Quebec City', 'G1C': 'Quebec City', 'G1E': 'Quebec City', 'G1G': 'Quebec City', 'G1H': 'Quebec City', 'G1J': 'Quebec City', 'G1K': 'Quebec City', 'G1L': 'Quebec City', 'G1M': 'Quebec City', 'G1N': 'Quebec City', 'G1P': 'Quebec City', 'G1R': 'Quebec City', 'G1S': 'Quebec City', 'G1T': 'Quebec City', 'G1V': 'Quebec City', 'G1W': 'Quebec City', 'G1X': 'Quebec City',
    'J3Y': 'Saint-Hubert', 'J3Z': 'Brossard', 'J4B': 'Brossard', 'J4G': 'Longueuil', 'J4H': 'Longueuil', 'J4J': 'Longueuil', 'J4K': 'Longueuil', 'J4L': 'Longueuil', 'J4N': 'Longueuil', 'J4P': 'Longueuil', 'J4R': 'Longueuil', 'J4S': 'Longueuil', 'J4T': 'Longueuil', 'J4V': 'Longueuil', 'J4W': 'Longueuil', 'J4X': 'Longueuil',
    'J7A': 'Terrebonne', 'J6W': 'Terrebonne', 'J6X': 'Terrebonne', 'J6Y': 'Terrebonne', 'J6Z': 'Terrebonne',
    // Manitoba
    'R2C': 'Winnipeg', 'R2E': 'Winnipeg', 'R2G': 'Winnipeg', 'R2H': 'Winnipeg', 'R2J': 'Winnipeg', 'R2K': 'Winnipeg', 'R2L': 'Winnipeg', 'R2M': 'Winnipeg', 'R2N': 'Winnipeg', 'R2P': 'Winnipeg', 'R2R': 'Winnipeg', 'R2V': 'Winnipeg', 'R2W': 'Winnipeg', 'R2X': 'Winnipeg', 'R2Y': 'Winnipeg', 'R3A': 'Winnipeg', 'R3B': 'Winnipeg', 'R3C': 'Winnipeg', 'R3E': 'Winnipeg', 'R3G': 'Winnipeg', 'R3H': 'Winnipeg', 'R3J': 'Winnipeg', 'R3K': 'Winnipeg', 'R3L': 'Winnipeg', 'R3M': 'Winnipeg', 'R3N': 'Winnipeg', 'R3P': 'Winnipeg', 'R3R': 'Winnipeg', 'R3S': 'Winnipeg', 'R3T': 'Winnipeg', 'R3V': 'Winnipeg', 'R3W': 'Winnipeg', 'R3X': 'Winnipeg', 'R3Y': 'Winnipeg',
    // Saskatchewan
    'S4L': 'Regina', 'S4N': 'Regina', 'S4P': 'Regina', 'S4R': 'Regina', 'S4S': 'Regina', 'S4T': 'Regina', 'S4V': 'Regina', 'S4W': 'Regina', 'S4X': 'Regina', 'S4Y': 'Regina', 'S4Z': 'Regina',
    'S7H': 'Saskatoon', 'S7J': 'Saskatoon', 'S7K': 'Saskatoon', 'S7L': 'Saskatoon', 'S7M': 'Saskatoon', 'S7N': 'Saskatoon', 'S7P': 'Saskatoon', 'S7R': 'Saskatoon', 'S7S': 'Saskatoon', 'S7T': 'Saskatoon', 'S7V': 'Saskatoon', 'S7W': 'Saskatoon',
    // Atlantic
    'E1A': 'Moncton', 'E1B': 'Moncton', 'E1C': 'Moncton', 'E1E': 'Moncton', 'E1G': 'Moncton', 'E1H': 'Moncton',
    'E2E': 'Fredericton', 'E2G': 'Fredericton', 'E3A': 'Fredericton', 'E3B': 'Fredericton', 'E3C': 'Fredericton',
    'E2K': 'Saint John', 'E2L': 'Saint John', 'E2M': 'Saint John', 'E2N': 'Saint John',
    'B2T': 'Dartmouth', 'B2V': 'Dartmouth', 'B2W': 'Dartmouth', 'B2X': 'Dartmouth', 'B2Y': 'Dartmouth', 'B2Z': 'Dartmouth',
    'B3A': 'Halifax', 'B3B': 'Halifax', 'B3E': 'Halifax', 'B3G': 'Halifax', 'B3H': 'Halifax', 'B3J': 'Halifax', 'B3K': 'Halifax', 'B3L': 'Halifax', 'B3M': 'Halifax', 'B3N': 'Halifax', 'B3P': 'Halifax', 'B3R': 'Halifax', 'B3S': 'Halifax', 'B3T': 'Halifax', 'B3V': 'Halifax',
    'C1A': 'Charlottetown', 'C1B': 'Charlottetown', 'C1C': 'Charlottetown', 'C1E': 'Charlottetown',
    'A1A': 'St. John\'s', 'A1B': 'St. John\'s', 'A1C': 'St. John\'s', 'A1E': 'St. John\'s', 'A1G': 'St. John\'s', 'A1H': 'St. John\'s', 'A1K': 'St. John\'s', 'A1M': 'St. John\'s', 'A1N': 'St. John\'s', 'A1S': 'St. John\'s', 'A1V': 'St. John\'s', 'A1W': 'St. John\'s',
  }
  return cityMap[prefix] || ''
}

const PROV_ABBR_TO_NAME: Record<string, string> = {
  'ON': 'Ontario', 'QC': 'Quebec', 'BC': 'British Columbia',
  'AB': 'Alberta', 'SK': 'Saskatchewan', 'MB': 'Manitoba',
  'NB': 'New Brunswick', 'NS': 'Nova Scotia', 'PE': 'Prince Edward Island',
  'NL': 'Newfoundland and Labrador', 'NT': 'Northwest Territories',
  'NU': 'Nunavut', 'YT': 'Yukon',
}

// Fallback: look up city/province via geocoder.ca when local map has no match
async function lookupPostalCodeOnline(postalCode: string): Promise<{ city: string; province: string; street?: string } | null> {
  try {
    const clean = postalCode.replaceAll(/\s/g, '').toUpperCase()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3s timeout
    const response = await fetch(
      `https://geocoder.ca/?postal=${clean}&json=1`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!response.ok) return null
    const data = await response.json()
    if (data.standard?.city && data.standard?.prov) {
      return {
        city: data.standard.city,
        province: PROV_ABBR_TO_NAME[data.standard.prov] || data.standard.prov,
        street: typeof data.standard?.staddress === 'string' ? data.standard.staddress : undefined,
      }
    }
    return null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const postalCode = searchParams.get("postalCode")?.replaceAll(/\s/g, '').toUpperCase() || ""

  if (postalCode.length < 3) {
    return NextResponse.json({ suggestions: [], city: '', province: '' })
  }

  // Get city and province from local postal code map
  let city = getCityFromPostalCode(postalCode)
  let province = getProvinceFromPostalCode(postalCode)

  // Get prefix (first 3 characters)
  const prefix = postalCode.slice(0, 3)

  // Check if we have street-level data for this postal code prefix
  let streetSuggestions = postalCodePrefixStreets[prefix] || []

  // If local map has no city match or no street suggestions, try online lookup (geocoder.ca)
  if ((!city || streetSuggestions.length === 0) && postalCode.length >= 3) {
    const online = await lookupPostalCodeOnline(postalCode)
    if (online) {
      if (!city) city = online.city
      if (!province) province = online.province
      // If the online lookup returned a street and we have no local street data, build a suggestion
      if (streetSuggestions.length === 0 && online.street && online.city) {
        const parts = online.street.split(' ')
        const streetType = parts.length > 1 ? parts.pop()! : 'Street'
        const streetName = parts.join(' ') || online.street
        streetSuggestions = [{
          streetName,
          streetType,
          city: online.city,
          province: online.province,
          postalCode: prefix,
          fullAddress: `${online.street}, ${online.city}, ${online.province}`,
        }]
      }
    }
  }

  // Return suggestions + city/province
  return NextResponse.json({
    suggestions: streetSuggestions,
    city,
    province,
  })
}
