"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function ContactError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Something Went Wrong"
      body="We couldn't load the contact page. Please try again or reach out to us directly."
      phonePrompt="Need immediate assistance?"
    />
  )
}
