"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LockKeyhole, Shield, Clock, CheckCircle, CreditCard, ArrowRight, Sparkles } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { startVehicleCheckout } from "@/app/actions/stripe"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

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

  const getClientSecret = useCallback(
    () => startVehicleCheckout({
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      vehiclePriceCents: depositAmount * 100,
      depositOnly: true,
      customerEmail: formData.email,
    }),
    [vehicle, formData.email]
  )

  const handleSubmit = async () => {
    setIsProcessing(true)
    setShowStripeCheckout(true)
    setIsProcessing(false)
  }

  const depositAmount = 250

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
        {step === 1 && (
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
                  <Clock className="w-4 h-4 text-blue-600" />
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
                  <p className="font-medium">Refundable Deposit</p>
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

        {step === 2 && (
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
                  placeholder="416-985-2277"
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

        {step === 3 && (
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
                <p className="text-sm font-medium mb-2">What happens next?</p>
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

              <Button className="w-full" onClick={() => window.location.href = "/account"}>
                View My Reservation
              </Button>
            </div>
          </>
        )}
      {showStripeCheckout && (
          <div className="py-4">
            <h3 className="font-medium mb-4">Complete Your ${depositAmount} Deposit</h3>
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret: getClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
            <Button variant="ghost" className="w-full mt-4" onClick={() => setShowStripeCheckout(false)}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
