"use client"
import { ErrorBoundaryUI } from "@/components/error-boundary-ui"
export default function BlogError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryUI {...props} />
}
