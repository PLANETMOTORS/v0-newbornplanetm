"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function CheckoutError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      context={{ boundary: "checkout", critical: true }}
      title="Checkout Interrupted"
      body="We encountered an issue during checkout. Don't worry — no charges have been made. Your information is safe. Please try again or call us for assistance completing your purchase."
      secondaryAction={{ label: "Back to Inventory", href: "/inventory", icon: "arrow-left" }}
      phonePrompt="Need help completing your purchase?"
    />
  )
}
