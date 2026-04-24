"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function TradeInError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      context={{ boundary: "trade-in" }}
      title="Trade-In Form Error"
      body="We ran into an issue with the trade-in form. Your entered information may still be saved. Please try again."
      secondaryAction={{ label: "Back to Inventory", href: "/inventory", icon: "arrow-left" }}
      phonePrompt="Need immediate assistance?"
    />
  )
}
