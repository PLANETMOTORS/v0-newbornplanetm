/**
 * POST /api/v1/financing/capture-lead
 *
 * Public, pre-auth endpoint. Captures a finance pre-approval request
 * before the customer clicks the magic-link, persists it as a `leads`
 * row, and fans out side-effects (notification email + ADF/AutoRaptor).
 *
 * Behaviour rules
 * ───────────────
 *  1. CSRF: origin must validate.
 *  2. Rate-limit: 5 submissions / hour / IP.
 *  3. Body is Zod-parsed (.strict()).
 *  4. **Fail-loud on persist:** if the row cannot be written we return
 *     HTTP 500 with code `LEAD_PERSIST_FAILED` and a customer-readable
 *     retry message + phone number.
 *     Critically, we do NOT send the admin notification email or fire
 *     the ADF when the row failed — emailing about a non-existent lead
 *     is the exact split-brain that lost two real customer leads on
 *     2026-04-30.
 *  5. Side-effects (email + ADF) are fire-and-forget; their failures
 *     log via `lib/logger` and never block the customer-facing 200.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/redis"
import { validateOrigin } from "@/lib/csrf"
import { sendNotificationEmail } from "@/lib/email"
import { logger } from "@/lib/logger"
import { financeToAdfProspect } from "@/lib/adf/adapters"
import { forwardLeadToAutoRaptor } from "@/lib/adf/forwarder"
import {
  captureLeadRequestSchema,
  PERSIST_ERROR_CODE,
  RETRY_PHONE,
  type CaptureLeadRequest,
} from "@/lib/leads/capture/schemas"
import { persistCaptureLead } from "@/lib/leads/capture/repository"

const RATE_LIMIT_BUCKET = "capture-lead"
const RATE_LIMIT_PER_HOUR = 5
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60

function clientIpFromHeaders(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? ""
  const first = forwarded.split(",")[0]?.trim()
  return first && first.length > 0 ? first : "unknown"
}

function persistFailureResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: PERSIST_ERROR_CODE,
        message: `We received your information but couldn't save it. Please try again or call ${RETRY_PHONE}.`,
      },
    },
    { status: 500 },
  )
}

function fireSideEffects(input: CaptureLeadRequest, leadId: string): void {
  const fullName = `${input.firstName} ${input.lastName}`

  void sendNotificationEmail({
    type: "finance_application",
    customerName: fullName,
    customerEmail: input.email,
    customerPhone: input.phone,
    additionalData: {
      annualIncome: input.annualIncome,
      requestedAmount: input.requestedAmount,
      requestedTerm: input.requestedTerm,
      source: "Magic Link Flow (pre-auth)",
      leadId,
    },
  }).catch((cause) =>
    logger.error("[capture-lead] notification email failed", { leadId, cause }),
  )

  void forwardLeadToAutoRaptor(
    financeToAdfProspect({
      applicationId: leadId,
      customerName: fullName,
      customerEmail: input.email,
      customerPhone: input.phone,
      annualIncome: input.annualIncome,
      notes: [
        `Requested amount: $${input.requestedAmount.toLocaleString()}`,
        `Term: ${input.requestedTerm} months`,
        "Source: planetmotors.ca magic-link flow.",
      ].join(" "),
    }),
  ).catch((cause) =>
    logger.error("[capture-lead] ADF forward failed", { leadId, cause }),
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    )
  }

  const ip = clientIpFromHeaders(request)
  const limiter = await rateLimit(
    `${RATE_LIMIT_BUCKET}:${ip}`,
    RATE_LIMIT_PER_HOUR,
    RATE_LIMIT_WINDOW_SECONDS,
  )
  if (!limiter.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 },
    )
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: "Body must be valid JSON" },
      { status: 400 },
    )
  }

  const parsed = captureLeadRequestSchema.safeParse(raw)
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ")
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    )
  }

  const input = parsed.data
  const persistResult = await persistCaptureLead(input)

  if (!persistResult.ok) {
    logger.error("[capture-lead] persist failed", {
      kind: persistResult.error.kind,
      message: persistResult.error.message,
      code: "code" in persistResult.error ? persistResult.error.code : undefined,
      ip,
    })
    return persistFailureResponse()
  }

  fireSideEffects(input, persistResult.value.id)

  return NextResponse.json({
    success: true,
    data: {
      leadId: persistResult.value.id,
      message: "Lead captured successfully",
    },
  })
}
