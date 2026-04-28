 
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import {
  isValidEmail,
  isValidCanadianPhone,
  formatCanadianPhone,
  isValidCanadianPostalCode,
  formatCanadianPostalCode
} from "@/lib/validation"
import { trackFormSubmission } from "@/components/analytics/google-tag-manager"
import { trackLead } from "@/components/analytics/google-analytics"
import { trackMetaLead } from "@/components/analytics/meta-pixel"
import { PHONE_LOCAL } from "@/lib/constants/dealership"

interface ContactFormProps {
  onSuccess?: () => void
}

type FieldRule = (value: string) => string

function requiredText(label: string): FieldRule {
  return (value) => (value.trim() ? "" : `${label} is required`)
}

function patternText(
  label: string,
  invalidMsg: string,
  isValid: (value: string) => boolean,
): FieldRule {
  return (value) => {
    if (!value) return `${label} is required`
    if (!isValid(value)) return invalidMsg
    return ""
  }
}

const FIELD_RULES: Record<string, FieldRule> = {
  firstName: requiredText("First name"),
  lastName: requiredText("Last name"),
  message: requiredText("Message"),
  email: patternText("Email", "Please enter a valid email", isValidEmail),
  phone: patternText("Phone number", "Please enter a valid 10-digit phone number", isValidCanadianPhone),
  postalCode: patternText("Postal code", "Please enter a valid postal code (e.g., M5V 3L9)", isValidCanadianPostalCode),
}

function getFieldErrorMessage(field: string, value: string): string {
  const rule = FIELD_RULES[field]
  return rule ? rule(value) : ""
}

function FieldError({ message }: Readonly<{ message?: string }>) {
  if (!message) return null
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" /> {message}
    </p>
  )
}

interface TextFieldProps {
  id: string
  label: string
  type?: string
  placeholder: string
  value: string
  error?: string
  required?: boolean
  maxLength?: number
  onChange: (value: string) => void
}
function TextField({ id, label, type = "text", placeholder, value, error, required, maxLength, onChange }: Readonly<TextFieldProps>) {
  return (
    <div>
      <Label htmlFor={id}>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-destructive" : ""}
        maxLength={maxLength}
      />
      <FieldError message={error} />
    </div>
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

export function ContactForm({ onSuccess }: Readonly<ContactFormProps>) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    postalCode: "",
    subject: "",
    message: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors, [field]: getFieldErrorMessage(field, value) }
    setErrors(newErrors)
    return !newErrors[field]
  }

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === "phone") {
      formattedValue = formatCanadianPhone(value)
    } else if (field === "postalCode") {
      formattedValue = formatCanadianPostalCode(value)
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    validateField(field, formattedValue)
  }

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email && isValidEmail(formData.email) &&
      formData.phone && isValidCanadianPhone(formData.phone) &&
      formData.postalCode && isValidCanadianPostalCode(formData.postalCode) &&
      formData.message
    )
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid()) return

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to send message")

      trackFormSubmission("contact_form", { subject: formData.subject || "General Inquiry" })
      trackLead("contact_form")
      trackMetaLead("contact_form")
      setIsSubmitted(true)
      onSuccess?.()
    } catch {
      setSubmitError(`Failed to send message. Please try calling us at ${PHONE_LOCAL}.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return <SubmittedConfirmation />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TextField id="firstName" label="First Name" placeholder="John" required
          value={formData.firstName} error={errors.firstName}
          onChange={(v) => handleInputChange("firstName", v)} />
        <TextField id="lastName" label="Last Name" placeholder="Smith" required
          value={formData.lastName} error={errors.lastName}
          onChange={(v) => handleInputChange("lastName", v)} />
      </div>

      <TextField id="email" label="Email Address" type="email" placeholder="john@example.com" required
        value={formData.email} error={errors.email}
        onChange={(v) => handleInputChange("email", v)} />

      <div className="grid grid-cols-2 gap-4">
        <TextField id="phone" label="Phone Number" type="tel" placeholder="(416) 555-0123" required
          value={formData.phone} error={errors.phone}
          onChange={(v) => handleInputChange("phone", v)} />
        <TextField id="postalCode" label="Postal Code" placeholder="M5V 3L9" required maxLength={7}
          value={formData.postalCode} error={errors.postalCode}
          onChange={(v) => handleInputChange("postalCode", v)} />
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Select value={formData.subject} onValueChange={(v) => setFormData(prev => ({ ...prev, subject: v }))}>
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
          className={`w-full min-h-[120px] px-3 py-2 border rounded-lg bg-background resize-none ${errors.message ? "border-destructive" : ""}`}
          placeholder="How can we help you?"
          value={formData.message}
          onChange={(e) => handleInputChange("message", e.target.value)}
        />
        <FieldError message={errors.message} />
      </div>

      {submitError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {submitError}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!isFormValid() || isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By submitting this form, you agree to our privacy policy. We&apos;ll respond within 2 hours during business hours.
      </p>
    </form>
  )
}
