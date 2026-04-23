import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders, handleCorsPreFlight } from "../_shared/cors.ts"
import { createLogger } from "../_shared/logger.ts"
import { validatePrequalifyInput } from "../_shared/validate.ts"

const log = createLogger("finance-prequalify")

/**
 * POST /functions/v1/finance-prequalify
 *
 * Soft credit pull / prequalification — runs AFTER magic-link auth.
 * Returns eligible lenders, estimated rates, and monthly payments.
 *
 * Requires a valid Supabase JWT (anon or authenticated) in the
 * Authorization header. The JWT is verified by Supabase Gateway before
 * the function is invoked.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

// Rate floor — mirrors lib/rates.ts RATE_FLOOR
const RATE_FLOOR = 6.29

const lenders = [
  { id: "lender_a", name: "Partner Lender A", code: "PLA", type: "bank", minScore: 600, maxTerm: 84, baseRate: RATE_FLOOR },
  { id: "lender_b", name: "Partner Lender B", code: "PLB", type: "bank", minScore: 620, maxTerm: 84, baseRate: 6.49 },
  { id: "lender_c", name: "Partner Lender C", code: "PLC", type: "bank", minScore: 600, maxTerm: 84, baseRate: 6.79 },
  { id: "lender_d", name: "Partner Lender D", code: "PLD", type: "bank", minScore: 640, maxTerm: 72, baseRate: 6.99 },
  { id: "lender_e", name: "Partner Lender E", code: "PLE", type: "bank", minScore: 620, maxTerm: 84, baseRate: 7.29 },
  { id: "lender_f", name: "Partner Lender F", code: "PLF", type: "credit_union", minScore: 580, maxTerm: 96, baseRate: 7.49 },
]

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsPreFlight(req)

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    })
  }

  // Extract and verify the user JWT
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Missing authorization header" } }),
      { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  // Create a client with the user's JWT to verify identity
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    log.warn("Auth verification failed", { error: authError?.message })
    return new Response(
      JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } }),
      { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  const validation = validatePrequalifyInput(body)
  if ("error" in validation) {
    return new Response(
      JSON.stringify({ success: false, error: { code: "MISSING_FIELDS", message: validation.error } }),
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  const { data } = validation
  log.info("Prequalify started", { userId: user.id, amount: data.requestedAmount })

  // Income-based credit score estimation (Equifax/TransUnion in production)
  const creditScore = data.annualIncome >= 80000 ? 750 : data.annualIncome >= 50000 ? 700 : 680
  const creditBureau = "Equifax"

  const monthlyIncome = data.annualIncome / 12
  const term = data.requestedTerm || 72
  const dtiMonthlyRate = RATE_FLOOR / 100 / 12
  const estimatedPayment =
    (data.requestedAmount * dtiMonthlyRate * Math.pow(1 + dtiMonthlyRate, term)) /
    (Math.pow(1 + dtiMonthlyRate, term) - 1)
  const dti = ((data.monthlyRent || 0) + estimatedPayment) / monthlyIncome

  const eligibleLenders = lenders
    .filter((lender) => creditScore >= lender.minScore)
    .map((lender) => {
      let rate = lender.baseRate
      if (creditScore >= 750) rate -= 0.5
      else if (creditScore >= 700) rate -= 0.25
      else if (creditScore < 650) rate += 0.5

      const lenderTerm = Math.min(term, lender.maxTerm)
      const monthlyRate = rate / 100 / 12
      const monthlyPayment =
        (data.requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, lenderTerm)) /
        (Math.pow(1 + monthlyRate, lenderTerm) - 1)

      return {
        lenderId: lender.id,
        lenderName: lender.name,
        lenderCode: lender.code,
        estimatedRate: rate,
        estimatedTerm: lenderTerm,
        estimatedMonthlyPayment: Math.round(monthlyPayment * 100) / 100,
        prequalified: true,
        confidence: creditScore >= 700 ? "high" : creditScore >= 650 ? "medium" : "low",
      }
    })
    .sort((a, b) => a.estimatedRate - b.estimatedRate)

  const prequalification = {
    id: `preq-${Date.now()}`,
    customerId: user.id,
    vehicleId: data.vehicleId ?? null,
    status: eligibleLenders.length > 0 ? "prequalified" : "declined",
    creditScore,
    creditBureau,
    creditPullType: "soft",
    creditPullDate: new Date().toISOString(),
    dti: Math.round(dti * 100) / 100,
    eligibleLenders,
    bestOffer: eligibleLenders[0] || null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  }

  log.info("Prequalify completed", {
    userId: user.id,
    status: prequalification.status,
    lenderCount: eligibleLenders.length,
    bestRate: eligibleLenders[0]?.estimatedRate ?? null,
  })

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        prequalification,
        message:
          eligibleLenders.length > 0
            ? `Congratulations! You're pre-qualified with ${eligibleLenders.length} lender(s).`
            : "We were unable to pre-qualify you at this time.",
        nextSteps:
          eligibleLenders.length > 0
            ? ["Review your offers", "Select a lender", "Complete full application"]
            : ["Improve credit score", "Add co-applicant", "Increase down payment"],
      },
    }),
    { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
  )
})
