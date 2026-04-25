"use client"

import { useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2, CheckCircle } from "lucide-react"

interface AddressSuggestion {
  streetName: string
  streetType: string
  direction?: string
  city: string
  province: string
  postalCode: string
  fullAddress: string
}

export interface PostalCodeInputProps {
  value: string
  onChange: (postalCode: string, addressData?: { city?: string; province?: string; streetName?: string; streetType?: string; direction?: string }) => void
  label?: string
  id?: string
}

export function PostalCodeInput({ value, onChange, label = "Postal Code *", id }: PostalCodeInputProps) {
  const autoId = useId()
  const inputId = id ?? `postal-code-${autoId}`
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cityProvince, setCityProvince] = useState<{ city: string; province: string }>({ city: '', province: '' })
  
  const formatPostalCode = (val: string): string => {
    let formatted = val.toUpperCase().replaceAll(/[^A-Z0-9]/g, '')
    if (formatted.length > 3) {
      formatted = formatted.slice(0, 3) + ' ' + formatted.slice(3, 6)
    }
    return formatted.slice(0, 7)
  }
  
  const fetchAddressSuggestions = async (postalCode: string) => {
    const cleanPostal = postalCode.replaceAll(/\s/g, '')
    if (cleanPostal.length < 3) {
      setSuggestions([])
      setCityProvince({ city: '', province: '' })
      return
    }
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/address-lookup?postalCode=${encodeURIComponent(cleanPostal)}`)
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setCityProvince({ city: data.city || '', province: data.province || '' })
      
      // Auto-fill city and province immediately
      if (data.city || data.province) {
        onChange(postalCode, { city: data.city, province: data.province })
      }
      
      if (data.suggestions?.length > 0) {
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Error fetching address:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(value, {
      city: suggestion.city,
      province: suggestion.province,
      streetName: suggestion.streetName,
      streetType: suggestion.streetType,
      direction: suggestion.direction,
    })
    setShowSuggestions(false)
  }
  
  return (
    <div className="relative">
      <Label htmlFor={inputId}>{label} <span className="text-xs text-primary font-semibold">(Auto-fills address)</span></Label>
      <div className="relative">
        <Input
          id={inputId}
          value={value}
          onChange={(e) => {
            const formatted = formatPostalCode(e.target.value)
            onChange(formatted)
            fetchAddressSuggestions(formatted)
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 500)}
          placeholder="L4B 0G2"
          className="font-mono uppercase pr-8 border-primary/50 focus:border-primary"
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
      </div>
      
      {/* City/Province indicator */}
      {cityProvince.city && (
        <p className="text-xs text-green-600 mt-1 font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {cityProvince.city}, {cityProvince.province}
        </p>
      )}
      
      {/* Street suggestions dropdown - MANDATORY SELECTION */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[9999] left-0 top-full w-[350px] mt-1 bg-background border-2 border-primary rounded-lg shadow-xl max-h-64 overflow-y-auto">
          <div className="px-3 py-2 bg-primary/10 border-b border-primary/20 sticky top-0">
            <p className="text-xs font-semibold text-primary">
              Select your street to auto-fill address:
            </p>
          </div>
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full px-3 py-3 text-left text-sm hover:bg-primary/10 flex items-center gap-3 border-b last:border-b-0 transition-colors"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">{suggestion.streetName} {suggestion.streetType}</span>
                {suggestion.direction && <span className="text-primary font-semibold"> {suggestion.direction}</span>}
                <span className="text-muted-foreground text-xs block">{suggestion.city}, {suggestion.province}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
