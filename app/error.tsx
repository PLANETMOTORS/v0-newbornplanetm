"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/error-reporting"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home, Phone } from "lucide-react"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error)
  }, [error])

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
