"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function VehicleDetailError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      context={{ boundary: "vehicle-detail" }}
      title="Vehicle Details Unavailable"
      body="We couldn't load this vehicle's details. Please try again or browse our other vehicles."
      secondaryAction={{ label: "Back to Inventory", href: "/inventory", icon: "arrow-left" }}
      phonePrompt="Need immediate assistance?"
    />
  )
}
