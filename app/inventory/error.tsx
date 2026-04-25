"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function InventoryError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      context={{ boundary: "inventory" }}
      title="Unable to Load Inventory"
      body="We're having trouble loading our vehicle inventory right now. Please try again in a moment."
      phonePrompt="Need immediate assistance?"
    />
  )
}
