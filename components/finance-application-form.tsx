"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowRight, Calculator, Loader2, CheckCircle, Mail, RefreshCw, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { invokeEdgeFunction } from "@/lib/supabase/edge-functions"

interface LenderOffer {
  lenderId: string
  lenderName: string
  estimatedRate: number
  estimatedTerm: number
  estimatedMonthlyPayment: number
  prequalified: boolean
  confidence: string
}

interface PrequalificationResult {
  status: string
  creditScore: number
  eligibleLenders: LenderOffer[]
  bestOffer: LenderOffer | null
}

type FormStage =
  | "form"           // User filling out the form
  | "capturing"      // Lead capture in progress
  | "magic_link"     // "We sent a verification link" UI
  | "verifying"      // Magic link clicked, running credit pull
  | "results"        // Pre-qualification results displayed

export function FinanceApplicationForm() {
  const { user } = useAuth()
  const [stage, setStage] = useState<FormStage>("form")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PrequalificationResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null)
  const [creditPullError, setCreditPullError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [leadId, setLeadId] = useState<string | null>(null)
  const formDataRef = useRef({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    annualIncome: 60000,
    requestedAmount: 35000,
    requestedTerm: 72,
  })
  const [formData, setFormData] = useState(formDataRef.current)

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    formDataRef.current = formData
  }, [formData])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Run the soft credit pull after authentication
  const runCreditPull = useCallback(async () => {
    setStage("verifying")
    setCreditPullError(null)
    try {
      // Get the current session token for authenticated Edge Function call
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const { data } = await invokeEdgeFunction<{ success: boolean; data: { prequalification: PrequalificationResult }; error?: string }>("finance-prequalify", {
        annualIncome: formDataRef.current.annualIncome,
        requestedAmount: formDataRef.current.requestedAmount,
        requestedTerm: formDataRef.current.requestedTerm,
      }, { accessToken: session?.access_token })

      if (data.success) {
        setResult(data.data.prequalification)
        setStage("results")
      } else {
        console.error("Credit pull failed:", data.error)
        setCreditPullError("We couldn\u2019t complete your credit check right now. Please try again.")
        setStage("results")
      }
    } catch (error) {
      console.error("Financing API error:", error)
      setCreditPullError("Something went wrong while checking rates. Please try again.")
      setStage("results")
    }
  }, [])

  // Listen for auth state changes — magic link callback
  useEffect(() => {
    if (stage !== "magic_link") return

    try {
      const supabase = createClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event) => {
          if (event === "SIGNED_IN") {
            runCreditPull()
          }
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    } catch {
      // Supabase not configured — skip listener
    }
  }, [stage, runCreditPull])

  // If user is already authenticated and we're on magic_link stage,
  // skip straight to credit pull (e.g., user returned to same tab after clicking link)
  useEffect(() => {
    if (user && stage === "magic_link") {
      runCreditPull()
    }
  }, [user, stage, runCreditPull])

  const calculatePaymentPreview = () => {
    const rate = 6.29 / 100 / 12
    const term = formData.requestedTerm || 72
    const amount = formData.requestedAmount || 0
    if (amount <= 0 || term <= 0) return 0
    const payment = (amount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)
    return Number.isFinite(payment) ? Math.round(payment) : 0
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim()) errors.firstName = "First Name is required"
    if (!formData.lastName.trim()) errors.lastName = "Last Name is required"
    if (!formData.email.trim()) {
      errors.email = "Email Address is required"
    // Bound length before regex to prevent ReDoS on pathological inputs (S2631).
    } else if (formData.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone Number is required"
    } else if (formData.phone.replaceAll(/\D/g, "").length < 10) {
      errors.phone = "Phone must be at least 10 digits"
    }
    return errors
  }

  const sendMagicLink = async (email: string) => {
    try {
      const supabase = createClient()
      const redirectTo = `${globalThis.location.origin}/financing?verified=true`

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send verification email"
      return { success: false, error: message }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors({})

    // If already authenticated, skip magic link — go straight to credit pull
    if (user) {
      setIsLoading(true)
      // Still capture the lead for CRM tracking via Edge Function
      invokeEdgeFunction("capture-lead", formData).catch((err) => console.warn("[silent-catch]", err))

      await runCreditPull()
      setIsLoading(false)
      return
    }

    // Unauthenticated flow: capture lead first, then send magic link
    setStage("capturing")
    setIsLoading(true)
    setMagicLinkError(null)

    try {
      // Step 1: Capture the lead (DB + AutoRaptor) via Edge Function
      const { data: captureData } = await invokeEdgeFunction<{ success: boolean; data: { leadId: string | null } }>("capture-lead", formData)
      if (captureData.data?.leadId) {
        setLeadId(captureData.data.leadId)
      }

      // Step 2: Send magic link
      const magicLinkResult = await sendMagicLink(formData.email.trim())

      if (!magicLinkResult.success) {
        setMagicLinkError(magicLinkResult.error ?? "Failed to send verification email")
        setStage("form")
        setIsLoading(false)
        return
      }

      // Step 3: Show "check your email" UI
      setStage("magic_link")
      setResendCooldown(60)
    } catch (error) {
      console.error("Submit error:", error)
      setMagicLinkError("Something went wrong. Please try again.")
      setStage("form")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendMagicLink = async () => {
    if (resendCooldown > 0) return
    setMagicLinkError(null)

    const result = await sendMagicLink(formData.email.trim())
    if (result.success) {
      setResendCooldown(60)
    } else {
      setMagicLinkError(result.error ?? "Failed to resend email")
    }
  }

  // ──────────────────────────────────────────
  // Stage: Results — error fallback
  // ──────────────────────────────────────────
  if (stage === "results" && !result) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Credit Check Unavailable</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {creditPullError || "We couldn\u2019t complete your credit check right now."}
          </p>
          {leadId && (
            <p className="text-sm text-muted-foreground mt-1">
              Don&apos;t worry — your application has been saved and our team will follow up.
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <Button className="w-full" size="lg" onClick={() => runCreditPull()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" className="w-full" onClick={() => {
            setStage("form")
            setCreditPullError(null)
          }}>
            Back to Form
          </Button>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────
  // Stage: Results (pre-qualification offers)
  // ──────────────────────────────────────────
  if (stage === "results" && result) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-lg">
            {result.status === "prequalified" ? "You're Pre-Qualified!" : "Application Received"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {result.eligibleLenders.length} lender(s) available
          </p>
        </div>

        {result.bestOffer && (
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
            <p className="text-xs text-muted-foreground mb-1">Best Rate Available</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary tabular-nums">{result.bestOffer.estimatedRate}%</span>
              <span className="text-muted-foreground">APR</span>
            </div>
            <p className="text-sm mt-2 tabular-nums">
              ${result.bestOffer.estimatedMonthlyPayment}/mo for {result.bestOffer.estimatedTerm} months
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              via {result.bestOffer.lenderName}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold">All Offers:</p>
          {result.eligibleLenders.slice(0, 4).map((offer) => (
            <div key={offer.lenderId} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="font-semibold">{offer.lenderName}</span>
              <div className="text-right">
                <span className="font-bold tabular-nums">{offer.estimatedRate}%</span>
                <span className="text-sm text-muted-foreground ml-2 tabular-nums">${offer.estimatedMonthlyPayment}/mo</span>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full" size="lg" onClick={() => globalThis.location.href = "/financing/application"}>
          Continue Application
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <Button variant="outline" className="w-full" onClick={() => {
          setResult(null)
          setStage("form")
          setLeadId(null)
        }}>
          Start Over
        </Button>
      </div>
    )
  }

  // ──────────────────────────────────────────
  // Stage: Verifying (credit pull in progress)
  // ──────────────────────────────────────────
  if (stage === "verifying") {
    return (
      <div className="space-y-6 text-center py-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <div>
          <h3 className="font-semibold text-lg">Running Soft Credit Check</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No impact on your credit score. This will only take a moment.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>256-bit encrypted &middot; PIPEDA compliant</span>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────
  // Stage: Magic Link Sent
  // ──────────────────────────────────────────
  if (stage === "magic_link") {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>

        <div>
          <h3 className="font-semibold text-lg">Check Your Email</h3>
          <p className="text-sm text-muted-foreground mt-2">
            We sent a verification link to{" "}
            <span className="font-semibold text-foreground">{formData.email}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click the link to complete your pre-approval. No password needed.
          </p>
        </div>

        {leadId && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>Your application has been saved</span>
            </div>
          </div>
        )}

        {magicLinkError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <p className="text-sm text-destructive">{magicLinkError}</p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendMagicLink}
            disabled={resendCooldown > 0}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend Verification Email"}
          </Button>

          <button
            onClick={() => {
              setStage("form")
              setMagicLinkError(null)
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Use a different email
          </button>
        </div>

        <div className="border-t pt-4">
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Your data is secure and encrypted</span>
            </div>
            <span>Check your spam folder if you don&apos;t see the email</span>
          </div>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────
  // Stage: Form (default)
  // ──────────────────────────────────────────
  const isSubmitDisabled = isLoading || !formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {magicLinkError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{magicLinkError}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value })
              if (validationErrors.firstName) {
                const { firstName: _, ...rest } = validationErrors
                setValidationErrors(rest)
              }
            }}
            required
          />
          {validationErrors.firstName && (
            <p className="text-xs text-destructive mt-1">{validationErrors.firstName}</p>
          )}
        </div>
        <div>
          <Input
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({ ...formData, lastName: e.target.value })
              if (validationErrors.lastName) {
                const { lastName: _, ...rest } = validationErrors
                setValidationErrors(rest)
              }
            }}
            required
          />
          {validationErrors.lastName && (
            <p className="text-xs text-destructive mt-1">{validationErrors.lastName}</p>
          )}
        </div>
      </div>
      <div>
        <Input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value })
            if (validationErrors.email) {
              const { email: _, ...rest } = validationErrors
              setValidationErrors(rest)
            }
          }}
          required
        />
        {validationErrors.email && (
          <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
        )}
      </div>
      <div>
        <Input
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(e) => {
            setFormData({ ...formData, phone: e.target.value })
            if (validationErrors.phone) {
              const { phone: _, ...rest } = validationErrors
              setValidationErrors(rest)
            }
          }}
          required
        />
        {validationErrors.phone && (
          <p className="text-xs text-destructive mt-1">{validationErrors.phone}</p>
        )}
      </div>

      {/* Annual Income Slider */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Label>Annual Income</Label>
          <span className="font-semibold tabular-nums">${formData.annualIncome.toLocaleString()}</span>
        </div>
        <Slider
          value={[formData.annualIncome]}
          onValueChange={(value) => setFormData({ ...formData, annualIncome: value[0] })}
          min={25000}
          max={200000}
          step={5000}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$25,000</span>
          <span>$200,000</span>
        </div>
      </div>

      {/* Loan Amount Slider */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Label>Loan Amount</Label>
          <span className="font-semibold tabular-nums">${formData.requestedAmount.toLocaleString()}</span>
        </div>
        <Slider
          value={[formData.requestedAmount]}
          onValueChange={(value) => setFormData({ ...formData, requestedAmount: value[0] })}
          min={10000}
          max={100000}
          step={1000}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$10,000</span>
          <span>$100,000</span>
        </div>
      </div>

      {/* Term Selector */}
      <div className="space-y-3">
        <Label>Loan Term</Label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[36, 48, 60, 72, 84, 96].map((term) => (
            <Button
              key={term}
              type="button"
              variant={formData.requestedTerm === term ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData({ ...formData, requestedTerm: term })}
              className="text-xs"
            >
              {term} mo
            </Button>
          ))}
        </div>
      </div>

      {/* Payment Preview */}
      <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm">Est. Monthly Payment</span>
        </div>
        <span className="text-xl font-bold tabular-nums">${calculatePaymentPreview()}/mo</span>
      </div>

      {Object.values(validationErrors).some(Boolean) && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="font-semibold text-sm text-destructive mb-1">Please fix the following:</p>
          <ul className="list-disc pl-5 space-y-1">
            {Object.values(validationErrors).filter(Boolean).map((error) => (
              <li key={error} className="text-xs text-destructive">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitDisabled}>
        {isLoading || stage === "capturing" ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {stage === "capturing" ? "Saving Your Application..." : "Checking Rates..."}
          </>
        ) : (
          <>
            Get Pre-Approved
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span>No impact on your credit score &middot; No password required</span>
      </div>
    </form>
  )
}
