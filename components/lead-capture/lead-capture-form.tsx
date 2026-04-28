"use client"

/**
 * LeadCaptureForm — Reusable lead capture component
 *
 * Analytics coverage (all fire on successful submission):
 *
 *  1. Meta Pixel (browser)  — globalThis.fbq('track', 'Lead')
 *     via trackMetaLead() from @/components/analytics/meta-pixel
 *
 *  2. GTM dataLayer (browser) — event: 'generate_lead' + form_name
 *     via trackFormSubmission() from @/components/analytics/google-tag-manager
 *
 *  3. GA4 (browser) — gtag('event', 'generate_lead', {...})
 *     via trackLead() from @/components/analytics/google-analytics
 *
 *  4. Meta CAPI (server-side) — Lead event sent directly to Meta Graph API
 *     via /api/contact route which calls lib/meta-capi-helpers trackLead()
 *     This fires even when the browser pixel is blocked by ad blockers.
 *
 * Usage:
 *   <LeadCaptureForm
 *     formName="homepage_hero"
 *     vehicleId="abc-123"          // optional — pre-fills vehicle interest
 *     vehicleLabel="2024 Tesla Model 3"  // optional — shown in UI
 *     onSuccess={() => router.push('/thank-you')}
 *   />
 */

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import {
  isValidEmail,
  isValidCanadianPhone,
  formatCanadianPhone,
} from "@/lib/validation"
import { trackFormSubmission, pushToDataLayer } from "@/components/analytics/google-tag-manager"
import { trackLead } from "@/components/analytics/google-analytics"
import { trackMetaLead } from "@/components/analytics/meta-pixel"
import { logger } from "@/lib/logger"

// ── Types ──────────────────────────────────────────────────────────────────

export interface LeadCaptureFormProps {
  /** Identifies this form instance in analytics events (e.g. "homepage_hero", "pdp_sidebar") */
  formName?: string
  /** Optional vehicle ID — sent to the server for lead attribution */
  vehicleId?: string
  /** Optional human-readable vehicle label shown in the form */
  vehicleLabel?: string
  /** Called after a successful submission */
  onSuccess?: () => void
  /** Override the default CTA button label */
  ctaLabel?: string
  /** Override the default success message */
  successMessage?: string
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
}

// ── Component ──────────────────────────────────────────────────────────────

