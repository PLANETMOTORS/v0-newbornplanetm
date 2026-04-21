"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"
import { Button } from "@/components/ui/button"
import { LockKeyhole, ArrowLeft, Phone } from "lucide-react"

import { PurchaseSidebar, type PurchaseStep } from "./purchase-sidebar"
import { PersonalDetailsStep, type PersonalDetailsData } from "./steps/personal-details"
import { TradeInStep, type TradeInData } from "./steps/trade-in"
import { PaymentMethodStep, type PaymentMethodData } from "./steps/payment-method"
import { DeliveryOptionsStep, type DeliveryData } from "./steps/delivery-options"
import { ProtectionPlansStep, type ProtectionPlanId, type ProtectionData } from "./steps/protection-plans"
import { DriversLicenseStep, type DriversLicenseData } from "./steps/drivers-license"
import { DepositPaymentStep } from "./steps/deposit-payment"
import { ReviewOrderStep } from "./steps/review-order"

interface VehicleInfo {
  id: string
  year: number
  make: string
  model: string
  trim: string
  price: number
  mileage: number
  imageUrl: string
}

interface CheckoutFlowProps {
  vehicleId: string
}

const STEP_DEFS = [
  { id: "personal",   label: "Personal details",  timeEstimate: "3 min" },
  { id: "trade-in",   label: "Trade-in",           timeEstimate: "4 min" },
  { id: "payment",    label: "Cash or finance",    timeEstimate: "2 min" },
  { id: "delivery",   label: "Delivery options",   timeEstimate: "1 min" },
  { id: "protection", label: "PlanetCare Protection", timeEstimate: "1 min" },
  { id: "license",    label: "Driver's license",   timeEstimate: "4 min" },
  { id: "review",     label: "Review order",        timeEstimate: "2 min" },
  { id: "deposit",    label: "Secure with deposit", timeEstimate: "3 min" },
] as const

