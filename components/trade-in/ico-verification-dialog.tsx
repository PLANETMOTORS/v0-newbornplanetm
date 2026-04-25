"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Mail, Phone, Loader2, Star, ArrowRight } from "lucide-react"
import { isValidEmail, isValidCanadianPhoneNumber, formatCanadianPhoneNumber } from "@/lib/validation"

interface ICOVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteResult: {
    quoteId: string
    lowValue: number
    midValue: number
    highValue: number
    vehicle: string
  } | null
  formData: {
    mileage: string
    postalCode: string
    name: string
    email: string
    phone: string
  }
  onFormDataChange: (field: string, value: string) => void
  onProceed: () => void
}

export function ICOVerificationDialog({
  open,
  onOpenChange,
  quoteResult,
  formData,
  onFormDataChange,
  onProceed,
}: ICOVerificationDialogProps) {
  const [step, setStep] = useState<"contact" | "verify" | "result">("contact")
  const [verificationCode, setVerificationCode] = useState("")
  const [verifyMethod, setVerifyMethod] = useState<"email" | "phone">("email")
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const sendVerificationCode = async (method: "email" | "phone") => {
    setVerifyMethod(method)
    setIsSendingCode(true)
    
    try {
      await fetch("/api/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          destination: method === "email" ? formData.email : formData.phone,
          purpose: "ico_quote",
          vehicleInfo: quoteResult?.vehicle,
        }),
      })
    } catch {
      // Continue anyway — server generates and stores the code
    }
    setStep("verify")
    setIsSendingCode(false)
  }

  const verifyCode = async () => {
    setIsVerifying(true)
    try {
      const destination = verifyMethod === "email" ? formData.email : formData.phone
      const response = await fetch("/api/verify/check-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, code: verificationCode }),
      })
      const result = await response.json()
      if (result.verified) {
        setStep("result")
      }
    } catch {
      // Verification failed — user can retry
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClose = () => {
    setStep("contact")
    setVerificationCode("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* Step 1: Contact Info */}
        {step === "contact" && (
          <>
            <DialogHeader>
              <DialogTitle>Verify to See Your Quote</DialogTitle>
              <DialogDescription>
                Enter your contact info to view your instant cash offer for {quoteResult?.vehicle}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="ico-name">Name</Label>
                <Input
                  id="ico-name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => onFormDataChange("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ico-email">Email</Label>
                <Input
                  id="ico-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => onFormDataChange("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ico-phone">Phone</Label>
                <Input
                  id="ico-phone"
                  type="tel"
                  placeholder="(416) 555-1234"
                  value={formData.phone}
                  onChange={(e) => onFormDataChange("phone", formatCanadianPhoneNumber(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => sendVerificationCode("email")}
                disabled={!formData.name || !isValidEmail(formData.email) || isSendingCode}
              >
                <Mail className="w-4 h-4 mr-2" />
                {isSendingCode ? "Sending..." : "Verify via Email"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => sendVerificationCode("phone")}
                disabled={!formData.name || !isValidCanadianPhoneNumber(formData.phone) || isSendingCode}
              >
                <Phone className="w-4 h-4 mr-2" />
                {isSendingCode ? "Sending..." : "Verify via SMS"}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Verification */}
        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Enter Verification Code
              </DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to your {verifyMethod === "email" ? "email" : "phone"}: {verifyMethod === "email" ? formData.email : formData.phone}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="ico-verify-code">Verification Code</Label>
              <Input
                id="ico-verify-code"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replaceAll(/\D/g, "").slice(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button
                className="w-full"
                onClick={verifyCode}
                disabled={verificationCode.length !== 6 || isVerifying}
              >
                {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isVerifying ? "Verifying..." : "Verify & View Quote"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep("contact")}>
                Back
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Show Quote Result */}
        {step === "result" && quoteResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Your Instant Cash Offer
              </DialogTitle>
              <DialogDescription>{quoteResult.vehicle}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Estimated Value Range</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg text-muted-foreground">${quoteResult.lowValue.toLocaleString()}</span>
                  <span className="text-3xl font-bold text-primary">${quoteResult.midValue.toLocaleString()}</span>
                  <span className="text-lg text-muted-foreground">${quoteResult.highValue.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quote ID:</span>
                  <span className="font-mono">{quoteResult.quoteId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mileage:</span>
                  <span>{Number.parseInt(formData.mileage).toLocaleString()} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{formData.postalCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valid for:</span>
                  <span>7 days</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                <Star className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Complete the full appraisal to lock in your best offer!
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="sm:flex-1">
                Get New Quote
              </Button>
              <Button onClick={onProceed} className="sm:flex-1">
                Continue to Full Appraisal
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
