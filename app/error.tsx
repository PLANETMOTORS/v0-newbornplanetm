"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function GlobalError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Something Went Wrong"
      body="We apologize for the inconvenience. An unexpected error has occurred. Please try again or contact our support team if the problem persists."
      phonePrompt="Need immediate assistance?"
    />
  )
}
