"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/error-reporting"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorBoundaryUIProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Shared error boundary UI used by every app/*/error.tsx file.
 * Next.js requires each segment to export its own default function,
 * so each error.tsx re-exports this component under a local name.
 */
export function ErrorBoundaryUI({ error, reset }: ErrorBoundaryUIProps) {
  useEffect(() => {
    reportError(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