export function CheckoutFlow({ vehicleId }: CheckoutFlowProps) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [currentStep, setCurrentStep] = useState(0)
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null)
  const [vehicleLoading, setVehicleLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step data
  const [personal, setPersonal] = useState<PersonalDetailsData>({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", unit: "", city: "", province: "Ontario", postalCode: "",
    sameDeliveryAddress: true,
    deliveryAddress: "", deliveryCity: "", deliveryProvince: "Ontario", deliveryPostalCode: "",
  })
  const [tradeIn, setTradeIn] = useState<TradeInData>({
    hasTradeIn: null, tradeInValue: 0, tradeInVehicle: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodData>({
    purchaseType: "finance",
  })
  const [delivery, setDelivery] = useState<DeliveryData>({
    deliveryType: "pickup", deliveryCost: 0, deliveryDistance: 0, deliveryMessage: "",
  })
  const [protection, setProtection] = useState<ProtectionData>({
    selectedPlan: "none",
  })
  const [license, setLicense] = useState<DriversLicenseData>({
    licenseFile: null, licensePreviewUrl: "", licenseFirstName: "", licenseLastName: "",
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  // Track which steps are complete
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(`/checkout/${vehicleId}`)}`)
    }
  }, [user, authLoading, router, vehicleId])

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email && !personal.email) {
      setPersonal((prev) => ({ ...prev, email: user.email ?? prev.email }))
    }
  }, [user, personal.email])

  // Fetch vehicle data
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/v1/vehicles/${vehicleId}`)
        if (!res.ok) throw new Error("Vehicle not found")
        const json = await res.json()
        const v = json.data?.vehicle ?? json.data
        if (!cancelled && v) {
          setVehicle({
            id: v.id ?? vehicleId,
            year: v.year ?? 0,
            make: v.make ?? "",
            model: v.model ?? "",
            trim: v.trim ?? "",
            price: typeof v.price === "number" ? v.price : 0,
            mileage: v.mileage ?? 0,
            imageUrl: v.primary_image_url ?? "",
          })
        }
      } catch {
        // Vehicle not found — will show error state
      } finally {
        if (!cancelled) setVehicleLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [vehicleId])

  const markComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]))
  }, [])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const advanceFrom = useCallback((step: number) => {
    markComplete(step)
    goToStep(step + 1)
  }, [markComplete, goToStep])

  const handleFinalize = useCallback(() => {
    setIsSubmitting(true)
    markComplete(6)
    // Review complete → advance to deposit payment (step 7)
    goToStep(7)
    setIsSubmitting(false)
  }, [markComplete, goToStep])

  // Build sidebar steps
  const sidebarSteps: PurchaseStep[] = STEP_DEFS.map((def, idx) => ({
    id: def.id,
    label: def.label,
    timeEstimate: def.timeEstimate,
    status: completedSteps.has(idx)
      ? "complete"
      : idx === currentStep
        ? "current"
        : "upcoming",
  }))

  // Loading states
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  if (vehicleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vehicle details…</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Vehicle not found</h2>
          <p className="text-muted-foreground">This vehicle may no longer be available.</p>
          <Button asChild><Link href="/inventory">Browse Inventory</Link></Button>
        </div>
      </div>
    )
  }

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`

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
              <span className="hidden sm:inline">Secure Checkout</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/vehicles/${vehicleId}`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Back to Vehicle</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <PurchaseSidebar
            vehicle={{
              year: vehicle.year,
              make: vehicle.make,
              model: vehicle.model,
              trim: vehicle.trim,
              imageUrl: vehicle.imageUrl,
            }}
            steps={sidebarSteps}
            onStepClick={(idx) => {
              if (completedSteps.has(idx) || idx === currentStep) goToStep(idx)
            }}
          />

          {/* Main content */}
          <section className="flex-1 min-w-0 max-w-2xl">
            {currentStep === 0 && (
              <PersonalDetailsStep
                data={personal}
                onChange={setPersonal}
                onContinue={() => advanceFrom(0)}
              />
            )}

            {currentStep === 1 && (
              <TradeInStep
                data={tradeIn}
                onChange={setTradeIn}
                onContinue={() => advanceFrom(1)}
              />
            )}

            {currentStep === 2 && (
              <PaymentMethodStep
                data={paymentMethod}
                onChange={setPaymentMethod}
                onContinue={() => advanceFrom(2)}
              />
            )}

            {currentStep === 3 && (
              <DeliveryOptionsStep
                data={delivery}
                postalCode={personal.postalCode}
                onChange={setDelivery}
                onContinue={() => advanceFrom(3)}
              />
            )}

            {currentStep === 4 && (
              <ProtectionPlansStep
                data={protection}
                onChange={setProtection}
                onContinue={() => advanceFrom(4)}
              />
            )}

            {currentStep === 5 && (
              <DriversLicenseStep
                data={license}
                prefillFirstName={personal.firstName}
                prefillLastName={personal.lastName}
                onChange={setLicense}
                onContinue={() => advanceFrom(5)}
              />
            )}

            {currentStep === 6 && (
              <ReviewOrderStep
                vehicle={vehicle}
                personal={personal}
                tradeIn={tradeIn}
                paymentMethod={paymentMethod}
                delivery={delivery}
                protectionPlan={protection.selectedPlan as ProtectionPlanId}
                agreeToTerms={agreeToTerms}
                onAgreeToTermsChange={setAgreeToTerms}
                onEditStep={goToStep}
                onFinalize={handleFinalize}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStep === 7 && (
              <DepositPaymentStep
                vehicleId={vehicle.id}
                vehicleName={vehicleName}
                customerEmail={personal.email}
                protectionPlanId={protection.selectedPlan as ProtectionPlanId}
              />
            )}

            {/* Help footer */}
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-2">Need help with your purchase?</p>
              <Button variant="outline" size="sm" asChild>
                <a href="tel:416-985-2277">
                  <Phone className="w-4 h-4 mr-2" />
                  416-985-2277
                </a>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
