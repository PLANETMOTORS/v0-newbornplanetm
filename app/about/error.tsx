"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/error-reporting"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home, Phone } from "lucide-react"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

export default function AboutError({
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
        <h1 className="text-3xl font-bold tracking-[-0.01em] text-foreground mb-4">Something Went Wrong</h1>
        <p className="text-muted-foreground mb-8">We couldn&apos;t load this page. Please try again.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button onClick={reset}><RefreshCw className="w-4 h-4 mr-2" />Try Again</Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}><Home className="w-4 h-4 mr-2" />Go Home</Button>
        </div>
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Need immediate assistance?</p>
          <a href={`tel:${PHONE_TOLL_FREE_TEL}`} className="inline-flex items-center justify-center gap-2 text-primary hover:underline">
            <Phone className="w-4 h-4" />Call {PHONE_TOLL_FREE}
          </a>
          {error.digest && <p className="text-xs text-muted-foreground mt-4">Error ID: {error.digest}</p>}
        </div>
      </div>
    </div>
  )
}
