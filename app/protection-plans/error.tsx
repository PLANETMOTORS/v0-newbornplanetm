"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function ProtectionPlansError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryUI {...props} />
}
