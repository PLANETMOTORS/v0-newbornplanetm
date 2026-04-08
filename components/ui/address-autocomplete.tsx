"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"

interface AddressResult {
  id: string
  text: string
  description: string
  streetLine: string
  city: string
  province: string
  postalCode: string
  country: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (address: AddressResult) => void
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  className?: string
}

// Canada Post address lookup (using free postal code API)
async function searchCanadianAddresses(query: string): Promise<AddressResult[]> {
  if (query.length < 3) return []
  
  try {
    // Use GeoNames or similar free API for Canadian postal codes
    // For demo, we'll simulate with common Canadian addresses
    const postalCodeMatch = query.match(/^[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d$/i)
    
    if (postalCodeMatch) {
      // Lookup by postal code
      const response = await fetch(`https://geocoder.ca/?postal=${query.replace(/\s/g, '')}&json=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.standard) {
          return [{
            id: query,
            text: `${data.standard.staddress || ''}, ${data.standard.city}, ${data.standard.prov}`,
            description: `${data.standard.city}, ${data.standard.prov} ${query.toUpperCase()}`,
            streetLine: data.standard.staddress || '',
            city: data.standard.city || '',
            province: data.standard.prov || '',
            postalCode: query.toUpperCase().replace(/\s/g, '').replace(/(.{3})(.{3})/, '$1 $2'),
            country: 'Canada'
          }]
        }
      }
    }
    
    // For street address lookup, use geocoder.ca
    const response = await fetch(`https://geocoder.ca/?locate=${encodeURIComponent(query)}&json=1`)
    if (response.ok) {
      const data = await response.json()
      if (data.standard) {
        return [{
          id: `${data.latt}-${data.longt}`,
          text: `${data.standard.staddress || query}, ${data.standard.city}, ${data.standard.prov}`,
          description: `${data.standard.city}, ${data.standard.prov} ${data.standard.postal || ''}`,
          streetLine: data.standard.staddress || query,
          city: data.standard.city || '',
          province: data.standard.prov || '',
          postalCode: data.standard.postal || '',
          country: 'Canada'
        }]
      }
    }
    
    return []
  } catch {
    return []
  }
}

// Common Canadian cities for suggestions
const COMMON_CITIES = [
  { city: "Toronto", province: "ON", postalPrefix: "M" },
  { city: "Mississauga", province: "ON", postalPrefix: "L" },
  { city: "Brampton", province: "ON", postalPrefix: "L" },
  { city: "Hamilton", province: "ON", postalPrefix: "L" },
  { city: "Ottawa", province: "ON", postalPrefix: "K" },
  { city: "Vancouver", province: "BC", postalPrefix: "V" },
  { city: "Calgary", province: "AB", postalPrefix: "T" },
  { city: "Edmonton", province: "AB", postalPrefix: "T" },
  { city: "Montreal", province: "QC", postalPrefix: "H" },
  { city: "Winnipeg", province: "MB", postalPrefix: "R" },
]

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  label = "Address",
  placeholder = "Enter your address or postal code",
  required = false,
  error,
  className = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    
    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    if (newValue.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    
    // Debounce API calls
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await searchCanadianAddresses(newValue)
        
        // Also add city suggestions
        const citySuggestions = COMMON_CITIES
          .filter(c => c.city.toLowerCase().includes(newValue.toLowerCase()))
          .map(c => ({
            id: c.city,
            text: `${c.city}, ${c.province}`,
            description: `${c.province}, Canada`,
            streetLine: '',
            city: c.city,
            province: c.province,
            postalCode: '',
            country: 'Canada'
          }))
        
        setSuggestions([...results, ...citySuggestions].slice(0, 5))
        setShowDropdown(true)
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }

  const handleSelect = (address: AddressResult) => {
    onChange(address.text)
    onAddressSelect(address)
    setShowDropdown(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <Label htmlFor="address-input" className="mb-1.5 block">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="address-input"
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={`pl-10 ${error ? "border-destructive" : ""}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
      
      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted flex items-start gap-2 border-b last:border-b-0"
              onClick={() => handleSelect(suggestion)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{suggestion.text}</p>
                <p className="text-xs text-muted-foreground">{suggestion.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Postal code input with validation
interface PostalCodeInputProps {
  value: string
  onChange: (value: string) => void
  onValidPostalCode?: (postalCode: string, city: string, province: string) => void
  error?: string
  required?: boolean
  className?: string
}

export function PostalCodeInput({
  value,
  onChange,
  onValidPostalCode,
  error,
  required = false,
  className = "",
}: PostalCodeInputProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")

  // Format postal code as user types
  const formatPostalCode = (input: string) => {
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (cleaned.length <= 3) return cleaned
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
  }

  const handleChange = async (newValue: string) => {
    const formatted = formatPostalCode(newValue)
    onChange(formatted)
    setValidationError("")
    
    // Validate when we have full postal code
    if (formatted.replace(/\s/g, '').length === 6) {
      setIsValidating(true)
      try {
        const response = await fetch(`https://geocoder.ca/?postal=${formatted.replace(/\s/g, '')}&json=1`)
        if (response.ok) {
          const data = await response.json()
          if (data.standard?.city) {
            onValidPostalCode?.(formatted, data.standard.city, data.standard.prov)
          } else {
            setValidationError("Invalid postal code")
          }
        }
      } catch {
        // Validation failed silently
      } finally {
        setIsValidating(false)
      }
    }
  }

  const isValidFormat = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(value)

  return (
    <div className={className}>
      <Label htmlFor="postal-code" className="mb-1.5 block">
        Postal Code {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          id="postal-code"
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="M5V 3L9"
          maxLength={7}
          className={`uppercase ${error || validationError ? "border-destructive" : isValidFormat ? "border-green-500" : ""}`}
        />
        {isValidating && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {(error || validationError) && (
        <p className="text-xs text-destructive mt-1">{error || validationError}</p>
      )}
    </div>
  )
}
