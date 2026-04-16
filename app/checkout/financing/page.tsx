"use client"

import Link from "next/link"

export default function FinancingStepPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Step 5 — Financing</h1>
        <p className="text-muted-foreground mb-8">
          Your application has been submitted. You will be contacted within 24 hours with your financing options.
        </p>
        <div data-testid="persona-inquiry-container" className="rounded-xl border bg-card p-6 mb-8">
          <h2 className="font-semibold text-lg mb-2">Identity Verification</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Complete identity verification to finalize your financing application.
          </p>
          <Link
            href="/financing/verification"
            data-testid="btn-continue-step5"
            className="inline-block min-h-[48px] rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Start Verification
          </Link>
          <Link
            href="/checkout/personal-info"
            data-testid="btn-back-step5"
            className="inline-block ml-4 min-h-[48px] rounded-lg border px-6 py-3 font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back
          </Link>
        </div>
      </div>
    </main>
  )
}
