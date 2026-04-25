"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LockKeyhole, Shield, Clock, CheckCircle, CreditCard, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import dynamic from 'next/dynamic'
import { createReservation } from "@/app/actions/reservation"
import { PHONE_LOCAL, PHONE_LOCAL_TEL } from "@/lib/constants/dealership"

// Lazy-load Stripe — only fetched when user reaches the payment step
const EmbeddedCheckoutProvider = dynamic(
  () => import('@stripe/react-stripe-js').then(m => ({ default: m.EmbeddedCheckoutProvider })),
  { ssr: false }
)
const EmbeddedCheckout = dynamic(
  () => import('@stripe/react-stripe-js').then(m => ({ default: m.EmbeddedCheckout })),
  { ssr: false }
)

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
// Defer loadStripe until first use — avoids loading the 40 KB Stripe.js on every VDP
let stripePromise: ReturnType<typeof import('@stripe/stripe-js').loadStripe> | null = null
function getStripePromise() {
  if (!stripePromise && stripeKey) {
    stripePromise = import('@stripe/stripe-js').then(m => m.loadStripe(stripeKey))
  }
  return stripePromise
}

interface ReserveVehicleModalProps {
  vehicle: {
    id: string
    year: number
    make: string
    model: string
    trim?: string
    price: number
    image: string
    stockNumber: string
  }
  trigger?: React.ReactNode
}

export function ReserveVehicleModal({ vehicle, trigger }: ReserveVehicleModalProps) {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    agreeToTerms: false,
  })

  const [showStripeCheckout, setShowStripeCheckout] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const depositAmount = 250

  const handleSubmit = async () => {
    try {
      setIsProcessing(true)
      setCheckoutError(null)
      setClientSecret(null)

      const result = await createReservation({
        vehicleId: vehicle.id,
        stockNumber: vehicle.stockNumber,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
      })

      if (!result.success || !result.clientSecret) {
        setCheckoutError(result.error || "Failed to initialize payment. Please try again.")
        return
      }

      setClientSecret(result.clientSecret)
      setShowStripeCheckout(true)
    } catch (error) {
      console.error("Error creating reservation:", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      const normalizedMessage = message.toLowerCase()
      if (normalizedMessage.includes("not available") || normalizedMessage.includes("not found")) {
        setCheckoutError("This vehicle is no longer available for reservation.")
      } else if (normalizedMessage.includes("rate limit") || normalizedMessage.includes("too many")) {
        setCheckoutError("Too many attempts. Please wait a few minutes and try again.")
      } else {
        setCheckoutError(`Unable to process your reservation right now. Please try again or call us at ${PHONE_LOCAL}.`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="w-full">
            <LockKeyhole className="w-4 h-4 mr-2" />
            Reserve for ${depositAmount} CAD
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {step === 1 && !showStripeCheckout && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LockKeyhole className="w-5 h-5 text-primary" />
                Reserve This Vehicle
              </DialogTitle>
              <DialogDescription>
                Lock in your {vehicle.year} {vehicle.make} {vehicle.model} with a fully refundable ${depositAmount} deposit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Vehicle Summary */}
              <div className="flex gap-4 p-3 bg-muted rounded-lg">
                <Image
                  src={vehicle.image || "/placeholder.svg"}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  width={96}
                  height={64}
                  className="object-cover rounded"
                />
                <div>
                  <p className="font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                  {vehicle.trim && <p className="text-sm text-muted-foreground">{vehicle.trim}</p>}
                  <p className="text-lg font-bold text-primary">${vehicle.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>100% Refundable</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>48-Hour Hold</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>No Obligation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                  <span>Priority Service</span>
                </div>
              </div>

              <Separator />

              {/* Deposit Summary */}
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                <div>
                  <p className="font-semibold">Refundable Deposit</p>
                  <p className="text-xs text-muted-foreground">Applied to purchase price</p>
                </div>
                <p className="text-2xl font-bold">${depositAmount} CAD</p>
              </div>

              <Button onClick={() => setStep(2)} className="w-full" size="lg">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our reservation terms. Your deposit is fully refundable if you change your mind.
              </p>
            </div>
          </>
        )}

        {step === 2 && !showStripeCheckout && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Reservation</DialogTitle>
              <DialogDescription>
                Enter your details to reserve the {vehicle.year} {vehicle.make} {vehicle.model}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(416) 555-0123"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                />
                <Label htmlFor="terms" className="text-sm leading-snug">
                  I agree to the reservation terms and understand my ${depositAmount} deposit is fully refundable within 48 hours.
                </Label>
              </div>

              <Separator />

              {checkoutError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {checkoutError}
                </div>
              ) : null}

              <div className="flex justify-between items-center text-sm">
                <span>Refundable Deposit</span>
                <span className="font-bold">${depositAmount} CAD</span>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.agreeToTerms || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay ${depositAmount}
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <LockKeyhole className="w-3 h-3" />
                Secured by Stripe. 256-bit encryption.
              </div>
            </div>
          </>
        )}

        {step === 3 && !showStripeCheckout && (
          <>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="mb-2">Vehicle Reserved!</DialogTitle>
              <DialogDescription className="mb-6">
                Your {vehicle.year} {vehicle.make} {vehicle.model} is now reserved for the next 48 hours.
              </DialogDescription>

              <div className="bg-muted p-4 rounded-lg text-left mb-6">
                <p className="text-sm font-semibold mb-2">What happens next?</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">1</Badge>
                    Our team will contact you within 2 hours to discuss your purchase
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">2</Badge>
                    Schedule a test drive or arrange delivery
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">3</Badge>
                    Complete financing and finalize your purchase
                  </li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Confirmation sent to {formData.email}
              </p>

              <Button className="w-full" onClick={() => globalThis.location.href = "/account"}>
                View My Reservation
              </Button>
            </div>
          </>
        )}
      {showStripeCheckout && (
          <div className="py-4">
            <h3 className="font-semibold mb-4">Complete Your ${depositAmount} Deposit</h3>
            {checkoutError ? (
              <div className="text-center py-8">
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 mb-4">
                  <p className="text-sm text-destructive">{checkoutError}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    disabled={isProcessing}
                    onClick={async () => {
                      if (isProcessing) return
                      setCheckoutError(null)
                      setClientSecret(null)
                      await handleSubmit()
                    }}
                  >
                    {isProcessing ? "Retrying..." : "Try Again"}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`tel:${PHONE_LOCAL_TEL}`}>Call Support</a>
                  </Button>
                </div>
              </div>
            ) : !clientSecret ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span>Initializing payment...</span>
              </div>
            ) : (
              <EmbeddedCheckoutProvider stripe={getStripePromise()} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
            <Button variant="ghost" className="w-full mt-4" onClick={() => { setShowStripeCheckout(false); setClientSecret(null); }}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
