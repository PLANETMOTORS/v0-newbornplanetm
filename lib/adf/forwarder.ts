/**
 * ADF lead forwarder — delivers an ADFProspect to AutoRaptor (or any
 * other ADF-compatible CRM) via email.
 *
 * AutoRaptor accepts inbound leads as email containing the ADF XML
 * envelope in the body. We send via Resend (already used elsewhere
 * in the codebase) using a verified `notifications@planetmotors.ca`
 * From: address.
 *
 * Configuration via env vars (so this is safe to ship before the
 * receiving address is known — forwarder is a no-op if unset):
 *   - AUTORAPTOR_LEAD_EMAIL    Required to enable forwarding
 *   - ADF_FROM_EMAIL           Optional, defaults to FROM_EMAIL
 *   - ADF_DEALER_NAME          Optional, defaults to "Planet Motors"
 *
 * Failure mode: this function NEVER throws. CRM forwarding is a
 * "fire and forget" action — if AutoRaptor's mail server is down,
 * the customer-facing flow must still succeed. Errors are logged
 * + returned in the result for observability.
 */

import { Resend } from "resend"
import type { ADFProspect } from "./types"
import { generateAdfXml } from "./xml-generator"

export interface ForwardResult {
  ok: boolean
  /** "sent" if email accepted by Resend, "skipped" if not configured */
  status: "sent" | "skipped" | "error"
  error?: string
  messageId?: string
}

function getResendClient(): Resend | null {
  const apiKey = process.env.API_KEY_RESEND || process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

/**
 * Forward a prospect to the configured AutoRaptor inbox.
 *
 * Returns a ForwardResult with:
 *   - status "skipped" if AUTORAPTOR_LEAD_EMAIL not set (still ok:true,
 *     so callers can use it as a soft check without aborting the flow)
 *   - status "sent" + messageId on Resend success
 *   - status "error" + error msg on any failure (still does not throw)
 */
export async function forwardLeadToAutoRaptor(
  prospect: ADFProspect,
): Promise<ForwardResult> {
  const recipient = process.env.AUTORAPTOR_LEAD_EMAIL
  if (!recipient) {
    return { ok: true, status: "skipped" }
  }

  const dealerName = process.env.ADF_DEALER_NAME || "Planet Motors"
  const fromEmail =
    process.env.ADF_FROM_EMAIL ||
    process.env.FROM_EMAIL ||
    "Planet Motors <notifications@planetmotors.ca>"

  let xml: string
  try {
    xml = generateAdfXml(prospect, dealerName)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ADF generation failed"
    console.error("[adf] generation error:", msg)
    return { ok: false, status: "error", error: msg }
  }

  const resend = getResendClient()
  if (!resend) {
    return {
      ok: false,
      status: "error",
      error: "Resend client not configured (missing RESEND_API_KEY)",
    }
  }

  // Subject line follows AutoRaptor convention: source + customer name +
  // vehicle reference. AutoRaptor's parser cares about the body; the
  // subject is for human readability if a salesperson is CC'd.
  const customerLabel =
    [prospect.customer.firstName, prospect.customer.lastName]
      .filter(Boolean)
      .join(" ") || "Web Lead"
  const subject = `ADF Lead: ${prospect.source} — ${customerLabel} (${prospect.id})`

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipient,
      subject,
      // ADF parsers read the email body. We send as text/plain to avoid
      // any HTML mangling of XML angle brackets.
      text: xml,
      // Plus a small HTML fallback so manual inspectors can read it
      html: `<pre style="font-family:monospace;white-space:pre-wrap;">${xml
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")}</pre>`,
    })

    if (error) {
      const msg = typeof error === "string" ? error : JSON.stringify(error)
      console.error("[adf] Resend send error:", msg)
      return { ok: false, status: "error", error: msg }
    }

    return {
      ok: true,
      status: "sent",
      messageId: data?.id,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown send failure"
    console.error("[adf] Send exception:", msg)
    return { ok: false, status: "error", error: msg }
  }
}
