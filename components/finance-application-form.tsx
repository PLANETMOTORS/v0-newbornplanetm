"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowRight, User, Calculator, Loader2, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AuthRequiredModal } from "@/components/auth-required-modal"

interface LenderOffer {
  lenderId: string
  lenderName: string
  estimatedRate: number
  estimatedTerm: number
  estimatedMonthlyPayment: number
  prequalified: boolean
  confidence: string
}

interface PrequalificationResult {
  status: string
  creditScore: number
  eligibleLenders: LenderOffer[]
  bestOffer: LenderOffer | null
}

export function FinanceApplicationForm() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PrequalificationResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    annualIncome: 60000,
    requestedAmount: 35000,
    requestedTerm: 72,
  })

  // Calculate monthly payment preview (before API call)
  const calculatePaymentPreview = () => {
    const rate = 5.99 / 100 / 12 // Estimated rate
    const term = formData.requestedTerm
    const amount = formData.requestedAmount
    const payment = (amount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)
    return Math.round(payment)
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim()) errors.firstName = "First Name is required"
    if (!formData.lastName.trim()) errors.lastName = "Last Name is required"
    if (!formData.email.trim()) {
      errors.email = "Email Address is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone Number is required"
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      errors.phone = "Phone must be at least 10 digits"
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors({})
    
    if (!user) {
      setShowAuthModal(true)
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/v1/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annualIncome: formData.annualIncome,
          requestedAmount: formData.requestedAmount,
          requestedTerm: formData.requestedTerm,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data.prequalification)
      }
    } catch (error) {
      console.error('Financing API error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show results if prequalified
  if (result) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-lg">
            {result.status === 'prequalified' ? 'You\'re Pre-Qualified!' : 'Application Received'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {result.eligibleLenders.length} lender(s) available
          </p>
        </div>

        {result.bestOffer && (
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
            <p className="text-xs text-muted-foreground mb-1">Best Rate Available</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">{result.bestOffer.estimatedRate}%</span>
              <span className="text-muted-foreground">APR</span>
            </div>
            <p className="text-sm mt-2">
              ${result.bestOffer.estimatedMonthlyPayment}/mo for {result.bestOffer.estimatedTerm} months
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              via {result.bestOffer.lenderName}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold">All Offers:</p>
          {result.eligibleLenders.slice(0, 4).map((offer) => (
            <div key={offer.lenderId} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="font-semibold">{offer.lenderName}</span>
              <div className="text-right">
                <span className="font-bold">{offer.estimatedRate}%</span>
                <span className="text-sm text-muted-foreground ml-2">${offer.estimatedMonthlyPayment}/mo</span>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full" size="lg" onClick={() => window.location.href = '/financing/application'}>
          Continue Application
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <Button variant="outline" className="w-full" onClick={() => setResult(null)}>
          Start Over
        </Button>
      </div>
    )
  }

  const isSubmitDisabled = isLoading || !formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input 
              placeholder="First Name" 
              value={formData.firstName}
              onChange={(e) => {
                setFormData({ ...formData, firstName: e.target.value })
                if (validationErrors.firstName) {
                  const { firstName: _, ...rest } = validationErrors
                  setValidationErrors(rest)
                }
              }}
              required
            />
            {validationErrors.firstName && (
              <p className="text-xs text-destructive mt-1">{validationErrors.firstName}</p>
            )}
          </div>
          <div>
            <Input 
              placeholder="Last Name" 
              value={formData.lastName}
              onChange={(e) => {
                setFormData({ ...formData, lastName: e.target.value })
                if (validationErrors.lastName) {
                  const { lastName: _, ...rest } = validationErrors
                  setValidationErrors(rest)
                }
              }}
              required
            />
            {validationErrors.lastName && (
              <p className="text-xs text-destructive mt-1">{validationErrors.lastName}</p>
            )}
          </div>
        </div>
        <div>
          <Input 
            type="email" 
            placeholder="Email Address" 
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value })
              if (validationErrors.email) {
                const { email: _, ...rest } = validationErrors
                setValidationErrors(rest)
              }
            }}
            required
          />
          {validationErrors.email && (
            <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
          )}
        </div>
        <div>
          <Input 
            type="tel" 
            placeholder="Phone Number" 
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value })
              if (validationErrors.phone) {
                const { phone: _, ...rest } = validationErrors
                setValidationErrors(rest)
              }
            }}
            required
          />
          {validationErrors.phone && (
            <p className="text-xs text-destructive mt-1">{validationErrors.phone}</p>
          )}
        </div>
        
        {/* Annual Income Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Annual Income</Label>
            <span className="font-semibold">${formData.annualIncome.toLocaleString()}</span>
          </div>
          <Slider
            value={[formData.annualIncome]}
            onValueChange={(value) => setFormData({ ...formData, annualIncome: value[0] })}
            min={25000}
            max={200000}
            step={5000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$25,000</span>
            <span>$200,000</span>
          </div>
        </div>

        {/* Loan Amount Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Loan Amount</Label>
            <span className="font-semibold">${formData.requestedAmount.toLocaleString()}</span>
          </div>
          <Slider
            value={[formData.requestedAmount]}
            onValueChange={(value) => setFormData({ ...formData, requestedAmount: value[0] })}
            min={10000}
            max={100000}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$10,000</span>
            <span>$100,000</span>
          </div>
        </div>

        {/* Term Selector */}
        <div className="space-y-3">
          <Label>Loan Term</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[36, 48, 60, 72, 84, 96].map((term) => (
              <Button
                key={term}
                type="button"
                variant={formData.requestedTerm === term ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, requestedTerm: term })}
                className="text-xs"
              >
                {term} mo
              </Button>
            ))}
          </div>
        </div>

        {/* Payment Preview */}
        <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Est. Monthly Payment</span>
          </div>
          <span className="text-xl font-bold">${calculatePaymentPreview()}/mo</span>
        </div>

        {Object.values(validationErrors).some(Boolean) && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="font-semibold text-sm text-destructive mb-1">Please fix the following:</p>
            <ul className="list-disc pl-5 space-y-1">
              {Object.values(validationErrors).filter(Boolean).map((error, i) => (
                <li key={i} className="text-xs text-destructive">{error}</li>
              ))}
            </ul>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitDisabled}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking Rates...
            </>
          ) : (
            <>
              Get Pre-Approved
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          <User className="w-3 h-3 inline mr-1" />
          Sign in required to submit application
        </p>
      </form>

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="get pre-approved for financing"
        redirectTo="/financing"
      />
    </>
  )
}
