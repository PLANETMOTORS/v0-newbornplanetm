"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <h1>Something went wrong</h1>
          <p>An unexpected error has occurred. Please try again.</p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              marginTop: "1rem",
              cursor: "pointer",
              borderRadius: "0.25rem",
              border: "1px solid #ccc",
              background: "#f5f5f5",
            }}
          >
            Try Again
          </button>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "1rem" }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
