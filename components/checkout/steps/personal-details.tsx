"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { isEmailLike } from "@/lib/validation/email"

const PROVINCES = [
  "Ontario", "British Columbia", "Alberta", "Quebec", "Nova Scotia",
  "New Brunswick", "Prince Edward Island", "Manitoba", "Saskatchewan",
  "Newfoundland and Labrador", "Northwest Territories", "Yukon", "Nunavut",
]

const ONTARIO_PREFIXES: Record<string, string> = {
  'L4B': 'Richmond Hill', 'L4C': 'Richmond Hill', 'L4E': 'Richmond Hill', 'L4S': 'Richmond Hill',
  'L3R': 'Markham', 'L3S': 'Markham', 'L3T': 'Markham', 'L3P': 'Markham',
  'M5V': 'Toronto', 'M5J': 'Toronto', 'M5H': 'Toronto', 'M5C': 'Toronto',
  'L5A': 'Mississauga', 'L5B': 'Mississauga', 'L5M': 'Mississauga',
  'L7A': 'Brampton', 'L6P': 'Brampton', 'L6R': 'Brampton',
  'K1A': 'Ottawa', 'K1B': 'Ottawa', 'K1P': 'Ottawa',
  'L8E': 'Hamilton', 'L8H': 'Hamilton', 'L8N': 'Hamilton',
}

const PROVINCE_BY_LETTER: Record<string, string> = {
  'A': 'Newfoundland and Labrador', 'B': 'Nova Scotia', 'C': 'Prince Edward Island',
  'E': 'New Brunswick', 'G': 'Quebec', 'H': 'Quebec', 'J': 'Quebec',
  'K': 'Ontario', 'L': 'Ontario', 'M': 'Ontario', 'N': 'Ontario', 'P': 'Ontario',
  'R': 'Manitoba', 'S': 'Saskatchewan', 'T': 'Alberta',
  'V': 'British Columbia', 'X': 'Northwest Territories', 'Y': 'Yukon',
}

const CANADIAN_POSTAL_REGEX = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/

export interface PersonalDetailsData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  unit: string
  city: string
  province: string
  postalCode: string
  sameDeliveryAddress: boolean
  deliveryAddress: string
  deliveryCity: string
  deliveryProvince: string
  deliveryPostalCode: string
}

