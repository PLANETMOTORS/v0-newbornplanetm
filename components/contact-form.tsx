/* eslint-disable @typescript-eslint/no-unused-vars */
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

export function ContactForm({ onSuccess }: ContactFormProps) {
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
    const newErrors = { ...errors }
    switch (field) {
      case "firstName":
        newErrors.firstName = !value.trim() ? "First name is required" : ""
        break
      case "lastName":
        newErrors.lastName = !value.trim() ? "Last name is required" : ""
        break
      case "email":
        if (!value) newErrors.email = "Email is required"
        else if (!isValidEmail(value)) newErrors.email = "Please enter a valid email"
        else newErrors.email = ""
        break
      case "phone":
        if (!value) newErrors.phone = "Phone number is required"
        else if (!isValidCanadianPhone(value)) newErrors.phone = "Please enter a valid 10-digit phone number"
        else newErrors.phone = ""
        break
      case "postalCode":
        if (!value) newErrors.postalCode = "Postal code is required"
        else if (!isValidCanadianPostalCode(value)) newErrors.postalCode = "Please enter a valid postal code (e.g., M5V 3L9)"
        else newErrors.postalCode = ""
        break
      case "message":
        newErrors.message = !value.trim() ? "Message is required" : ""
        break
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-semibold text-xl mb-2">Message Sent!</h3>
        <p className="text-muted-foreground">We&apos;ll get back to you within 2 hours during business hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
          <Input
            id="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.firstName}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
          <Input
            id="lastName"
            placeholder="Smith"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.lastName}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.email}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(416) 555-0123"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.phone}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="postalCode">Postal Code <span className="text-destructive">*</span></Label>
          <Input
            id="postalCode"
            type="text"
            placeholder="M5V 3L9"
            value={formData.postalCode}
            onChange={(e) => handleInputChange("postalCode", e.target.value)}
            className={errors.postalCode ? "border-destructive" : ""}
            maxLength={7}
          />
          {errors.postalCode && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.postalCode}
            </p>
          )}
        </div>
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
        {errors.message && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.message}
          </p>
        )}
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
