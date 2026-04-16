"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  ArrowLeft, 
  LockKeyhole, 
  Shield, 
  CheckCircle, 
  CreditCard, 
  Building2,
  Truck,
  FileText,
  Phone,
  AlertCircle
} from "lucide-react"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"
import dynamic from 'next/dynamic'
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"
import { startVehicleCheckout } from "@/app/actions/stripe"
import { OMVIC_FEE, CERTIFICATION_FEE, LICENSING_FEE } from "@/lib/pricing/format"
import { getUTMParams } from "@/lib/hooks/use-utm-params"

const PROVINCE_NAME_TO_CODE: Record<string, string> = {
  'Ontario': 'ON', 'British Columbia': 'BC', 'Alberta': 'AB', 'Quebec': 'QC',
  'Nova Scotia': 'NS', 'New Brunswick': 'NB', 'Prince Edward Island': 'PE',
  'Manitoba': 'MB', 'Saskatchewan': 'SK', 'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT', 'Yukon': 'YT', 'Nunavut': 'NU',
}
import { OMVIC_FEE, CERTIFICATION_FEE, LICENSING_FEE } from "@/lib/pricing/format"

// Lazy-load Stripe — only fetched when user reaches payment step
const EmbeddedCheckoutProvider = dynamic(
  () => import('@stripe/react-stripe-js').then(m => ({ default: m.EmbeddedCheckoutProvider })),
  { ssr: false }
)
const EmbeddedCheckout = dynamic(
  () => import('@stripe/react-stripe-js').then(m => ({ default: m.EmbeddedCheckout })),
  { ssr: false }
)

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
let stripePromise: ReturnType<typeof import('@stripe/stripe-js').loadStripe> | null = null
function getStripePromise() {
  if (!stripePromise && stripeKey) {
    stripePromise = import('@stripe/stripe-js').then(m => m.loadStripe(stripeKey))
  }
  return stripePromise
}

// Protection Plans
const PROTECTION_PLANS = [
  { id: "none", name: "No Protection", price: 0, description: "" },
  { id: "essential", name: "PlanetCare Essential", price: 1950, description: "3-year powertrain warranty" },
  { id: "smart", name: "PlanetCare Smart", price: 3000, description: "5-year comprehensive coverage" },
  { id: "lifeproof", name: "PlanetCare Life Proof", price: 4850, description: "Lifetime bumper-to-bumper" },
]

