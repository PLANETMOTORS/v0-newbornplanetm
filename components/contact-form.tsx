'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { SubmitButton } from '@/components/ui/submit-button'
import { trackFormSubmission } from '@/components/analytics/google-tag-manager'
import { trackLead } from '@/components/analytics/google-analytics'
import {
  submitContact,
  initialState,
  type ContactFormState,
} from '@/app/actions/contact'

// ── Props ───────────────────────────────────────────────────────────────

interface ContactFormProps {
  onSuccess?: () => void
}

// ── Helpers ─────────────────────────────────────────────────────────────

function FieldError({ message }: Readonly<{ message?: string }>) {
  if (!message) return null
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1" role="alert">
      <AlertCircle className="h-3 w-3" /> {message}
    </p>
  )
}

function SubmittedConfirmation() {
  return (
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
      <h3 className="font-semibold text-xl mb-2">Message Sent!</h3>
      <p className="text-muted-foreground">We&apos;ll get back to you within 2 hours during business hours.</p>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────

export function ContactForm({ onSuccess }: Readonly<ContactFormProps>) {
  const [state, formAction] = useActionState<ContactFormState, FormData>(
    async (prev, fd) => {
      const result = await submitContact(prev, fd)
      if (result.status === 'success') {
        trackFormSubmission('contact_form', { subject: fd.get('subject') as string || 'General Inquiry' })
        trackLead('contact_form')
        onSuccess?.()
      }
      return result
    },
    initialState,
  )

  const errors = state.status === 'error' && state.errors ? state.errors : {}

  if (state.status === 'success') {
    return <SubmittedConfirmation />
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
          <Input id="firstName" name="firstName" placeholder="John" required
            className={errors.firstName ? 'border-destructive' : ''} />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
          <Input id="lastName" name="lastName" placeholder="Smith" required
            className={errors.lastName ? 'border-destructive' : ''} />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
        <Input id="email" name="email" type="email" placeholder="john@example.com" required
          className={errors.email ? 'border-destructive' : ''} />
        <FieldError message={errors.email} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
          <Input id="phone" name="phone" type="tel" placeholder="(416) 555-0123" required
            className={errors.phone ? 'border-destructive' : ''} />
          <FieldError message={errors.phone} />
        </div>
        <div>
          <Label htmlFor="postalCode">Postal Code <span className="text-destructive">*</span></Label>
          <Input id="postalCode" name="postalCode" placeholder="M5V 3L9" required maxLength={7}
            className={errors.postalCode ? 'border-destructive' : ''} />
          <FieldError message={errors.postalCode} />
        </div>
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Select name="subject">
          <SelectTrigger>
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General Inquiry</SelectItem>
            <SelectItem value="sales">Sales Question</SelectItem>
            <SelectItem value="financing">Financing</SelectItem>
            <SelectItem value="trade-in">Trade-In</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
        <textarea
          id="message"
          name="message"
          className={`w-full min-h-[120px] px-3 py-2 border rounded-lg bg-background resize-none ${errors.message ? 'border-destructive' : ''}`}
          placeholder="How can we help you?"
          required
        />
        <FieldError message={errors.message} />
      </div>

      {state.status === 'error' && !state.errors && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive" role="alert">
          {state.message}
        </div>
      )}

      <SubmitButton className="w-full" pendingText="Sending...">
        Send Message
      </SubmitButton>

      <p className="text-xs text-muted-foreground text-center">
        By submitting this form, you agree to our privacy policy. We&apos;ll respond within 2 hours during business hours.
      </p>
    </form>
  )
}
