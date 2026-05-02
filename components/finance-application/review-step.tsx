import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ApplicantData, VehicleInfo, TradeInInfo, FinancingTerms, FinancingResult } from "./types"

interface ReviewStepProps {
  primaryApplicant: ApplicantData
  coApplicant: ApplicantData | null
  vehicleInfo: VehicleInfo
  tradeIn: TradeInInfo
  financingTerms: FinancingTerms
  financing: FinancingResult
}

export function ReviewStep({ primaryApplicant, coApplicant, vehicleInfo, tradeIn, financingTerms, financing }: Readonly<ReviewStepProps>) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <p className="text-sm text-amber-800">Please review all information carefully before submitting.</p>
      </div>
      
      {/* Primary Applicant Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Primary Applicant</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Name:</span> <span className="font-semibold">{primaryApplicant.firstName} {primaryApplicant.lastName}</span></div>
          <div><span className="text-muted-foreground">Phone:</span> <span className="font-semibold">{primaryApplicant.phone}</span></div>
          <div><span className="text-muted-foreground">Email:</span> <span className="font-semibold">{primaryApplicant.email}</span></div>
          <div><span className="text-muted-foreground">Address:</span> <span className="font-semibold">{primaryApplicant.streetNumber} {primaryApplicant.streetName}, {primaryApplicant.city}</span></div>
          <div><span className="text-muted-foreground">Employer:</span> <span className="font-semibold">{primaryApplicant.employerName}</span></div>
          <div><span className="text-muted-foreground">Annual Income:</span> <span className="font-semibold">${primaryApplicant.annualTotal}</span></div>
          <div><span className="text-muted-foreground">Credit Rating:</span> <span className="font-semibold capitalize">{primaryApplicant.creditRating}</span></div>
        </CardContent>
      </Card>
      
      {/* Co-Applicant Summary */}
      {coApplicant && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Co-Applicant</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-semibold">{coApplicant.firstName} {coApplicant.lastName}</span></div>
            <div><span className="text-muted-foreground">Phone:</span> <span className="font-semibold">{coApplicant.phone}</span></div>
            <div><span className="text-muted-foreground">Employer:</span> <span className="font-semibold">{coApplicant.employerName}</span></div>
            <div><span className="text-muted-foreground">Annual Income:</span> <span className="font-semibold">${coApplicant.annualTotal}</span></div>
          </CardContent>
        </Card>
      )}
      
      {/* Vehicle Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vehicle & Financing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-semibold">{vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}</span></div>
          <div><span className="text-muted-foreground">Price:</span> <span className="font-semibold">${Number.parseFloat(vehicleInfo.totalPrice).toLocaleString()}*</span></div>
          <div><span className="text-muted-foreground">Down Payment:</span> <span className="font-semibold">${Number.parseFloat(vehicleInfo.downPayment).toLocaleString()}</span></div>
          <div><span className="text-muted-foreground">Term:</span> <span className="font-semibold">{financingTerms.loanTermMonths} months</span></div>
          <div><span className="text-muted-foreground">Payment:</span> <span className="font-semibold">${financing.payment.toFixed(2)}/{financingTerms.paymentFrequency}</span></div>
          <div><span className="text-muted-foreground">Amount Financed:</span> <span className="font-semibold">${financing.amountFinanced.toLocaleString()}</span></div>
          <div className="col-span-full">
            <p className="text-xs text-muted-foreground italic">*Advertised price is an estimate. Final all-in price including all fees and taxes will be confirmed at signing per OMVIC regulations.</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Trade-In Summary */}
      {tradeIn.hasTradeIn && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Trade-In Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-semibold">{tradeIn.year} {tradeIn.make} {tradeIn.model}</span></div>
            <div><span className="text-muted-foreground">Value:</span> <span className="font-semibold">${(Number.parseFloat(tradeIn.estimatedValue) || 0).toLocaleString()}</span></div>
            {tradeIn.hasLien && (
              <div><span className="text-muted-foreground">Lien:</span> <span className="font-semibold">${Number.parseFloat(tradeIn.lienAmount).toLocaleString()}</span></div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
