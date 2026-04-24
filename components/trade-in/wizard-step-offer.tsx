"use client"
import { useTradeIn } from "./trade-in-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isValidEmail, isValidCanadianPhoneNumber, isValidCanadianPostalCode } from "@/lib/validation"
import { DollarSign, Shield, Sparkles, AlertCircle } from "lucide-react"

export function WizardStepOffer() {
  const { selectedYear, selectedMake, selectedModel, selectedTrim, mileage, condition, hasAccident, email, phone, postalCode, emailError, phoneError, postalCodeError, handleEmailChange, handlePhoneChange, handlePostalCodeChange, calculateOffer, prevStep } = useTradeIn()
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Get Your Instant Offer</CardTitle>
        <CardDescription>Enter your contact info to receive your offer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="font-semibold text-lg">{selectedYear} {selectedMake} {selectedModel} {selectedTrim}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            <span>{mileage ? parseInt(mileage).toLocaleString() : "0"} km</span>
            <span>|</span>
            <span className="capitalize">{condition} condition</span>
            {hasAccident && <><span>|</span><span>Accident history</span></>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email Address <span className="text-destructive">*</span></Label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => handleEmailChange(e.target.value)} className={emailError ? "border-destructive" : ""} />
            {emailError ? <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{emailError}</p> : <p className="text-xs text-muted-foreground">Example: name@email.com</p>}
          </div>
          <div className="space-y-2">
            <Label>Phone Number <span className="text-destructive">*</span></Label>
            <Input type="tel" placeholder="(416) 555-1234" value={phone} onChange={(e) => handlePhoneChange(e.target.value)} className={phoneError ? "border-destructive" : ""} />
            {phoneError ? <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{phoneError}</p> : <p className="text-xs text-muted-foreground">Format: (416) 555-1234</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Postal Code <span className="text-destructive">*</span></Label>
            <Input placeholder="A1A 1A1" value={postalCode} onChange={(e) => handlePostalCodeChange(e.target.value)} className={`max-w-xs uppercase ${postalCodeError ? "border-destructive" : ""}`} />
            {postalCodeError ? <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{postalCodeError}</p> : <p className="text-xs text-muted-foreground">Format: A1A 1A1 - For scheduling free pickup</p>}
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div><p className="font-semibold text-green-900 dark:text-green-100">Your privacy is protected</p><p className="text-sm text-green-700 dark:text-green-300">We never share your information. No spam calls, guaranteed.</p></div>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
          <Button onClick={calculateOffer} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-lg" disabled={!email || !phone || !postalCode || !isValidEmail(email) || !isValidCanadianPhoneNumber(phone) || !isValidCanadianPostalCode(postalCode)}>
            <Sparkles className="mr-2 h-5 w-5" />Get My Offer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
