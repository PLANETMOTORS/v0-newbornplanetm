"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function FinancingApplicationError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      body="Your finance form data is saved in this browser. Try again to continue your application."
      secondaryAction={{ label: "Back to Inventory", href: "/inventory", icon: "arrow-left" }}
    />
  )
}
