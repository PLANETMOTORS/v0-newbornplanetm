"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Car, DollarSign, ArrowRight, Check, Clock, Shield, MapPin, AlertCircle } from "lucide-react"
import { 
  getAllMakes, 
  getModelsForMake, 
  getTrimsForModel, 
  getYears,
  isValidPostalCode,
  formatPostalCode,
  type VehicleTrim
} from "@/lib/vehicle-data"
import {
  isValidEmail,
  isValidCanadianPhoneNumber,
  isValidName,
  formatCanadianPhoneNumber,
  ValidationMessages
} from "@/lib/validation"

interface QuoteResult {
  quoteId: string
  estimate: {
    low: number
    high: number
    average: number
  }
  validUntil: string
}

export function InstantQuote() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null)

  // Vehicle data
  const years = getYears()
  const makes = getAllMakes()
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [availableTrims, setAvailableTrims] = useState<VehicleTrim[]>([])

  // Postal code validation
  const [postalCodeError, setPostalCodeError] = useState<string>("")
  
  // Contact form validation errors
  const [nameError, setNameError] = useState<string>("")
  const [emailError, setEmailError] = useState<string>("")
  const [phoneError, setPhoneError] = useState<string>("")

  const [formData, setFormData] = useState({
    year: "",
    make: "",
    model: "",
    trim: "",
    mileage: "",
    condition: "",
    postalCode: "",
    vin: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  })

  // Update models when make changes
  useEffect(() => {
    if (formData.make) {
      const models = getModelsForMake(formData.make)
      setAvailableModels(models)
      // Reset model and trim when make changes
      setFormData(prev => ({ ...prev, model: "", trim: "" }))
      setAvailableTrims([])
    } else {
      setAvailableModels([])
      setAvailableTrims([])
    }
  }, [formData.make])

  // Update trims when model changes
  useEffect(() => {
    if (formData.make && formData.model) {
      const trims = getTrimsForModel(formData.make, formData.model)
      setAvailableTrims(trims)
      // Reset trim when model changes
      setFormData(prev => ({ ...prev, trim: "" }))
    } else {
      setAvailableTrims([])
    }
  }, [formData.make, formData.model])

  // Validate postal code
  const handlePostalCodeChange = (value: string) => {
    const formatted = formatPostalCode(value)
    setFormData({ ...formData, postalCode: formatted })
    
    if (formatted.length >= 6) {
      if (!isValidPostalCode(formatted)) {
        setPostalCodeError("Please enter a valid Canadian postal code")
      } else {
        setPostalCodeError("")
      }
    } else {
      setPostalCodeError("")
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/trade-in/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        setQuoteResult(data)
        setStep(3)
      }
    } catch (error) {
      console.error("Failed to get quote:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Validate name field
  const handleNameChange = (value: string) => {
    setFormData({ ...formData, customerName: value })
    if (value && !isValidName(value)) {
      setNameError(ValidationMessages.name)
    } else {
      setNameError("")
    }
  }

  // Validate email field
  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, customerEmail: value })
    if (value && !isValidEmail(value)) {
      setEmailError(ValidationMessages.email)
    } else {
      setEmailError("")
    }
  }

  // Validate phone field
  const handlePhoneChange = (value: string) => {
    const formatted = formatCanadianPhoneNumber(value)
    setFormData({ ...formData, customerPhone: formatted })
    if (formatted.length >= 14 && !isValidCanadianPhoneNumber(formatted)) {
      setPhoneError(ValidationMessages.phone)
    } else {
      setPhoneError("")
    }
  }

  const resetForm = () => {
    setStep(1)
    setQuoteResult(null)
    setPostalCodeError("")
    setNameError("")
    setEmailError("")
    setPhoneError("")
    setAvailableModels([])
    setAvailableTrims([])
    setFormData({
      year: "",
      make: "",
      model: "",
      trim: "",
      mileage: "",
      condition: "",
      postalCode: "",
      vin: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    })
  }

  // Check if step 1 form is valid
  const isStep1Valid = 
    formData.year && 
    formData.make && 
    formData.model && 
    formData.trim &&
    formData.mileage && 
    formData.condition &&
    formData.postalCode &&
    isValidPostalCode(formData.postalCode)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <DollarSign className="w-4 h-4" />
          Get Instant Trade-In Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Instant Trade-In Quote
          </DialogTitle>
          <DialogDescription className="sr-only">
            Get an instant cash offer for your vehicle based on Canadian Black Book values
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Vehicle Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pb-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Under 60 seconds
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                No obligation
              </div>
            </div>

            {/* Year and Make */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="year">Year <span className="text-destructive">*</span></Label>
                <Select value={formData.year} onValueChange={(v) => setFormData({ ...formData, year: v })}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="make">Make <span className="text-destructive">*</span></Label>
                <Select value={formData.make} onValueChange={(v) => setFormData({ ...formData, make: v, model: "", trim: "" })}>
                  <SelectTrigger id="make">
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {makes.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Model */}
            <div>
              <Label htmlFor="model">Model <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.model} 
                onValueChange={(v) => setFormData({ ...formData, model: v, trim: "" })}
                disabled={!formData.make}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder={formData.make ? "Select model" : "Select make first"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trim */}
            <div>
              <Label htmlFor="trim">Trim <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.trim} 
                onValueChange={(v) => setFormData({ ...formData, trim: v })}
                disabled={!formData.model}
              >
                <SelectTrigger id="trim">
                  <SelectValue placeholder={formData.model ? "Select trim" : "Select model first"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {availableTrims.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.name} {t.engine && `(${t.engine})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mileage and Condition */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mileage">Mileage (km) <span className="text-destructive">*</span></Label>
                <Input
                  id="mileage"
                  type="number"
                  placeholder="e.g. 50000"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="condition">Condition <span className="text-destructive">*</span></Label>
                <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Postal Code - MANDATORY */}
            <div>
              <Label htmlFor="postalCode" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Postal Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="postalCode"
                placeholder="e.g. M5V 1J2"
                value={formData.postalCode}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                maxLength={7}
                className={postalCodeError ? "border-destructive" : ""}
              />
              {postalCodeError && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {postalCodeError}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Required for accurate local market valuation
              </p>
            </div>

            {/* VIN (Optional) */}
            <div>
              <Label htmlFor="vin">VIN (optional)</Label>
              <Input
                id="vin"
                placeholder="For more accurate quote"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                className="font-mono"
                maxLength={17}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Contact Info */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm font-medium">
                  {formData.year} {formData.make} {formData.model}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.trim} • {parseInt(formData.mileage).toLocaleString()} km • {formData.condition} condition
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {formData.postalCode}
                </p>
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="name">Your Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {nameError}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.customerEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(416) 555-0123"
                value={formData.customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={phoneError ? "border-destructive" : ""}
              />
              {phoneError && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {phoneError}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={
                  isLoading || 
                  !formData.customerName || 
                  !formData.customerEmail || 
                  !formData.customerPhone ||
                  !isValidName(formData.customerName) ||
                  !isValidEmail(formData.customerEmail) ||
                  !isValidCanadianPhoneNumber(formData.customerPhone)
                }
              >
                {isLoading ? "Calculating..." : "Get My Quote"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Quote Result */}
        {step === 3 && quoteResult && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <div>
              <h3 className="text-lg font-semibold">Your Instant Quote</h3>
              <p className="text-sm text-muted-foreground">
                {formData.year} {formData.make} {formData.model} {formData.trim}
              </p>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
                <p className="text-4xl font-bold text-primary">
                  ${quoteResult.estimate.average.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Range: ${quoteResult.estimate.low.toLocaleString()} - ${quoteResult.estimate.high.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Quote ID: <span className="font-mono">{quoteResult.quoteId}</span></p>
              <p>Valid until: {new Date(quoteResult.validUntil).toLocaleDateString()}</p>
              <p className="flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                Based on market values in {formData.postalCode}
              </p>
              <p>Final offer subject to in-person inspection</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Close
              </Button>
              <Button className="flex-1" asChild>
                <a href={`/trade-in?quote=${quoteResult.quoteId}&vehicle=${encodeURIComponent(`${formData.year} ${formData.make} ${formData.model}`)}&value=${quoteResult.estimate.average}`}>Complete Trade-In</a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
