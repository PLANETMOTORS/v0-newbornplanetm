"use client"

/**
 * Per-row delete button used by every admin CRM list (leads, finance,
 * reservations, trade-ins).
 *
 * Lifecycle:
 *   1. Click → `globalThis.confirm(...)` (skippable when the parent has
 *      already confirmed, e.g. multi-row delete).
 *   2. Fire DELETE against the supplied endpoint.
 *   3. On success: invoke `onDeleted(id)` so the parent can either
 *      optimistically drop the row or re-fetch.
 *   4. On failure: surface the API's structured error message in a
 *      transient inline span next to the button.
 */

import { useCallback, useState } from "react"
import { Trash2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeleteApiError {
  error?:
    | string
    | { code?: string; message?: string }
}

interface DeleteRowButtonProps {
  /**
   * Full path to the DELETE endpoint, including the row id.
   * Example: `/api/v1/admin/leads/abc-123`
   */
  readonly endpoint: string
  /** Row id passed back to the parent on success. */
  readonly id: string
  /** Human-readable description of the row used in the confirm prompt. */
  readonly label?: string
  /** Suppress the confirmation prompt when the parent already confirmed. */
  readonly skipConfirm?: boolean
  readonly onDeleted: (id: string) => void
  readonly size?: "sm" | "default"
  readonly className?: string
  readonly disabled?: boolean
}

export function DeleteRowButton({
  endpoint,
  id,
  label,
  skipConfirm,
  onDeleted,
  size = "sm",
  className,
  disabled,
}: DeleteRowButtonProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      // Stop a parent <button> (e.g. clickable lead row) from firing.
      event.stopPropagation()
      event.preventDefault()
      if (
        !skipConfirm &&
        !globalThis.confirm(
          `Delete ${label ?? "this row"}? This cannot be undone.`,
        )
      )
        return
      setPending(true)
      setError(null)
      try {
        const res = await fetch(endpoint, { method: "DELETE" })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as DeleteApiError
          const msg =
            typeof body.error === "string"
              ? body.error
              : body.error?.message ?? `Delete failed (${res.status})`
          throw new Error(msg)
        }
        onDeleted(id)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Delete failed")
      } finally {
        setPending(false)
      }
    },
    [endpoint, id, label, skipConfirm, onDeleted],
  )

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled={disabled || pending}
        onClick={handleClick}
        aria-label={`Delete ${label ?? "row"}`}
        className={`text-red-600 hover:bg-red-50 ${className ?? ""}`.trim()}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          {error}
        </span>
      )}
    </span>
  )
}
