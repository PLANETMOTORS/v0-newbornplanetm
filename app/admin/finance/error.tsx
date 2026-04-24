"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function AdminFinanceError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryUI {...props} />
}
