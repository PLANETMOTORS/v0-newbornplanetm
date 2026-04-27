"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/error-reporting"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Phone } from "lucide-react"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

interface SecondaryAction {
  label: string
  href: string
  icon?: "home" | "arrow-left"
}

interface ErrorBoundaryUIProps {
  error: Error & { digest?: string }
  reset: () => void
  /** Additional context forwarded to reportError (e.g. boundary identifier, flags). */
  context?: Record<string, unknown>
  /** Override the heading. Defaults to "Something went wrong". */
  title?: string
  /** Override the description. Defaults to a generic message. */
  body?: string
  /** Override the secondary action button. Defaults to "Go Home" (href="/"). */
  secondaryAction?: SecondaryAction
  /** If set, renders a phone CTA block below the action buttons with this prompt text. */
  phonePrompt?: string
}

/**
 * Shared error boundary UI used by every app segment error.tsx file.
 * Next.js requires each segment to export its own default function,
 * so each error.tsx re-exports this component under a local name.
 */
export function ErrorBoundaryUI({
  error,
  reset,
  context,
  title = "Something went wrong",
  body = "We encountered an unexpected error. Please try again.",
  secondaryAction,
  phonePrompt,
}: Readonly<ErrorBoundaryUIProps>) {
  useEffect(() => {
    reportError(error, context)
  }, [error, context])

  const secondary = secondaryAction ?? { label: "Go Home", href: "/", icon: "home" as const }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className={cn("text-muted-foreground", phonePrompt ? "mb-8" : "mb-6")}>{body}</p>
        <div className={cn("flex flex-col sm:flex-row gap-3 justify-center", phonePrompt && "mb-8")}>
          <Button onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => { globalThis.location.href = secondary.href }}>
            {secondary.icon === "arrow-left" ? (
              <ArrowLeft className="w-4 h-4 mr-2" />
            ) : (
              <Home className="w-4 h-4 mr-2" />
            )}
            {secondary.label}
          </Button>
        </div>
        {phonePrompt && (
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">{phonePrompt}</p>
            <a
              href={`tel:${PHONE_TOLL_FREE_TEL}`}
              className="inline-flex items-center justify-center gap-2 text-primary hover:underline font-semibold"
            >
              <Phone className="w-4 h-4" />
              Call {PHONE_TOLL_FREE}
            </a>
          </div>
        )}
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
