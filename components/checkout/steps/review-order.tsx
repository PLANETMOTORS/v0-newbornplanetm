"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Pencil } from "lucide-react"
import type { PersonalDetailsData } from "./personal-details"
import type { TradeInData } from "./trade-in"
import type { PaymentMethodData } from "./payment-method"
import type { DeliveryData } from "./delivery-options"
import type { ProtectionPlanId } from "./protection-plans"
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"
import { OMVIC_FEE, CERTIFICATION_FEE, LICENSING_FEE } from "@/lib/pricing/format"
import { DEALERSHIP_LOCATION, DEALERSHIP_ADDRESS_FULL } from "@/lib/constants/dealership"

const PROVINCE_NAME_TO_CODE: Record<string, string> = {
  'Ontario': 'ON', 'British Columbia': 'BC', 'Alberta': 'AB', 'Quebec': 'QC',
  'Nova Scotia': 'NS', 'New Brunswick': 'NB', 'Prince Edward Island': 'PE',
  'Manitoba': 'MB', 'Saskatchewan': 'SK', 'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT', 'Yukon': 'YT', 'Nunavut': 'NU',
}

const PROTECTION_PRICES: Record<string, { name: string; price: number }> = {
  none: { name: "No Protection", price: 0 },
  essential: { name: "PlanetCare Essential Shield", price: 1950 },
  smart: { name: "PlanetCare Smart Secure", price: 3000 },
  lifeproof: { name: "PlanetCare Life Proof", price: 4850 },
}

interface ReviewOrderStepProps {
  vehicle: {
    price: number
    year: number
    make: string
    model: string
    trim?: string
    mileage?: number
    imageUrl?: string
  }
  personal: PersonalDetailsData
  tradeIn: TradeInData
  paymentMethod: PaymentMethodData
  delivery: DeliveryData
  protectionPlan: ProtectionPlanId
  agreeToTerms: boolean
  onAgreeToTermsChange: (v: boolean) => void
  onEditStep: (step: number) => void
  onFinalize: () => void
  isSubmitting: boolean
}

