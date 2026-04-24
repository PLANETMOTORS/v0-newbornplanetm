"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function FinancingError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Something Went Wrong"
      body="We couldn't load the financing page. Please try again or call us to discuss financing options."
      phonePrompt="Need immediate assistance?"
    />
  )
}