// Sample vehicle data (in real app, fetch from API)
const vehicleData = {
  id: "2021-jeep-wrangler-4xe",
  year: 2021,
  make: "Jeep",
  model: "Wrangler 4xe",
  trim: "Unlimited Sahara",
  price: 36200,
  mileage: 60950,
  image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=250&fit=crop",
  stockNumber: "PM-2024-1234",
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [purchaseType, setPurchaseType] = useState<"finance" | "cash">("finance")
  const [selectedProtection, setSelectedProtection] = useState("none")
  const [showStripeCheckout, setShowStripeCheckout] = useState(false)
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup")
  const [deliveryQuote, setDeliveryQuote] = useState<{
    cost: number
    isFree: boolean
    distance: number
    message: string
  } | null>(null)
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false)

  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Address
    address: "",
    city: "",
    province: "Ontario",
    postalCode: "",
    // Financing
    downPayment: "0",
    term: "60",
    // Terms
    agreeToTerms: false,
    agreeToCredit: false,
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(`/checkout/${params.id}`)}`)
    }
  }, [user, isLoading, router, params.id])

  // Calculate delivery cost when postal code changes
  const calculateDelivery = async (postalCode: string) => {
    if (!postalCode || postalCode.length < 3) {
      setDeliveryQuote(null)
      return
    }

    setIsCalculatingDelivery(true)
    try {
      const response = await fetch(`/api/v1/deliveries/quote?postalCode=${encodeURIComponent(postalCode)}`)
      if (response.ok) {
        const data = await response.json()
        setDeliveryQuote({
          cost: data.deliveryCost,
          isFree: data.isFreeDelivery,
          distance: data.distanceKm,
          message: data.message
        })
      }
    } catch {
      // Fallback to default pricing if API fails
      setDeliveryQuote({ cost: 0, isFree: true, distance: 0, message: "Free delivery" })
    } finally {
      setIsCalculatingDelivery(false)
    }
  }

  // Recalculate delivery when postal code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.postalCode) {
        calculateDelivery(formData.postalCode)
      }
    }, 500) // Debounce
    return () => clearTimeout(timer)
  }, [formData.postalCode])

  const vehiclePrice = vehicleData.price
  const protectionPrice = PROTECTION_PLANS.find(p => p.id === selectedProtection)?.price || 0
  const omvicFee = OMVIC_FEE
  const certificationFee = CERTIFICATION_FEE
  const financeDocsFee = 895 // Finance docs fee (only applies if financing)
  const licensingFee = LICENSING_FEE
  // Dynamic delivery fee based on postal code distance (free within 300km)
  const deliveryFee = deliveryType === "delivery"
    ? (deliveryQuote?.cost ?? 299)
    : 0
  // Subtotal before tax (vehicle + all fees + protection)
  const subtotalBeforeTax = vehiclePrice + protectionPrice + omvicFee + certificationFee + (purchaseType === "finance" ? financeDocsFee : 0) + licensingFee + deliveryFee
  // Province name → abbreviation mapping for tax lookup
  const provinceCode = PROVINCE_NAME_TO_CODE[formData.province] || 'ON'
  const provinceTax = PROVINCE_TAX_RATES[provinceCode] || PROVINCE_TAX_RATES.ON
  const taxRate = provinceTax.total
  const formatPct = (rate: number) => parseFloat((rate * 100).toFixed(3)).toString()
  const taxLabel = provinceTax.hst > 0
    ? `HST (${formatPct(provinceTax.hst)}%)`
    : provinceTax.pst > 0
      ? `GST+PST (${formatPct(provinceTax.total)}%)`
      : `GST (${formatPct(provinceTax.gst)}%)`
  const tax = Math.round(subtotalBeforeTax * taxRate)
  // Total with tax
  const total = subtotalBeforeTax + tax

  // Stripe client secret fetcher for embedded checkout
  const fetchClientSecret = useCallback(async () => {
    const utmParams = getUTMParams()
    const clientSecret = await startVehicleCheckout({
      vehicleId: params.id as string,
      vehicleName: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`,
      vehiclePriceCents: total * 100,
      protectionPlanId: selectedProtection !== "none" ? selectedProtection : undefined,
      customerEmail: formData.email,
      ...(utmParams?.utm_source && { utmSource: utmParams.utm_source }),
      ...(utmParams?.utm_medium && { utmMedium: utmParams.utm_medium }),
      ...(utmParams?.utm_campaign && { utmCampaign: utmParams.utm_campaign }),
      ...(utmParams?.utm_content && { utmContent: utmParams.utm_content }),
      ...(utmParams?.utm_term && { utmTerm: utmParams.utm_term }),
    })
    if (!clientSecret) {
      throw new Error("Failed to create checkout session")
    }
    return clientSecret
  }, [params.id, total, selectedProtection, formData.email, vehicleData])

  // Show loading while checking auth
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length >= 5
  }
  
  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '')
    return digitsOnly.length === 10
  }
  
  const validatePostalCode = (postalCode: string): boolean => {
    // Canadian postal code: A1A 1A1 (letter-digit-letter space digit-letter-digit)
    const cleanCode = postalCode.replace(/\s/g, '').toUpperCase()
    const postalRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/
    return postalRegex.test(cleanCode)
  }
  
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  const validateStep1 = (): string[] => {
    const errors: string[] = []
    if (!formData.firstName.trim()) errors.push("First Name is required")
    if (!formData.lastName.trim()) errors.push("Last Name is required")
    if (!formData.email.trim()) {
      errors.push("Email Address is required")
    } else if (!validateEmail(formData.email)) {
      errors.push("Please enter a valid email address (e.g., name@example.com)")
    }
    if (!formData.phone.trim()) {
      errors.push("Phone Number is required")
    } else if (!validatePhone(formData.phone)) {
      errors.push("Phone must be 10 digits (3-digit area code + 7-digit number)")
    }
    if (!formData.address.trim()) errors.push("Street Address is required")
    if (!formData.city.trim()) errors.push("City is required")
    if (!formData.province.trim()) errors.push("Province is required")
    if (!formData.postalCode.trim()) {
      errors.push("Postal Code is required")
    } else if (!validatePostalCode(formData.postalCode)) {
      errors.push("Postal Code must be valid Canadian format (e.g., M5C 1A1)")
    }
    return errors
  }
  
  const handleContinueToPayment = () => {
    const errors = validateStep1()
    if (errors.length > 0) {
      setValidationErrors(errors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setValidationErrors([])
    setStep(2)
  }

const handleSubmit = () => {
    setIsSubmitting(true)

    // If financing, redirect to full finance application
    if (purchaseType === "finance") {
      sessionStorage.setItem('checkoutData', JSON.stringify({
        ...formData,
        vehicleId: params.id,
        deliveryType,
        selectedProtection,
      }))
      window.location.href = `/financing/application?vehicleId=${params.id}`
      return
    }

    // For cash purchases, show Stripe checkout
    setShowStripeCheckout(true)
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <PlanetMotorsLogo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyhole className="w-4 h-4" />
              Secure Checkout
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/vehicles/${params.id}`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Vehicle
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { num: 1, label: "Your Info" },
            { num: 2, label: "Payment" },
            { num: 3, label: "Review" },
            { num: 4, label: "Complete" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < 3 && <div className={`w-8 h-0.5 mx-2 ${step > s.num ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <>
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Smith"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className={!validateEmail(formData.email) && formData.email.length > 0 ? "border-destructive" : ""}
                      />
                      {formData.email.length > 0 && !validateEmail(formData.email) && (
                        <p className="text-xs text-destructive">Please enter a valid email address</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number * <span className="text-xs text-muted-foreground">(10 digits required)</span></Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                        placeholder="416-985-2277"
                        className={!validatePhone(formData.phone) && formData.phone.length > 0 ? "border-destructive" : ""}
                      />
                      {formData.phone.length > 0 && !validatePhone(formData.phone) && (
                        <p className="text-xs text-destructive">Phone must be 10 digits</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Address - Postal Code FIRST to auto-fill other fields */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* POSTAL CODE FIRST - This auto-fills City and Province */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-primary font-semibold">
                          Postal Code * <span className="text-xs font-medium">(Enter first to auto-fill address)</span>
                        </Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={async (e) => {
                            // Format Canadian postal code (e.g., M5V 1A1)
                            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                            if (value.length > 3) {
                              value = value.slice(0, 3) + ' ' + value.slice(3, 6)
                            }
                            const formattedPostal = value.slice(0, 7)
                            
                            // Auto-fill city/province based on postal code prefix
                            const prefix = value.replace(/\s/g, '').slice(0, 3).toUpperCase()
                            if (prefix.length >= 3) {
                              // Fetch from API for street suggestions
                              try {
                                const res = await fetch(`/api/address-lookup?postalCode=${prefix}`)
                                const data = await res.json()
                                if (data.city && data.province) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    postalCode: formattedPostal, 
                                    city: data.city, 
                                    province: data.province 
                                  }))
                                  return
                                }
                              } catch (_error) {
                                // Fallback to local lookup
                              }
                              
                              // Fallback: Ontario postal codes - comprehensive list
                              const ontarioPrefixes: Record<string, string> = {
                                'L4B': 'Richmond Hill', 'L4C': 'Richmond Hill', 'L4E': 'Richmond Hill', 'L4S': 'Richmond Hill',
                                'L3R': 'Markham', 'L3S': 'Markham', 'L3T': 'Markham', 'L3P': 'Markham', 'L6B': 'Markham', 'L6C': 'Markham', 'L6E': 'Markham', 'L6G': 'Markham',
                                'M5V': 'Toronto', 'M5J': 'Toronto', 'M5H': 'Toronto', 'M5C': 'Toronto', 'M5A': 'Toronto', 'M5B': 'Toronto', 'M5E': 'Toronto', 'M5G': 'Toronto', 'M5K': 'Toronto', 'M5L': 'Toronto', 'M5M': 'Toronto', 'M5N': 'Toronto', 'M5P': 'Toronto', 'M5R': 'Toronto', 'M5S': 'Toronto', 'M5T': 'Toronto', 'M5W': 'Toronto', 'M5X': 'Toronto',
                                'M4V': 'Toronto', 'M4W': 'Toronto', 'M4X': 'Toronto', 'M4Y': 'Toronto', 'M4E': 'Toronto', 'M4G': 'Toronto', 'M4H': 'Toronto', 'M4J': 'Toronto', 'M4K': 'Toronto', 'M4L': 'Toronto', 'M4M': 'Toronto', 'M4N': 'Toronto', 'M4P': 'Toronto', 'M4R': 'Toronto', 'M4S': 'Toronto', 'M4T': 'Toronto',
                                'M6A': 'North York', 'M6B': 'North York', 'M6C': 'Toronto', 'M6E': 'Toronto', 'M6G': 'Toronto', 'M6H': 'Toronto', 'M6J': 'Toronto', 'M6K': 'Toronto', 'M6L': 'North York', 'M6M': 'Toronto', 'M6N': 'Toronto', 'M6P': 'Toronto', 'M6R': 'Toronto', 'M6S': 'Toronto',
                                'M9A': 'Etobicoke', 'M9B': 'Etobicoke', 'M9C': 'Etobicoke', 'M9L': 'North York', 'M9M': 'North York', 'M9N': 'Toronto', 'M9P': 'Etobicoke', 'M9R': 'Etobicoke', 'M9V': 'Etobicoke', 'M9W': 'Etobicoke',
                                'L1N': 'Oshawa', 'L1G': 'Oshawa', 'L1H': 'Oshawa', 'L1J': 'Oshawa', 'L1K': 'Oshawa', 'L1L': 'Oshawa', 'L1M': 'Oshawa', 'L1P': 'Oshawa', 'L1R': 'Oshawa', 'L1S': 'Oshawa', 'L1T': 'Oshawa', 'L1V': 'Oshawa', 'L1W': 'Oshawa', 'L1X': 'Oshawa', 'L1Y': 'Oshawa', 'L1Z': 'Oshawa',
                                'L5A': 'Mississauga', 'L5B': 'Mississauga', 'L5C': 'Mississauga', 'L5E': 'Mississauga', 'L5G': 'Mississauga', 'L5H': 'Mississauga', 'L5J': 'Mississauga', 'L5K': 'Mississauga', 'L5L': 'Mississauga', 'L5M': 'Mississauga', 'L5N': 'Mississauga', 'L5P': 'Mississauga', 'L5R': 'Mississauga', 'L5S': 'Mississauga', 'L5T': 'Mississauga', 'L5V': 'Mississauga', 'L5W': 'Mississauga',
                                'L6H': 'Oakville', 'L6J': 'Oakville', 'L6K': 'Oakville', 'L6L': 'Oakville', 'L6M': 'Oakville',
                                'L7A': 'Brampton', 'L7C': 'Brampton', 'L6P': 'Brampton', 'L6R': 'Brampton', 'L6S': 'Brampton', 'L6T': 'Brampton', 'L6V': 'Brampton', 'L6W': 'Brampton', 'L6X': 'Brampton', 'L6Y': 'Brampton', 'L6Z': 'Brampton',
                                'L7G': 'Georgetown', 'L7J': 'Acton', 'L7L': 'Burlington', 'L7M': 'Burlington', 'L7N': 'Burlington', 'L7P': 'Burlington', 'L7R': 'Burlington', 'L7S': 'Burlington', 'L7T': 'Burlington',
                                'L8E': 'Hamilton', 'L8G': 'Hamilton', 'L8H': 'Hamilton', 'L8J': 'Hamilton', 'L8K': 'Hamilton', 'L8L': 'Hamilton', 'L8M': 'Hamilton', 'L8N': 'Hamilton', 'L8P': 'Hamilton', 'L8R': 'Hamilton', 'L8S': 'Hamilton', 'L8T': 'Hamilton', 'L8V': 'Hamilton', 'L8W': 'Hamilton', 'L9A': 'Hamilton', 'L9B': 'Hamilton', 'L9C': 'Hamilton',
                                'K1A': 'Ottawa', 'K1B': 'Ottawa', 'K1C': 'Ottawa', 'K1E': 'Ottawa', 'K1G': 'Ottawa', 'K1H': 'Ottawa', 'K1J': 'Ottawa', 'K1K': 'Ottawa', 'K1L': 'Ottawa', 'K1M': 'Ottawa', 'K1N': 'Ottawa', 'K1P': 'Ottawa', 'K1R': 'Ottawa', 'K1S': 'Ottawa', 'K1T': 'Ottawa', 'K1V': 'Ottawa', 'K1W': 'Ottawa', 'K1X': 'Ottawa', 'K1Y': 'Ottawa', 'K1Z': 'Ottawa', 'K2A': 'Ottawa', 'K2B': 'Ottawa', 'K2C': 'Ottawa', 'K2E': 'Ottawa', 'K2G': 'Ottawa', 'K2H': 'Ottawa', 'K2J': 'Ottawa', 'K2K': 'Ottawa', 'K2L': 'Ottawa', 'K2M': 'Ottawa', 'K2P': 'Ottawa', 'K2R': 'Ottawa', 'K2S': 'Ottawa', 'K2T': 'Ottawa', 'K2V': 'Ottawa', 'K2W': 'Ottawa',
                                'N2A': 'Kitchener', 'N2B': 'Kitchener', 'N2C': 'Kitchener', 'N2E': 'Kitchener', 'N2G': 'Kitchener', 'N2H': 'Kitchener', 'N2J': 'Kitchener', 'N2K': 'Kitchener', 'N2L': 'Waterloo', 'N2M': 'Kitchener', 'N2N': 'Kitchener', 'N2P': 'Kitchener', 'N2R': 'Kitchener', 'N2T': 'Kitchener', 'N2V': 'Waterloo',
                                'N6A': 'London', 'N6B': 'London', 'N6C': 'London', 'N6E': 'London', 'N6G': 'London', 'N6H': 'London', 'N6J': 'London', 'N6K': 'London', 'N6L': 'London', 'N6M': 'London', 'N6N': 'London', 'N6P': 'London',
                              }
                              const city = ontarioPrefixes[prefix]
                              if (city) {
                                setFormData({ ...formData, postalCode: formattedPostal, city, province: 'Ontario' })
                                return
                              }
                              // Default province detection by first letter
                              const provinceMap: Record<string, string> = {
                                'K': 'Ontario', 'L': 'Ontario', 'M': 'Ontario', 'N': 'Ontario', 'P': 'Ontario',
                                'G': 'Quebec', 'H': 'Quebec', 'J': 'Quebec',
                                'V': 'British Columbia',
                                'T': 'Alberta',
                                'S': 'Saskatchewan',
                                'R': 'Manitoba',
                                'E': 'New Brunswick',
                                'B': 'Nova Scotia',
                                'C': 'Prince Edward Island',
                                'A': 'Newfoundland and Labrador',
                              }
                              const prov = provinceMap[prefix[0]]
                              if (prov) {
                                setFormData({ ...formData, postalCode: formattedPostal, province: prov })
                                return
                              }
                            }
                            // If no match, just update postal code
                            setFormData({ ...formData, postalCode: formattedPostal })
                          }}
                          placeholder="M5C 1A1"
                          maxLength={7}
                          className={!validatePostalCode(formData.postalCode) && formData.postalCode.length > 0 ? "border-destructive" : ""}
                        />
                        {formData.postalCode.length > 0 && !validatePostalCode(formData.postalCode) && (
                          <p className="text-xs text-destructive">Must be 6 characters (e.g., M5C 1A1)</p>
                        )}
                        {formData.city && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            {formData.city}, {formData.province}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Street Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                        placeholder="123 MAIN STREET"
                        className="uppercase"
                      />
                    </div>
                    
                    {/* City and Province - Auto-filled from Postal Code but manually editable */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City * <span className="text-xs text-muted-foreground">(Auto-filled, editable)</span></Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Province * <span className="text-xs text-muted-foreground">(Auto-filled, editable)</span></Label>
                        <Input 
                          id="province" 
                          value={formData.province} 
                          onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                          placeholder="Enter province"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      How would you like to receive your vehicle?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as "pickup" | "delivery")}>
                      <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-all ${deliveryType === "pickup" ? "ring-2 ring-primary" : ""}`}>
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                          <div className="font-medium">Pickup at Dealership</div>
                          <div className="text-sm text-muted-foreground">30 Major Mackenzie Dr E, Richmond Hill</div>
                        </Label>
                        <Badge variant="secondary">FREE</Badge>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 mt-2 transition-all ${deliveryType === "delivery" ? "ring-2 ring-primary" : ""}`}>
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                          <div className="font-medium">Home Delivery</div>
                          <div className="text-sm text-muted-foreground">
                            {isCalculatingDelivery ? (
                              "Calculating delivery cost..."
                            ) : deliveryQuote ? (
                              deliveryQuote.isFree 
                                ? `Free delivery to your area (${deliveryQuote.distance}km)` 
                                : `${deliveryQuote.distance}km from dealership`
                            ) : (
                              "Enter postal code to calculate delivery"
                            )}
                          </div>
                        </Label>
                        {isCalculatingDelivery ? (
                          <Badge variant="outline">...</Badge>
                        ) : deliveryQuote?.isFree ? (
                          <Badge className="bg-green-600">FREE</Badge>
                        ) : deliveryQuote ? (
                          <Badge>${deliveryQuote.cost.toFixed(0)}</Badge>
                        ) : (
                          <Badge variant="outline">Enter postal code</Badge>
                        )}
                      </div>
                    </RadioGroup>
                    {deliveryQuote && !deliveryQuote.isFree && deliveryType === "delivery" && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Delivery within 300km of Richmond Hill is FREE. Your location is {deliveryQuote.distance}km away.
                      </p>
                    )}
                    {deliveryQuote?.isFree && deliveryType === "delivery" && (
                      <p className="text-xs text-green-600 mt-3">
                        Great news! Your location qualifies for FREE delivery (within 300km).
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">Please fix the following errors:</p>
                        <ul className="list-disc list-inside mt-2 text-sm text-destructive">
                          {validationErrors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleContinueToPayment} className="w-full h-12" size="lg">
                  Continue to Payment
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Payment Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={purchaseType} onValueChange={(v) => setPurchaseType(v as "finance" | "cash")}>
                      <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-all ${purchaseType === "finance" ? "ring-2 ring-primary" : ""}`}>
                        <RadioGroupItem value="finance" id="finance" />
                        <Label htmlFor="finance" className="flex-1 cursor-pointer">
                          <div className="font-medium">Finance</div>
                          <div className="text-sm text-muted-foreground">Apply for financing with our multi-lender network</div>
                        </Label>
                        <Badge className="bg-green-600">Popular</Badge>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 mt-2 transition-all ${purchaseType === "cash" ? "ring-2 ring-primary" : ""}`}>
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex-1 cursor-pointer">
                          <div className="font-medium">Pay in Full</div>
                          <div className="text-sm text-muted-foreground">Bank draft, wire transfer, or certified cheque</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Protection Plans */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Vehicle Protection Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedProtection} onValueChange={setSelectedProtection}>
                      {PROTECTION_PLANS.map((plan) => (
                        <div key={plan.id} className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${plan.id === "lifeproof" ? "border-primary bg-primary/5" : ""} ${selectedProtection === plan.id ? "ring-2 ring-primary" : ""} ${plan.id !== "none" ? "mt-2" : ""}`}>
                          <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} />
                          <Label htmlFor={`plan-${plan.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{plan.name}</span>
                              {plan.id === "lifeproof" && <Badge className="bg-primary">Best Value</Badge>}
                            </div>
                            {plan.description && <div className="text-sm text-muted-foreground">{plan.description}</div>}
                          </Label>
                          <span className="font-semibold">{plan.price > 0 ? `$${plan.price.toLocaleString()}` : "—"}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {purchaseType === "finance" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Financing Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="downPayment">Down Payment ($)</Label>
                        <Input
                          id="downPayment"
                          type="number"
                          value={formData.downPayment}
                          onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Term</Label>
                        <RadioGroup value={formData.term} onValueChange={(v) => setFormData({ ...formData, term: v })}>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {["24", "36", "48", "60", "72", "84"].map((term) => (
                              <div key={term} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 min-h-[48px]">
                                <RadioGroupItem value={term} id={`term-${term}`} />
                                <Label htmlFor={`term-${term}`} className="cursor-pointer">{term} mo</Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                        <p className="text-2xl font-bold">${(() => {
                          const principal = total - (parseInt(formData.downPayment) || 0)
                          const monthlyRate = 0.0799 / 12 // 7.99% APR
                          const months = parseInt(formData.term)
                          if (principal <= 0) return 0
                          const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
                          return Math.round(payment)
                        })()}/mo</p>
                        <p className="text-xs text-muted-foreground mt-1">*Subject to credit approval. Rates from 6.99% APR OAC.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 h-12">
                    Review Order
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Customer Info Summary */}
                    <div>
                      <h3 className="font-medium mb-2">Customer Information</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{formData.firstName} {formData.lastName}</p>
                        <p>{formData.email}</p>
                        <p>{formData.phone}</p>
                        <p>{formData.address}, {formData.city}, {formData.province} {formData.postalCode}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Summary */}
                    <div>
                      <h3 className="font-medium mb-2">Payment Method</h3>
                      <p className="text-sm text-muted-foreground">
                        {purchaseType === "finance" 
                          ? `Financing - ${formData.term} months, $${formData.downPayment} down`
                          : "Pay in Full"
                        }
                      </p>
                      {purchaseType === "finance" && (
                        <p className="text-sm text-primary mt-2 font-medium">
                          You will complete a full finance application on the next step.
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Delivery */}
                    <div>
                      <h3 className="font-medium mb-2">Delivery Method</h3>
                      <p className="text-sm text-muted-foreground">
                        {deliveryType === "pickup" 
                          ? "Pickup at Dealership - 30 Major Mackenzie Dr E, Richmond Hill"
                          : `Home Delivery - ${formData.address}, ${formData.city}`
                        }
                      </p>
                    </div>

                    <Separator />

                    {/* Terms */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="terms"
                          checked={formData.agreeToTerms}
                          onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                        />
                        <Label htmlFor="terms" className="text-sm leading-snug">
                          I agree to Planet Motors&apos; Terms of Service and understand this is a binding purchase agreement.
                        </Label>
                      </div>
                      {purchaseType === "finance" && (
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="credit"
                            checked={formData.agreeToCredit}
                            onCheckedChange={(checked) => setFormData({ ...formData, agreeToCredit: checked as boolean })}
                          />
                          <Label htmlFor="credit" className="text-sm leading-snug">
                            I authorize Planet Motors to obtain my credit report for financing purposes.
                          </Label>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!formData.agreeToTerms || (purchaseType === "finance" && !formData.agreeToCredit) || isSubmitting}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "Processing..." : purchaseType === "finance" ? "Continue to Finance Application" : "Complete Purchase"}
                  </Button>
                </div>
              </>
            )}

            {step === 4 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Purchase Complete!</h2>
                  <p className="text-muted-foreground mb-6">
                    Congratulations! Your {vehicleData.year} {vehicleData.make} {vehicleData.model} purchase has been submitted.
                  </p>
                  
                  <div className="bg-muted p-6 rounded-lg text-left mb-6 max-w-md mx-auto">
                    <h3 className="font-medium mb-3">What happens next?</h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <Badge variant="outline">1</Badge>
                        <span>Our team will call you within 2 hours to confirm details</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Badge variant="outline">2</Badge>
                        <span>{purchaseType === "finance" ? "We&apos;ll submit your financing application" : "We&apos;ll send payment instructions"}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Badge variant="outline">3</Badge>
                        <span>{deliveryType === "pickup" ? "Schedule your pickup appointment" : "Arrange delivery to your home"}</span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">
                    Confirmation email sent to {formData.email}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild>
                      <Link href="/account">View My Orders</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/inventory">Continue Shopping</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vehicle */}
                <div className="flex gap-3">
                  <Image
                    src={vehicleData.image}
                    alt={`${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`}
                    width={80}
                    height={56}
                    className="object-cover rounded"
                  />
                  <div>
                    <p className="font-medium text-sm">{vehicleData.year} {vehicleData.make} {vehicleData.model}</p>
                    <p className="text-xs text-muted-foreground">{vehicleData.trim}</p>
                    <p className="text-xs text-muted-foreground">{vehicleData.mileage.toLocaleString()} km</p>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Vehicle Price</span>
                    <span>${vehiclePrice.toLocaleString()}</span>
                  </div>
                  {selectedProtection !== "none" && (
                    <div className="flex justify-between text-primary font-medium">
                      <span>{PROTECTION_PLANS.find(p => p.id === selectedProtection)?.name}</span>
                      <span>${protectionPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>OMVIC Fee</span>
                    <span>${omvicFee}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Certification</span>
                    <span>${certificationFee}</span>
                  </div>
{purchaseType === "finance" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Finance Docs Fee</span>
                    <span>${financeDocsFee}</span>
                  </div>
                  )}
                  {deliveryType === "delivery" && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span className={deliveryQuote?.isFree ? "text-green-600 font-medium" : ""}>
                        {deliveryQuote?.isFree ? "FREE" : `$${deliveryFee}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Licensing & Reg. (est.)</span>
                    <span>~${licensingFee}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{taxLabel}</span>
                    <span>${tax.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>

                {purchaseType === "finance" && step >= 2 && (
                  <div className="p-3 bg-primary/5 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Est. Monthly Payment</p>
                    <p className="text-xl font-bold text-primary">
                      ${(() => {
                        const principal = total - (parseInt(formData.downPayment) || 0)
                        const monthlyRate = 0.0799 / 12
                        const months = parseInt(formData.term) || 60
                        if (principal <= 0) return 0
                        const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
                        return Math.round(payment)
                      })()}/mo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">@ 7.99% APR for {formData.term} mo</p>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>10-Day Money Back Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <LockKeyhole className="w-4 h-4" />
                    <span>Secure 256-bit SSL encryption</span>
                  </div>
                </div>

                {/* Need Help */}
                <div className="pt-4 border-t text-center">
                  <p className="text-xs text-muted-foreground mb-2">Need help?</p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href="tel:416-985-2277">
                      <Phone className="w-4 h-4 mr-2" />
                      416-985-2277
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Stripe Checkout Modal */}
      {showStripeCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Complete Payment</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowStripeCheckout(false)}>
                &times;
              </Button>
            </div>
            <div className="p-4">
              <EmbeddedCheckoutProvider stripe={getStripePromise()} options={{ fetchClientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