export function ReviewOrderStep({
  vehicle,
  personal,
  tradeIn,
  paymentMethod,
  delivery,
  protectionPlan,
  agreeToTerms,
  onAgreeToTermsChange,
  onEditStep,
  onFinalize,
  isSubmitting,
}: ReviewOrderStepProps) {
  const protection = PROTECTION_PRICES[protectionPlan] ?? PROTECTION_PRICES.none
  const deliveryFee = delivery.deliveryType === "delivery" ? delivery.deliveryCost : 0
  const financeDocsFee = paymentMethod.purchaseType === "finance" || paymentMethod.purchaseType === "pre-approved" ? 895 : 0
  const depositAmount = 250

  const provinceCode = PROVINCE_NAME_TO_CODE[personal.province] || "ON"
  const provinceTax = PROVINCE_TAX_RATES[provinceCode] || PROVINCE_TAX_RATES.ON
  const formatPct = (rate: number) => Number.parseFloat((rate * 100).toFixed(3)).toString()
  const taxLabel = provinceTax.hst > 0
    ? `HST (${formatPct(provinceTax.hst)}%)`
    : provinceTax.pst > 0
      ? `GST+PST (${formatPct(provinceTax.total)}%)`
      : `GST (${formatPct(provinceTax.gst)}%)`

  const subtotal =
    vehicle.price +
    protection.price +
    OMVIC_FEE +
    CERTIFICATION_FEE +
    financeDocsFee +
    LICENSING_FEE +
    deliveryFee -
    tradeIn.tradeInValue

  const tax = Math.round(subtotal * provinceTax.total)
  const total = subtotal + tax

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em] mb-1">Review your order</h1>
        <p className="text-muted-foreground">
          Please review all details before finalizing your purchase.
        </p>
      </div>

      {/* Personal Details */}
      <ReviewSection title="Personal details" editLabel="Edit personal details" onEdit={() => onEditStep(0)}>
        <p>{personal.firstName} {personal.lastName}</p>
        <p className="text-muted-foreground">{personal.email}</p>
        <p className="text-muted-foreground">{personal.phone}</p>
        <p className="text-muted-foreground">
          {personal.address}{personal.unit ? `, ${personal.unit}` : ""}, {personal.city}, {personal.province} {personal.postalCode}
        </p>
      </ReviewSection>

      {/* Trade-in */}
      <ReviewSection title="Trade-in" editLabel="Edit trade-in" onEdit={() => onEditStep(1)}>
        {tradeIn.hasTradeIn && tradeIn.tradeInValue > 0 ? (
          <>
            <p>{tradeIn.tradeInVehicle}</p>
            <p className="text-green-600 font-semibold">-${tradeIn.tradeInValue.toLocaleString()}</p>
          </>
        ) : (
          <p className="text-muted-foreground">No trade-in</p>
        )}
      </ReviewSection>

      {/* Payment Method */}
      <ReviewSection title="Payment method" editLabel="Edit payment method" onEdit={() => onEditStep(2)}>
        <p>
          {paymentMethod.purchaseType === "finance"
            ? "Finance with Planet Motors"
            : paymentMethod.purchaseType === "pre-approved"
              ? `Pre-approved with ${paymentMethod.preApprovedLender || "another lender"}`
              : "Pay with cash"}
        </p>
      </ReviewSection>

      {/* Delivery */}
      <ReviewSection title="Delivery" editLabel="Edit delivery options" onEdit={() => onEditStep(3)}>
        <p>
          {delivery.deliveryType === "pickup"
            ? `Pickup at Planet Motors — ${DEALERSHIP_ADDRESS_FULL}`
            : `Home delivery — ${personal.address}, ${personal.city}`
          }
        </p>
        {delivery.deliveryType === "delivery" && delivery.deliveryCost > 0 && (
          <p className="text-muted-foreground">${delivery.deliveryCost.toLocaleString()}</p>
        )}
      </ReviewSection>

      {/* Protection */}
      <ReviewSection title="Protection plan" editLabel="Edit protection plan" onEdit={() => onEditStep(4)}>
        <p>{protection.name}</p>
        {protection.price > 0 && (
          <p className="text-muted-foreground">${protection.price.toLocaleString()}</p>
        )}
      </ReviewSection>

      {/* Price breakdown */}
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Vehicle price</span>
            <span>${vehicle.price.toLocaleString()}</span>
          </div>
          {protection.price > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>{protection.name}</span>
              <span>${protection.price.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>OMVIC Fee</span>
            <span>${OMVIC_FEE}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Certification</span>
            <span>${CERTIFICATION_FEE}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Licensing</span>
            <span>${LICENSING_FEE}</span>
          </div>
          {financeDocsFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Finance Docs Fee</span>
              <span>${financeDocsFee}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span>${deliveryFee.toLocaleString()}</span>
            </div>
          )}
          {tradeIn.tradeInValue > 0 && (
            <div className="flex justify-between text-green-600 font-semibold">
              <span>Trade-in credit</span>
              <span>-${tradeIn.tradeInValue.toLocaleString()}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-muted-foreground">
            <span>{taxLabel}</span>
            <span>${tax.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            A ${depositAmount} refundable deposit secures this vehicle. Remaining balance due at
            delivery/pickup.
          </p>
        </CardContent>
      </Card>

      {/* Terms */}
      <div className="flex items-start gap-3 p-4 border rounded-lg">
        <Checkbox
          id="agreeToTerms"
          checked={agreeToTerms}
          onCheckedChange={(checked) => onAgreeToTermsChange(checked as boolean)}
        />
        <Label htmlFor="agreeToTerms" className="text-sm leading-snug cursor-pointer">
          I agree to Planet Motors&apos; Terms of Service and Privacy Policy. I understand this is a
            binding purchase agreement and authorize the ${depositAmount} refundable deposit.
        </Label>
      </div>

      <Button
        onClick={onFinalize}
        disabled={!agreeToTerms || isSubmitting}
        className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
      >
        {isSubmitting ? "Processing…" : "Finalize Purchase"}
      </Button>
    </div>
  )
}

function ReviewSection({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string
  editLabel?: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onEdit}
            aria-label={editLabel ?? `Edit ${title}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            Edit
          </button>
        </div>
        <div className="text-sm space-y-0.5">{children}</div>
      </CardContent>
    </Card>
  )
}
