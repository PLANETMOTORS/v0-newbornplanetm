/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"
import { Button } from "@/components/ui/button"
import { LockKeyhole, Phone, AlertCircle, Clock, ShoppingCart, X } from "lucide-react"

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
  { id: "personal",   label: "Personal details",     timeEstimate: "3 min" },
  { id: "trade-in",   label: "Trade-in",             timeEstimate: "4 min" },
  { id: "payment",    label: "Cash or finance",      timeEstimate: "2 min" },
  { id: "delivery",   label: "Delivery options",     timeEstimate: "1 min" },
  { id: "protection", label: "PlanetCare Protection", timeEstimate: "1 min" },
  { id: "license",    label: "Driver's license",     timeEstimate: "4 min" },
  { id: "review",     label: "Review order",         timeEstimate: "2 min" },
  { id: "deposit",    label: "Secure with deposit",  timeEstimate: "3 min" },
] as const

export function CheckoutFlow({ vehicleId }: CheckoutFlowProps) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [currentStep, setCurrentStep] = useState(0)
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null)
  const [vehicleLoading, setVehicleLoading] = useState(true)
  const [vehicleError, setVehicleError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(40 * 60) // 40 minute countdown
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const orderSummaryTriggerRef = useRef<HTMLButtonElement>(null)
  const orderSummaryModalRef = useRef<HTMLDivElement>(null)

  // Countdown timer — decrements every second
  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => (t <= 0 ? 0 : t - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  // Track whether email was already prefilled to prevent infinite loop
  const emailPrefilledRef = useRef(false)

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(`/checkout/${vehicleId}`)}`)
    }
  }, [user, authLoading, router, vehicleId])

  // Pre-fill email from auth — runs once
  useEffect(() => {
    if (user?.email && !emailPrefilledRef.current) {
      emailPrefilledRef.current = true
      setPersonal((prev) => ({ ...prev, email: user.email ?? prev.email }))
    }
  }, [user])

  // Restore protection plan selection from sessionStorage (set by /protection-plans page)
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = sessionStorage.getItem("selectedProtectionPackage")
    const validIds: ProtectionPlanId[] = ["none", "essential", "smart", "lifeproof"]
    if (stored && validIds.includes(stored as ProtectionPlanId)) {
      setProtection({ selectedPlan: stored as ProtectionPlanId })
      sessionStorage.removeItem("selectedProtectionPackage")
    }
  }, [])

  // Fetch vehicle data
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/v1/vehicles/${vehicleId}`)
        if (!res.ok) throw new Error(`Vehicle not found (${res.status})`)
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
      } catch (err) {
        if (!cancelled) {
          setVehicleError(err instanceof Error ? err.message : "Failed to load vehicle")
        }
      } finally {
        if (!cancelled) setVehicleLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [vehicleId])

  // Clean up license preview blob URL on unmount
  const licensePreviewRef = useRef(license.licensePreviewUrl)
  licensePreviewRef.current = license.licensePreviewUrl
  useEffect(() => {
    return () => {
      if (licensePreviewRef.current) {
        URL.revokeObjectURL(licensePreviewRef.current)
      }
    }
  }, [])

  // Focus management and keyboard handling for mobile order summary
  useEffect(() => {
    if (showOrderSummary && orderSummaryModalRef.current) {
      // Focus the modal container
      const modalEl = orderSummaryModalRef.current
      const firstFocusable = modalEl.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (firstFocusable) {
        firstFocusable.focus()
      } else {
        modalEl.focus()
      }

      // Handle Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowOrderSummary(false)
        }
      }

      // Focus trap
      const handleFocusTrap = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return

        const focusableElements = modalEl.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstFocusable = focusableElements[0]
        const lastFocusable = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable?.focus()
          }
        } else if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }

      document.addEventListener("keydown", handleKeyDown)
      modalEl.addEventListener("keydown", handleFocusTrap)

      const triggerEl = orderSummaryTriggerRef.current
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        modalEl.removeEventListener("keydown", handleFocusTrap)
        // Restore focus to trigger
        triggerEl?.focus()
      }
    }
  }, [showOrderSummary])

  const markComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]))
  }, [])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
    globalThis.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const advanceFrom = useCallback((step: number) => {
    markComplete(step)
    goToStep(step + 1)
  }, [markComplete, goToStep])

  const handleFinalize = useCallback(() => {
    setIsSubmitting(true)
    markComplete(6)
    goToStep(7)
  }, [markComplete, goToStep])

  // Reset isSubmitting when user navigates back from the deposit step
  useEffect(() => {
    if (currentStep !== 7 && isSubmitting) {
      setIsSubmitting(false)
    }
  }, [currentStep, isSubmitting])

  const sidebarSteps: PurchaseStep[] = STEP_DEFS.map((def, idx) => ({
    id: def.id,
    label: def.label,
    timeEstimate: def.timeEstimate,
    status: completedSteps.has(idx) ? "complete" : (idx === currentStep ? "current" : "upcoming"),
  }))

  // --- Loading / error states ---

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  if (vehicleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading vehicle">
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
        <div className="text-center space-y-4 max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold tracking-[-0.01em]">Vehicle not found</h1>
          <p className="text-muted-foreground">
            {vehicleError || "This vehicle may no longer be available."}
          </p>
          <Button asChild><Link href="/inventory">Browse Inventory</Link></Button>
        </div>
      </div>
    )
  }

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const timerMins = Math.floor(timeLeft / 60)
  const timerSecs = timeLeft % 60
  const timerUrgent = timeLeft < 5 * 60

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" aria-label="Planet Motors home">
            <PlanetMotorsLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Countdown timer */}
            <div className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums ${
              timerUrgent ? "text-red-600" : "text-muted-foreground"
            }`} aria-label={`${timerMins} minutes ${timerSecs} seconds remaining`}>
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{String(timerMins).padStart(2, "0")}:{String(timerSecs).padStart(2, "0")}</span>
            </div>

            {/* Support & Contact */}
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <a href="tel:+18667973332">
                <Phone className="w-4 h-4 mr-1.5" aria-hidden="true" />
                (866) 797-3332
              </a>
            </Button>

            {/* Order Summary toggle (mobile) */}
            <Button
              ref={orderSummaryTriggerRef}
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowOrderSummary(!showOrderSummary)}
              aria-expanded={showOrderSummary}
              aria-controls="mobile-order-summary"
              aria-label="Toggle order summary"
            >
              <ShoppingCart className="w-4 h-4 mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">Order Summary</span>
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyhole className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Secure Checkout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Order Summary Drawer */}
      {showOrderSummary && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/50" onClick={() => setShowOrderSummary(false)}>
          <div
            ref={orderSummaryModalRef}
            id="mobile-order-summary"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-order-summary-title"
            tabIndex={-1}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-background shadow-xl overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="mobile-order-summary-title" className="font-bold">Order Summary</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowOrderSummary(false)} aria-label="Close order summary">
                <X className="w-5 h-5" />
              </Button>
            </div>
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
                if (completedSteps.has(idx) || idx === currentStep) {
                  goToStep(idx)
                  setShowOrderSummary(false)
                }
              }}
              onCancel={() => {
                setShowOrderSummary(false)
                router.push(`/vehicles/${vehicleId}`)
              }}
            />
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 lg:py-8">
        <h1 className="sr-only">Checkout — {vehicleName}</h1>
        <div className="flex flex-col lg:flex-row gap-8">
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
            onCancel={() => router.push(`/vehicles/${vehicleId}`)}
          />

          <section className="flex-1 min-w-0 max-w-2xl" aria-label="Checkout step">
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
                vehicleId={vehicle.id}
                customerEmail={personal.email}
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
                customerName={`${personal.firstName} ${personal.lastName}`.trim()}
                customerPhone={personal.phone}
                protectionPlanId={protection.selectedPlan as ProtectionPlanId}
                licenseStoragePath={license.licenseStoragePath}
              />
            )}

            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-2">Need help with your purchase?</p>
              <Button variant="outline" size="sm" asChild>
                <a href="tel:+18667973332">
                  <Phone className="w-4 h-4 mr-2" aria-hidden="true" />
                  (866) 797-3332
                </a>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}