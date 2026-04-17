"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/error-reporting"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home, Phone } from "lucide-react"

export default function BlogError({
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
          Something Went Wrong
        </h1>
        <p className="text-muted-foreground mb-8">
          We couldn&apos;t load this blog content. Please try again or browse our other articles.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Need immediate assistance?
          </p>
          <a
            href="tel:1-866-797-3332"
            className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
          >
            <Phone className="w-4 h-4" />
            Call 1-866-797-3332
          </a>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-4">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
