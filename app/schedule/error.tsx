"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function ScheduleError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Something Went Wrong"
      body="We couldn't load this page. Please try again."
      phonePrompt="Need immediate assistance?"
    />
  )
}
