'use client'

import { useActionState, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/components/ui/submit-button'
import { ArrowRight, Car } from 'lucide-react'
import { PHONE_LOCAL } from '@/lib/constants/dealership'
import { submitTradeInQuote, type TradeInFormState } from '@/app/actions/trade-in'

const currentYear = new Date().getFullYear()
const earliestYear = 1980
const years = Array.from({ length: currentYear - earliestYear + 1 }, (_, i) => currentYear - i)

const popularMakes = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz',
  'Audi', 'Lexus', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru',
  'Volkswagen', 'Jeep', 'Ram', 'GMC', 'Tesla', 'Other',
]

const initialState: TradeInFormState = { status: 'idle' }

export function SellYourCarForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    trim: '',
    mileage: '',
    condition: '',
    name: '',
    email: '',
    phone: '',
    comments: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // React 19: useActionState replaces manual isSubmitting + error useState
  const [state, formAction] = useActionState(
    async (prev: TradeInFormState, fd: FormData) => {
      const result = await submitTradeInQuote(prev, fd)
      if (result.status === 'success') setStep(3)
      return result
    },
    initialState,
  )

  const canContinue =
    Boolean(formData.year) &&
    Boolean(formData.make) &&
    Boolean(formData.model.trim()) &&
    Boolean(formData.mileage) &&
    Boolean(formData.condition)

  const handleStepOneSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (canContinue) setStep(2)
  }

  return (
    <Card className="shadow-xl border-2" id="quote-form">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Get Your Free Quote</CardTitle>
            <CardDescription>Takes less than 2 minutes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleStepOneSubmit} autoComplete="off">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select year</option>
                  {years.map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <select
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={(e) => handleChange('make', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select make</option>
                  {popularMakes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="e.g., Camry, Civic, F-150"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trim">Trim Level</Label>
                <Input
                  id="trim"
                  name="trim"
                  placeholder="e.g., SE, LX, XLT, Sport"
                  value={formData.trim}
                  onChange={(e) => handleChange('trim', e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage (km) *</Label>
                <Input
                  id="mileage"
                  name="mileage"
                  type="number"
                  placeholder="e.g., 75000"
                  value={formData.mileage}
                  onChange={(e) => handleChange('mileage', e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select condition</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={!canContinue}
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {step === 2 && (
          <form action={formAction} className="space-y-4">
            {/* Hidden fields carry step-1 data into the server action */}
            <input type="hidden" name="year" value={formData.year} />
            <input type="hidden" name="make" value={formData.make} />
            <input type="hidden" name="model" value={formData.model} />
            <input type="hidden" name="trim" value={formData.trim} />
            <input type="hidden" name="mileage" value={formData.mileage} />
            <input type="hidden" name="condition" value={formData.condition} />

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={PHONE_LOCAL}
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Additional Comments (Optional)</Label>
              <Textarea
                id="comments"
                name="comments"
                placeholder="Any other details about your vehicle..."
                value={formData.comments}
                onChange={(e) => handleChange('comments', e.target.value)}
                rows={3}
              />
            </div>
            {state.status === 'error' && (
              <p role="alert" className="text-sm text-destructive">
                {state.message || `Failed to submit. Please try again or call us at ${PHONE_LOCAL}.`}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <SubmitButton className="flex-1" size="lg" pendingText="Submitting...">
                Get My Quote <ArrowRight className="ml-2 h-4 w-4" />
              </SubmitButton>
            </div>
          </form>
        )}

        {step === 3 && (
          <div role="status" aria-live="polite" className="text-center py-6 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Quote Request Received!</h3>
            <p className="text-muted-foreground">
              We&apos;ll review your vehicle details and get back to you within 24 hours with a competitive offer.
            </p>
            <Button variant="outline" onClick={() => { setStep(1); setFormData({ year: '', make: '', model: '', trim: '', mileage: '', condition: '', name: '', email: '', phone: '', comments: '' }) }}>
              Submit Another Vehicle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
