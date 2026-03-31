"use client"

import { useState, useEffect } from "react"
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
  Phone
} from "lucide-react"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"

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
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup")
  const [deliveryQuote, setDeliveryQuote] = useState<{
    cost: number
    isFree: boolean
    distance: number
    message: string
  } | null>(null)
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(`/checkout/${params.id}`)}`)
    }
  }, [user, isLoading, router, params.id])

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
  
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Address
    address: "",
    city: "",
    province: "ON",
    postalCode: "",
    // Financing
    downPayment: "0",
    term: "60",
    // Terms
    agreeToTerms: false,
    agreeToCredit: false,
  })

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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setStep(4) // Success
    setIsSubmitting(false)
  }

  const vehiclePrice = vehicleData.price
  const omvicFee = 22 // OMVIC regulatory fee
  const certificationFee = 699 // Safety certification
  const adminFee = 499 // Admin fee for financing
  const licensingFee = 59 // Ontario licensing & registration (estimated)
  // Dynamic delivery fee based on postal code distance (free within 300km)
  const deliveryFee = deliveryType === "delivery" 
    ? (deliveryQuote?.cost ?? 299)
    : 0
  // HST applies to vehicle price only (13%)
  const hst = Math.round(vehiclePrice * 0.13)
  // Subtotal before HST
  const subtotalBeforeHst = vehiclePrice + omvicFee + certificationFee + (purchaseType === "finance" ? adminFee : 0) + licensingFee + deliveryFee
  // Total with HST
  const total = subtotalBeforeHst + hst

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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(416) 555-0123"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Toronto"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Province</Label>
                        <Input id="province" value="Ontario" disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code *</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => {
                            // Format Canadian postal code (e.g., M5V 1A1)
                            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                            if (value.length > 3) {
                              value = value.slice(0, 3) + ' ' + value.slice(3, 6)
                            }
                            setFormData({ ...formData, postalCode: value.slice(0, 7) })
                          }}
                          placeholder="M5V 1A1"
                          maxLength={7}
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
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                          <div className="font-medium">Pickup at Dealership</div>
                          <div className="text-sm text-muted-foreground">30 Major Mackenzie Dr E, Richmond Hill</div>
                        </Label>
                        <Badge variant="secondary">FREE</Badge>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 mt-2">
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

                <Button onClick={() => setStep(2)} className="w-full h-12" size="lg">
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
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="finance" id="finance" />
                        <Label htmlFor="finance" className="flex-1 cursor-pointer">
                          <div className="font-medium">Finance</div>
                          <div className="text-sm text-muted-foreground">Apply for financing with our multi-lender network</div>
                        </Label>
                        <Badge className="bg-green-600">Popular</Badge>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 mt-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex-1 cursor-pointer">
                          <div className="font-medium">Pay in Full</div>
                          <div className="text-sm text-muted-foreground">Bank draft, wire transfer, or certified cheque</div>
                        </Label>
                      </div>
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
                    {isSubmitting ? "Processing..." : "Complete Purchase"}
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
                      <span>Admin Fee</span>
                      <span>${adminFee}</span>
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
                    <span>HST (13%)</span>
                    <span>${hst.toLocaleString()}</span>
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
    </div>
  )
}
