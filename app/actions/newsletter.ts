'use server'

/**
 * Server Action: newsletter signup.
 *
 * Replaces POST /api/v1/newsletter.
 * Next.js Server Actions have built-in CSRF protection (same-origin),
 * so the manual Origin/Referer check is no longer needed.
 *
 * Returns a discriminated-union state consumed by `useActionState`.
 */

import { headers } from 'next/headers'
import { z } from 'zod'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { isEmailLike } from '@/lib/validation/email'
import { escapeHtml } from '@/lib/email'
import { rateLimit } from '@/lib/redis'
import { forwardLeadToAutoRaptor } from '@/lib/adf/forwarder'
import { logger } from '@/lib/logger'
import type { ADFProspect } from '@/lib/adf/types'
import { PHONE_LOCAL, PHONE_TOLL_FREE } from '@/lib/constants/dealership'

// ── Types ───────────────────────────────────────────────────────────────

export type NewsletterFormState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

const initialState: NewsletterFormState = { status: 'idle' }
export { initialState }

// ── Validation ──────────────────────────────────────────────────────────

const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .refine(isEmailLike, 'Please enter a valid email address'),
})

// ── Constants ───────────────────────────────────────────────────────────

const RATE_LIMIT_BUCKET = 'newsletter'
const RATE_LIMIT_HOURLY = 5
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'toni@planetmotors.ca'
const FROM_EMAIL =
  process.env.FROM_EMAIL ?? 'Planet Motors <notifications@planetmotors.ca>'

// ── Main action ─────────────────────────────────────────────────────────

export async function subscribeNewsletter(
  _prev: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
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

  // 2. Validate with Zod
  const parsed = newsletterSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Valid email is required',
    }
  }
  const { email } = parsed.data

  // 3. Check for duplicate + insert
  const adminClient = createAdminClient()
  const { data: existing } = await adminClient
    .from('leads')
    .select('id')
    .eq('customer_email', email)
    .eq('source', 'newsletter')
    .eq('status', 'new')
    .limit(1)

  if (existing && existing.length > 0) {
    return { status: 'success', message: "You're already subscribed!" }
  }

  const { error: insertError } = await adminClient.from('leads').insert({
    source: 'newsletter',
    status: 'new',
    priority: 'low',
    customer_name: email.split('@')[0],
    customer_email: email,
    customer_phone: null,
    subject: 'Newsletter Subscription',
    message: 'Subscribed via footer form',
  })

  if (insertError) {
    logger.error('[newsletter] lead insert failed', { error: insertError })
    return { status: 'error', message: 'Failed to save subscription. Please try again.' }
  }

  // 4. Fire-and-forget side-effects
  fireSideEffects(email)

  return { status: 'success', message: "You're subscribed!" }
}

// ── Helpers ─────────────────────────────────────────────────────────────

async function getClientIpFromHeaders(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0]?.trim() || 'unknown'
}

function getResendClient(): Resend | null {
  const apiKey = process.env.API_KEY_RESEND ?? process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

function fireSideEffects(email: string): void {
  try {
    const resend = getResendClient()
    if (resend) {
      void resend.emails
        .send({
          from: FROM_EMAIL,
          to: email,
          subject: "You're subscribed to Planet Motors!",
          html: subscriberConfirmationHtml(email),
        })
        .catch((cause) =>
          logger.error('[newsletter] confirmation email failed', { cause }),
        )

      void resend.emails
        .send({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `New Newsletter Subscriber: ${email}`,
          html: adminNotificationHtml(email),
        })
        .catch((cause) =>
          logger.error('[newsletter] admin notification failed', { cause }),
        )
    }

    const prospect: ADFProspect = {
      id: `newsletter-${Date.now()}`,
      requestDate: new Date().toISOString(),
      source: 'Newsletter Signup',
      customer: { email },
      comments: 'Newsletter subscription from website footer form.',
    }
    void forwardLeadToAutoRaptor(prospect).catch((cause) =>
      logger.error('[newsletter] ADF forward failed', { cause }),
    )
  } catch (cause) {
    logger.error('[newsletter] side-effect threw synchronously', { cause })
  }
}

// ── Email Templates ─────────────────────────────────────────────────────

function subscriberConfirmationHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1e3a8a;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">You're subscribed!</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">Thanks for signing up — you'll now receive the latest deals, new inventory alerts, and tips from Planet Motors.</p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">We respect your inbox and only send updates that matter.</p>
          <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;color:#64748b;font-size:13px;">Subscribed as: <strong style="color:#0f172a;">${escapeHtml(email)}</strong></p>
          </div>
          <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">Planet Motors | ${PHONE_LOCAL} | ${PHONE_TOLL_FREE}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function adminNotificationHtml(email: string): string {
  const now = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:20px 32px;">
          <h2 style="margin:0;color:#ffffff;font-size:18px;">New Newsletter Subscriber</h2>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table role="presentation" width="100%" cellpadding="8" cellspacing="0">
            <tr>
              <td style="color:#64748b;font-size:13px;width:100px;">Email</td>
              <td style="color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(email)}</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Source</td>
              <td style="color:#0f172a;font-size:14px;">Footer Subscribe Form</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Time</td>
              <td style="color:#0f172a;font-size:14px;">${now}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
