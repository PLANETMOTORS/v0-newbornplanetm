/**
 * Builds a user-facing error message from a finance application submit response.
 * Extracted as a standalone utility for testability.
 */
export function buildSubmitError(status: number, result: Record<string, unknown>): string {
  const rawMsg =
    (result?.error as Record<string, unknown>)?.message as string ||
    result?.error as string ||
    result?.message as string ||
    JSON.stringify(result) ||
    "Failed to submit application"
  if (status === 403) return "You don't have permission to submit this application. Please log in and try again."
  if (status === 401) return "Your session has expired. Please log in again and resubmit."
  return rawMsg
}
