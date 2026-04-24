"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function FinancingError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return <ErrorBoundaryUI error={error} reset={reset} />
}