export function LeadCaptureForm({
  formName = "lead_capture",
  vehicleId,
  vehicleLabel,
  onSuccess,
  ctaLabel = "Get More Info",
  successMessage = "Thanks! A specialist will reach out within 2 hours.",
}: Readonly<LeadCaptureFormProps>) {
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Track form_view impression once on mount
  const hasTrackedView = useRef(false)
  useEffect(() => {
    if (hasTrackedView.current) return
    hasTrackedView.current = true
    pushToDataLayer({
      event: "form_view",
      form_name: formName,
      vehicle_id: vehicleId ?? null,
    })
  }, [formName, vehicleId])

  // ── Validation ───────────────────────────────────────────────────────────

  function validateField(field: keyof FormState, value: string): string {
    switch (field) {
      case "firstName":
        return value.trim() ? "" : "First name is required"
      case "lastName":
        return value.trim() ? "" : "Last name is required"
      case "email":
        if (!value) return "Email is required"
        return isValidEmail(value) ? "" : "Please enter a valid email address"
      case "phone":
        if (!value) return "Phone number is required"
        return isValidCanadianPhone(value) ? "" : "Please enter a valid 10-digit phone number"
      default:
        return ""
    }
  }

  function handleChange(field: keyof FormState, raw: string) {
    const value = field === "phone" ? formatCanadianPhone(raw) : raw
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }))
  }

  function isFormValid(): boolean {
    return (
      !!form.firstName.trim() &&
      !!form.lastName.trim() &&
      isValidEmail(form.email) &&
      isValidCanadianPhone(form.phone)
    )
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()

    // Re-validate all fields before submit
    const newErrors: Partial<FormState> = {}
    for (const key of Object.keys(form) as Array<keyof FormState>) {
      const msg = validateField(key, form[key])
      if (msg) newErrors[key] = msg
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      // ── Server call ────────────────────────────────────────────────────
      // Reuses /api/contact which:
      //   • Saves the lead to Supabase (lib/anna/lead-capture)
      //   • Sends notification email
      //   • Fires Meta CAPI Lead event server-side (lib/meta-capi-helpers)
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          // Required fields for /api/contact validation
          postalCode: "A0A 0A0", // placeholder — lead form doesn't collect postal code
          subject: vehicleLabel ? `Vehicle Inquiry: ${vehicleLabel}` : "General Inquiry",
          message: vehicleId
            ? `Lead captured via ${formName}. Vehicle ID: ${vehicleId}`
            : `Lead captured via ${formName}.`,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || "Submission failed")
      }

      // ── Client-side analytics (fire after confirmed server success) ────

      // 1. GTM dataLayer — triggers any GTM tags listening for 'generate_lead'
      trackFormSubmission(formName, {
        vehicle_id: vehicleId ?? null,
        vehicle_label: vehicleLabel ?? null,
      })

      // 2. GA4 — gtag generate_lead event
      trackLead(formName, vehicleId)

      // 3. Meta Pixel — globalThis.fbq('track', 'Lead')
      //    Fires even if CAPI is blocked; CAPI already fired server-side above.
      trackMetaLead(formName)

      // 4. Additional dataLayer push with richer context for GTM custom tags
      pushToDataLayer({
        event: "lead_captured",
        form_name: formName,
        vehicle_id: vehicleId ?? null,
        vehicle_label: vehicleLabel ?? null,
        lead_source: "lead_capture_form",
      })

      setIsSubmitted(true)
      onSuccess?.()
    } catch (err) {
      logger.error(`[lead-capture-form] Submit failed (${formName}):`, err)
      setSubmitError("Something went wrong. Please try again or call us directly.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success state ────────────────────────────────────────────────────────

  if (isSubmitted) {
    return (
      <div className="text-center py-6 space-y-3">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" aria-hidden="true" />
        <p className="font-semibold text-lg">{successMessage}</p>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Lead capture form">
      {vehicleLabel && (
        <p className="text-sm text-muted-foreground">
          Enquiring about: <span className="font-medium text-foreground">{vehicleLabel}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* First name */}
        <div>
          <Label htmlFor={`${formName}-firstName`}>
            First Name <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id={`${formName}-firstName`}
            autoComplete="given-name"
            placeholder="Jane"
            value={form.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? `${formName}-firstName-error` : undefined}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p id={`${formName}-firstName-error`} className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {errors.firstName}
            </p>
          )}
        </div>

        {/* Last name */}
        <div>
          <Label htmlFor={`${formName}-lastName`}>
            Last Name <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id={`${formName}-lastName`}
            autoComplete="family-name"
            placeholder="Smith"
            value={form.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? `${formName}-lastName-error` : undefined}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p id={`${formName}-lastName-error`} className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <Label htmlFor={`${formName}-email`}>
          Email <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id={`${formName}-email`}
          type="email"
          autoComplete="email"
          placeholder="jane@example.com"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${formName}-email-error` : undefined}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p id={`${formName}-email-error`} className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor={`${formName}-phone`}>
          Phone <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id={`${formName}-phone`}
          type="tel"
          autoComplete="tel"
          placeholder="(416) 555-0123"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? `${formName}-phone-error` : undefined}
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && (
          <p id={`${formName}-phone-error`} className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <div role="alert" className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {submitError}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!isFormValid() || isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            Sending...
          </>
        ) : (
          ctaLabel
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By submitting, you agree to our{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          privacy policy
        </a>
        . No spam — ever.
      </p>
    </form>
  )
}
