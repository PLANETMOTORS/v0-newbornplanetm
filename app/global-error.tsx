"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/error-reporting"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error, { boundary: "global", critical: true })
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif", maxWidth: "28rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something Went Wrong</h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            An unexpected error has occurred. Please try again or contact our support team.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                borderRadius: "0.25rem",
                border: "1px solid #ccc",
                background: "#f5f5f5",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/inventory"}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                borderRadius: "0.25rem",
                border: "1px solid #ccc",
                background: "transparent",
              }}
            >
              Back to Inventory
            </button>
          </div>
          <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "1.5rem" }}>
            Need help? Call{" "}
            <a href="tel:1-866-797-3332" style={{ color: "#2563eb" }}>1-866-797-3332</a>
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "1rem" }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