interface PersonalDetailsProps {
  data: PersonalDetailsData
  onChange: (data: PersonalDetailsData) => void
  onContinue: () => void
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function PersonalDetailsStep({ data, onChange, onContinue }: PersonalDetailsProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [streetSuggestions, setStreetSuggestions] = useState<Array<{ fullAddress: string }>>([])
  const [showStreetDropdown, setShowStreetDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const postalFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep refs to latest data/onChange so async callbacks never use stale closures
  const dataRef = useRef(data)
  dataRef.current = data
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const update = (partial: Partial<PersonalDetailsData>) =>
    onChangeRef.current({ ...dataRef.current, ...partial })

  // Close street suggestions dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowStreetDropdown(false)
      }
    }
    if (showStreetDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showStreetDropdown])

  const handlePostalCode = (raw: string) => {
    let value = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (value.length > 3) value = value.slice(0, 3) + ' ' + value.slice(3, 6)
    const formatted = value.slice(0, 7)
    const prefix = value.replace(/\s/g, '').slice(0, 3).toUpperCase()

    update({ postalCode: formatted })

    // Debounce API call — only fire when we have a valid 3-char prefix
    if (postalFetchRef.current) clearTimeout(postalFetchRef.current)

    if (prefix.length >= 3) {
      postalFetchRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/address-lookup?postalCode=${encodeURIComponent(prefix)}`)
          if (!res.ok) throw new Error("Lookup failed")
          const json = await res.json()
          if (json.city && json.province) {
            onChangeRef.current({ ...dataRef.current, postalCode: formatted, city: json.city, province: json.province })
            if (json.suggestions?.length > 0) {
              setStreetSuggestions(json.suggestions)
              setShowStreetDropdown(true)
            } else {
              setStreetSuggestions([])
              setShowStreetDropdown(false)
            }
            return
          }
        } catch {
          // Fallback to local lookup below
        }

        const city = ONTARIO_PREFIXES[prefix]
        if (city) {
          onChangeRef.current({ ...dataRef.current, postalCode: formatted, city, province: 'Ontario' })
          return
        }
        const prov = PROVINCE_BY_LETTER[prefix[0]]
        if (prov) {
          onChangeRef.current({ ...dataRef.current, postalCode: formatted, province: prov })
        }
      }, 300)
    }
  }

  const validate = (): boolean => {
    const errs: string[] = []
    if (!data.firstName.trim()) errs.push("First name is required")
    if (!data.lastName.trim()) errs.push("Last name is required")
    // Structural, ReDoS-free check (S5852/S2631).
    if (!isEmailLike(data.email)) errs.push("Valid email is required")
    if (data.phone.replace(/\D/g, '').length !== 10)
      errs.push("Phone must be 10 digits")
    if (!data.address.trim()) errs.push("Street address is required")
    if (!data.city.trim()) errs.push("City is required")
    const cleanPostal = data.postalCode.replace(/\s/g, '').toUpperCase()
    if (!cleanPostal || !CANADIAN_POSTAL_REGEX.test(cleanPostal.slice(0, 3) + ' ' + cleanPostal.slice(3)))
      errs.push("Valid Canadian postal code is required (e.g. M5V 1A1)")

    if (!data.sameDeliveryAddress) {
      if (!data.deliveryAddress.trim()) errs.push("Delivery address is required")
      if (!data.deliveryCity.trim()) errs.push("Delivery city is required")
    }

    setErrors(errs)
    return errs.length === 0
  }

  const handleContinue = () => {
    if (validate()) onContinue()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em] mb-1">Personal details</h1>
        <p className="text-muted-foreground">
          Tell us about yourself. This information is used for vehicle registration and contracts.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <ul className="text-sm text-destructive space-y-1">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Name and contact */}
      <fieldset>
        <legend className="font-semibold mb-1">Name and contact</legend>
        <p className="text-sm text-muted-foreground mb-4">Name must match your driver&apos;s license.</p>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                value={data.firstName}
                onChange={e => update({ firstName: e.target.value })}
                placeholder="First name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                value={data.lastName}
                onChange={e => update({ lastName: e.target.value })}
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email address *</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={data.email}
              onChange={e => update({ email: e.target.value })}
              placeholder="name@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Mobile number *</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={data.phone}
              onChange={e => update({ phone: formatPhone(e.target.value) })}
              placeholder="(416) 555-1234"
            />
          </div>
        </div>
      </fieldset>

      {/* Home address */}
      <fieldset>
        <legend className="font-semibold mb-1">Home address</legend>
        <p className="text-sm text-muted-foreground mb-4">
          We&apos;ll use this for vehicle registration and contracts.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label htmlFor="postalCode" className="text-blue-700 font-semibold">
              Postal Code * <span className="text-xs font-normal">(enter first to auto-fill address)</span>
            </Label>
            <Input
              id="postalCode"
              autoComplete="postal-code"
              value={data.postalCode}
              onChange={e => handlePostalCode(e.target.value)}
              placeholder="M5V 1A1"
              className="mt-1"
            />
          </div>

          <div className="relative" ref={dropdownRef}>
            <Label htmlFor="address">Street address *</Label>
            <Input
              id="address"
              autoComplete="street-address"
              value={data.address}
              onChange={e => { update({ address: e.target.value }); setShowStreetDropdown(false) }}
              onFocus={() => streetSuggestions.length > 0 && setShowStreetDropdown(true)}
              placeholder="123 Main St"
              role="combobox"
              aria-expanded={showStreetDropdown}
              aria-autocomplete="list"
              aria-controls="street-suggestions"
            />
            {showStreetDropdown && streetSuggestions.length > 0 && (
              <ul
                id="street-suggestions"
                role="listbox"
                className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {streetSuggestions.map((s) => (
                  <li key={s.fullAddress} role="option" aria-selected={false}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => {
                        update({ address: s.fullAddress })
                        setShowStreetDropdown(false)
                      }}
                    >
                      {s.fullAddress}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <Label htmlFor="unit">Apt. or Unit #</Label>
            <Input
              id="unit"
              autoComplete="address-line2"
              value={data.unit}
              onChange={e => update({ unit: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                autoComplete="address-level2"
                value={data.city}
                onChange={e => update({ city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="province-select">Province *</Label>
              <Select value={data.province} onValueChange={v => update({ province: v })}>
                <SelectTrigger id="province-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Postal Code</Label>
              <Input
                value={data.postalCode}
                readOnly
                tabIndex={-1}
                className="bg-muted"
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Delivery address */}
      <fieldset>
        <div className="flex items-center gap-3 mb-4">
          <Checkbox
            id="sameDeliveryAddress"
            checked={data.sameDeliveryAddress}
            onCheckedChange={(checked) => update({ sameDeliveryAddress: checked as boolean })}
          />
          <Label htmlFor="sameDeliveryAddress" className="cursor-pointer">
            Delivery address is the same as home address
          </Label>
        </div>

        {!data.sameDeliveryAddress && (
          <div className="space-y-4 pl-4 border-l-2 border-blue-200">
            <legend className="font-semibold mb-1 text-sm">Delivery address</legend>
            <div>
              <Label htmlFor="deliveryAddress">Street address *</Label>
              <Input
                id="deliveryAddress"
                autoComplete="shipping street-address"
                value={data.deliveryAddress}
                onChange={e => update({ deliveryAddress: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="deliveryCity">City *</Label>
                <Input
                  id="deliveryCity"
                  autoComplete="shipping address-level2"
                  value={data.deliveryCity}
                  onChange={e => update({ deliveryCity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="delivery-province-select">Province *</Label>
                <Select value={data.deliveryProvince} onValueChange={v => update({ deliveryProvince: v })}>
                  <SelectTrigger id="delivery-province-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deliveryPostalCode">Postal Code *</Label>
                <Input
                  id="deliveryPostalCode"
                  autoComplete="shipping postal-code"
                  value={data.deliveryPostalCode}
                  onChange={e => update({ deliveryPostalCode: e.target.value.toUpperCase() })}
                  placeholder="M5V 1A1"
                />
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <Button onClick={handleContinue} className="w-full h-12 text-base font-semibold">
        Continue
      </Button>
    </div>
  )
}
