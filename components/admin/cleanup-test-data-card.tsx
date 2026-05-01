"use client"

/**
 * Cleanup Test Data — admin dashboard card.
 *
 * Wraps `POST /api/v1/admin/cleanup/test-data` (preview + delete).
 * Two-step flow: dry-run preview → confirm → execute deletion.
 *
 * Backend contract (mode=test-pattern):
 *   { mode: "test-pattern", dryRun: boolean }
 * Returns counts grouped by table; we surface them so the operator
 * sees exactly what is about to disappear.
 */

import { useCallback, useState } from "react"
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TableCount {
  readonly table: string
  readonly count: number
}

interface CleanupSummary {
  readonly tables: readonly TableCount[]
  readonly totalRows: number
  readonly executed: boolean
  readonly errors?: readonly string[]
}

type Step =
  | { readonly kind: "idle" }
  | { readonly kind: "previewing" }
  | { readonly kind: "preview"; readonly summary: CleanupSummary }
  | { readonly kind: "deleting"; readonly summary: CleanupSummary }
  | { readonly kind: "deleted"; readonly summary: CleanupSummary }
  | { readonly kind: "error"; readonly message: string }

type CleanupApiResponse =
  | {
      ok: true
      mode: "test-pattern"
      dryRun: true
      summary: Record<string, number>
    }
  | {
      ok: boolean
      mode: "test-pattern"
      dryRun: false
      deleted: Record<string, number>
      errors?: readonly string[]
    }

function toSummary(json: CleanupApiResponse, executed: boolean): CleanupSummary {
  const counts: Record<string, number> =
    json.dryRun === true ? json.summary : json.deleted
  const tables: TableCount[] = Object.entries(counts).map(([table, count]) => ({
    table,
    count,
  }))
  const totalRows = tables.reduce((sum, t) => sum + t.count, 0)
  const errors =
    json.dryRun === false && Array.isArray(json.errors) ? json.errors : undefined
  return { tables, totalRows, executed, ...(errors ? { errors } : {}) }
}

async function callCleanup(dryRun: boolean): Promise<CleanupSummary> {
  const res = await fetch("/api/v1/admin/cleanup/test-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "test-pattern", dryRun }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string } | string
    }
    const msg =
      typeof body.error === "string"
        ? body.error
        : body.error?.message ?? `Cleanup failed (${res.status})`
    throw new Error(msg)
  }
  const json = (await res.json()) as CleanupApiResponse
  return toSummary(json, !dryRun)
}

export function CleanupTestDataCard() {
  const [step, setStep] = useState<Step>({ kind: "idle" })

  const startPreview = useCallback(async () => {
    setStep({ kind: "previewing" })
    try {
      const summary = await callCleanup(true)
      setStep({ kind: "preview", summary })
    } catch (caught) {
      setStep({
        kind: "error",
        message: caught instanceof Error ? caught.message : "Preview failed",
      })
    }
  }, [])

  const confirmDelete = useCallback(async () => {
    if (step.kind !== "preview") return
    setStep({ kind: "deleting", summary: step.summary })
    try {
      const summary = await callCleanup(false)
      setStep({ kind: "deleted", summary })
    } catch (caught) {
      setStep({
        kind: "error",
        message: caught instanceof Error ? caught.message : "Delete failed",
      })
    }
  }, [step])

  const reset = useCallback(() => setStep({ kind: "idle" }), [])

  const renderTables = (summary: CleanupSummary) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
      {summary.tables.map((t) => (
        <div
          key={t.table}
          className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
        >
          <p className="text-gray-500">{t.table}</p>
          <p className="font-semibold">{t.count}</p>
        </div>
      ))}
    </div>
  )

  return (
    <Card data-testid="cleanup-test-data-card" className="border-red-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trash2 className="w-5 h-5 text-red-600" />
          Cleanup test data
        </CardTitle>
        <CardDescription>
          Removes pre-launch QA fixtures (rows whose email or VIN matches
          a test-pattern) from the leads, reservations, and trade-in
          tables. Always previews before deleting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step.kind === "idle" && (
          <Button variant="outline" onClick={startPreview}>
            <AlertTriangle className="w-4 h-4 mr-2 text-amber-600" />
            Preview rows to delete
          </Button>
        )}

        {step.kind === "previewing" && (
          <p className="text-sm text-gray-500">Counting test-pattern rows...</p>
        )}

        {step.kind === "preview" && (
          <div>
            <Badge variant="outline" className="mb-2">
              Dry-run — nothing deleted yet
            </Badge>
            <p className="text-sm">
              <span className="font-semibold">{step.summary.totalRows}</span>{" "}
              rows match the test-data pattern across{" "}
              {step.summary.tables.length} tables.
            </p>
            {renderTables(step.summary)}
            <div className="flex gap-2 mt-4">
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={step.summary.totalRows === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {step.summary.totalRows} rows
              </Button>
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step.kind === "deleting" && (
          <p className="text-sm text-gray-500">
            Deleting {step.summary.totalRows} rows...
          </p>
        )}

        {step.kind === "deleted" && (
          <div>
            <p className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>
                Deleted{" "}
                <span className="font-semibold">{step.summary.totalRows}</span>{" "}
                rows.
              </span>
            </p>
            {renderTables(step.summary)}
            <Button variant="outline" onClick={reset} className="mt-4">
              Done
            </Button>
          </div>
        )}

        {step.kind === "error" && (
          <div>
            <p className="text-sm text-red-700">{step.message}</p>
            <Button variant="outline" onClick={reset} className="mt-3">
              Try again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
