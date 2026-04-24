"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function FinancingApplicationError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryUI {...props} />
}
