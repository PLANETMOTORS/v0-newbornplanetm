'use server'

/**
 * Server Action: contact form submission.
 *
 * Replaces POST /api/contact.
 * Next.js Server Actions have built-in CSRF protection (same-origin).
 *
 * Returns a discriminated-union state with field-level Zod errors
 * consumed by `useActionState`.
 */

import { headers } from 'next/headers'
import { z } from 'zod'
import { sendNotificationEmail } from '@/lib/email'
import { rateLimit } from '@/lib/redis'
import { isValidEmail, isValidCanadianPhoneNumber, isValidCanadianPostalCode } from '@/lib/validation'
import { logger } from '@/lib/logger'
import { createLead } from '@/lib/anna/lead-capture'
import { inquiryToAdfProspect } from '@/lib/adf/adapters'
import { forwardLeadToAutoRaptor } from '@/lib/adf/forwarder'
// PHONE_LOCAL available via '@/lib/constants/dealership' if needed for notifications

// ── Types ───────────────────────────────────────────────────────────────

export type ContactFormState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; errors?: Record<string, string> }

const initialState: ContactFormState = { status: 'idle' }
export { initialState }

// ── Validation ──────────────────────────────────────────────────────────

const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .refine(isValidEmail, 'Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine(isValidCanadianPhoneNumber, 'Please enter a valid 10-digit phone number'),
  postalCode: z
    .string()
    .trim()
    .min(1, 'Postal code is required')
    .refine(isValidCanadianPostalCode, 'Please enter a valid postal code (e.g., M5V 3L9)'),
  subject: z.string().trim().optional().default(''),
  message: z.string().trim().min(1, 'Message is required'),
})

// ── Constants ───────────────────────────────────────────────────────────

const RATE_LIMIT_BUCKET = 'contact'
const RATE_LIMIT_HOURLY = 5
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60

// ── Main action ─────────────────────────────────────────────────────────

export async function submitContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // 1. Rate-limit by IP
  const ip = await getClientIpFromHeaders()
  const limiter = await rateLimit(
    `${RATE_LIMIT_BUCKET}:${ip}`,
    RATE_LIMIT_HOURLY,
    RATE_LIMIT_WINDOW_SECONDS,
  )
  if (!limiter.success) {
    return { status: 'error', message: 'Too many requests. Please try again later.' }
  }

  // 2. Parse + validate with Zod (field-level errors)
  const parsed = contactSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    postalCode: formData.get('postalCode'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return {
      status: 'error',
      message: 'Please fix the errors below.',
      errors: fieldErrors,
    }
  }

  const body = parsed.data
  const customerName = `${body.firstName} ${body.lastName}`
  const inquirySubject = body.subject || 'General Inquiry'

  // 3. Persist lead (non-blocking — don't fail the form if this fails)
  fireSideEffects(body, customerName, inquirySubject)

  // 4. Send email notification (this one we await — it's the core action)
  try {
    await sendNotificationEmail({
      type: 'vehicle_inquiry',
      customerName,
      customerEmail: body.email,
      customerPhone: body.phone,
      additionalData: {
        subject: inquirySubject,
        message: body.message,
        postalCode: body.postalCode,
        source: 'Contact Form',
      },
    })
  } catch (cause) {
    logger.error('[contact] notification email failed', { cause })
    // Still return success — the lead was captured via side-effects
  }

  return {
    status: 'success',
    message: "Your message has been sent. We'll respond within 2 hours.",
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

async function getClientIpFromHeaders(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0]?.trim() || 'unknown'
}

function fireSideEffects(
  body: { firstName: string; lastName: string; email: string; phone: string; postalCode: string; subject?: string; message: string },
  customerName: string,
  inquirySubject: string,
): void {
  try {
    // Persist to leads table + forward ADF to AutoRaptor
    void createLead({
      source: 'contact_form',
      customerName,
      customerEmail: body.email,
      customerPhone: body.phone,
      subject: inquirySubject,
      message: body.message,
    })
      .then((leadId) =>
        forwardLeadToAutoRaptor(
          inquiryToAdfProspect({
            inquiryId: leadId ?? `contact-${Date.now().toString(36)}`,
            customerName,
            customerEmail: body.email,
            customerPhone: body.phone,
            message: `${inquirySubject}\n\n${body.message}\n\n(postal: ${body.postalCode})`,
          }),
        ).catch((cause) =>
          logger.error('[contact] ADF forward failed', { cause }),
        ),
      )
      .catch((cause) =>
        logger.error('[contact] lead capture failed', { cause }),
      )
  } catch (cause) {
    logger.error('[contact] side-effect threw synchronously', { cause })
  }
}
