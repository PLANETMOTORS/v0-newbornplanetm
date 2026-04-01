"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Car, DollarSign, ArrowRight, Check, Clock, Shield } from "lucide-react"

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 20 }, (_, i) => currentYear - i)

const makes = [
  "Tesla", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Toyota", "Honda", 
  "Ford", "Chevrolet", "Nissan", "Hyundai", "Kia", "Volkswagen", "Mazda", 
  "Subaru", "Lexus", "Acura", "Infiniti", "Other"
]

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

  const [formData, setFormData] = useState({
    year: "",
    make: "",
    model: "",
    mileage: "",
    condition: "",
    vin: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  })

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

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const resetForm = () => {
    setStep(1)
    setQuoteResult(null)
    setFormData({
      year: "",
      make: "",
      model: "",
      mileage: "",
      condition: "",
      vin: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <DollarSign className="w-4 h-4" />
          Get Instant Trade-In Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Instant Trade-In Quote
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Vehicle Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex gap-3 text-sm text-muted-foreground pb-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Under 60 seconds
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                No obligation
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Year</Label>
                <Select value={formData.year} onValueChange={(v) => setFormData({ ...formData, year: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Make</Label>
                <Select value={formData.make} onValueChange={(v) => setFormData({ ...formData, make: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    {makes.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Model</Label>
              <Input
                placeholder="e.g. Model 3, Civic, Camry"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mileage (km)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                  <SelectTrigger>
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

            <div>
              <Label>VIN (optional)</Label>
              <Input
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
              disabled={!formData.year || !formData.make || !formData.model || !formData.mileage || !formData.condition}
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
                  {parseInt(formData.mileage).toLocaleString()} km • {formData.condition} condition
                </p>
              </CardContent>
            </Card>

            <div>
              <Label>Your Name</Label>
              <Input
                placeholder="John Smith"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                placeholder="(416) 555-0123"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: formatPhoneNumber(e.target.value) })}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isLoading || !formData.customerName || !formData.customerEmail || !formData.customerPhone}
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
                {formData.year} {formData.make} {formData.model}
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
              <p>Final offer subject to in-person inspection</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Close
              </Button>
              <Button className="flex-1" asChild>
                <a href="/sell-trade">Complete Trade-In</a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
