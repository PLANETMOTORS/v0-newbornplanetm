"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PROVINCES = [
  "Ontario", "British Columbia", "Alberta", "Quebec", "Nova Scotia",
  "New Brunswick", "Prince Edward Island", "Manitoba", "Saskatchewan",
  "Newfoundland and Labrador", "Northwest Territories", "Yukon", "Nunavut",
]

// Postal-prefix → city fallback (Ontario)
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

  const update = (partial: Partial<PersonalDetailsData>) =>
    onChange({ ...data, ...partial })

  const handlePostalCode = async (raw: string) => {
    let value = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (value.length > 3) value = value.slice(0, 3) + ' ' + value.slice(3, 6)
    const formatted = value.slice(0, 7)
    const prefix = value.replace(/\s/g, '').slice(0, 3).toUpperCase()

    if (prefix.length >= 3) {
      try {
        const res = await fetch(`/api/address-lookup?postalCode=${prefix}`)
        const json = await res.json()
        if (json.city && json.province) {
          update({ postalCode: formatted, city: json.city, province: json.province })
          if (json.suggestions?.length > 0) {
            setStreetSuggestions(json.suggestions)
            setShowStreetDropdown(true)
          } else {
            setStreetSuggestions([])
            setShowStreetDropdown(false)
          }
          return
        }
      } catch { /* fallback below */ }

      const city = ONTARIO_PREFIXES[prefix]
      if (city) {
        update({ postalCode: formatted, city, province: 'Ontario' })
        return
      }
      const prov = PROVINCE_BY_LETTER[prefix[0]]
      if (prov) {
        update({ postalCode: formatted, province: prov })
        return
      }
    }
    update({ postalCode: formatted })
  }

  const validate = (): boolean => {
    const errs: string[] = []
    if (!data.firstName.trim()) errs.push("First name is required")
    if (!data.lastName.trim()) errs.push("Last name is required")
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.push("Valid email is required")
    if (data.phone.replace(/\D/g, '').length !== 10)
      errs.push("Phone must be 10 digits")
    if (!data.address.trim()) errs.push("Street address is required")
    if (!data.city.trim()) errs.push("City is required")
    if (!data.postalCode.trim()) errs.push("Postal code is required")
    setErrors(errs)
    return errs.length === 0
  }

  const handleContinue = () => {
    if (validate()) onContinue()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Personal details</h1>
      </div>

      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <ul className="text-sm text-destructive space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Name and number */}
      <section>
        <h2 className="font-semibold mb-1">Name and number</h2>
        <p className="text-sm text-muted-foreground mb-4">Name must match your driver&apos;s license.</p>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                value={data.firstName}
                onChange={e => update({ firstName: e.target.value })}
                placeholder="First name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
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
              value={data.phone}
              onChange={e => update({ phone: formatPhone(e.target.value) })}
              placeholder="(416) 555-1234"
            />
          </div>
        </div>
      </section>

      {/* Home address */}
      <section>
        <h2 className="font-semibold mb-1">Home address</h2>
        <p className="text-sm text-muted-foreground mb-4">
          We&apos;ll use this for vehicle registration and contracts.
        </p>

        <div className="space-y-4">
          {/* Postal code first — triggers auto-fill */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label htmlFor="postalCode" className="text-blue-700 font-semibold">
              Postal Code * <span className="text-xs font-normal">(enter first to auto-fill address)</span>
            </Label>
            <Input
              id="postalCode"
              value={data.postalCode}
              onChange={e => handlePostalCode(e.target.value)}
              placeholder="M5V 1A1"
              className="mt-1"
            />
          </div>

          <div className="relative">
            <Label htmlFor="address">Street address *</Label>
            <Input
              id="address"
              value={data.address}
              onChange={e => { update({ address: e.target.value }); setShowStreetDropdown(false) }}
              onFocus={() => streetSuggestions.length > 0 && setShowStreetDropdown(true)}
              placeholder="123 Main St"
            />
            {showStreetDropdown && streetSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {streetSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => {
                      update({ address: s.fullAddress })
                      setShowStreetDropdown(false)
                    }}
                  >
                    {s.fullAddress}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="unit">Apt. or Unit #</Label>
            <Input
              id="unit"
              value={data.unit}
              onChange={e => update({ unit: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={data.city} onChange={e => update({ city: e.target.value })} />
            </div>
            <div>
              <Label>Province *</Label>
              <Select value={data.province} onValueChange={v => update({ province: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Postal Code</Label>
              <Input value={data.postalCode} readOnly className="bg-muted" />
            </div>
          </div>
        </div>
      </section>

      {/* Delivery address */}
      <section>
        <h2 className="font-semibold mb-1">Delivery address</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Delivery location is based on this address.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="sameDeliveryAddress"
            checked={data.sameDeliveryAddress}
            onCheckedChange={checked => update({ sameDeliveryAddress: checked as boolean })}
          />
          <Label htmlFor="sameDeliveryAddress">Same as home address</Label>
        </div>
      </section>

      <Button onClick={handleContinue} className="w-full h-12 text-base font-semibold">
        Continue
      </Button>
    </div>
  )
}
