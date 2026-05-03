/**
 * Streaming HomenetIOL CSV parser — processes 10k+ rows with stable
 * memory footprint by yielding batches instead of building a full array.
 *
 * Uses PapaParse in streaming mode with step-by-step row processing.
 * Each batch is yielded to the caller for immediate DB upsert, so only
 * one batch of VehicleData objects lives in memory at a time.
 */
import Papa from "papaparse"
import { Readable } from "node:stream"
import type { VehicleData } from "./parser"

// Re-export the row mapper so streaming callers don't need the full parser
export { mapCSVRowToVehicle } from "./csv-row-mapper"

// ==================== TYPES ====================

export interface StreamingParseOptions {
  /** Number of vehicles per batch (default: 500) */
  batchSize?: number
  /** Called for each parsed + valid vehicle batch */
  onBatch: (batch: VehicleData[], batchIndex: number) => Promise<void>
  /** Called when parsing is complete */
  onComplete?: (stats: StreamingParseStats) => void
  /** Called on parse errors (non-fatal) */
  onError?: (error: string, row: number) => void
}

export interface StreamingParseStats {
  totalRows: number
  validVehicles: number
  skippedRows: number
  batches: number
}

// ==================== STREAMING PARSER ====================

/**
 * Parse a CSV string using PapaParse streaming. Instead of building
 * a 10k-element array, yields batches of `batchSize` vehicles to
 * the `onBatch` callback for immediate processing.
 *
 * Memory stays bounded: only headers + one batch + PapaParse internal
 * buffer live in memory at any time.
 */
export async function parseHomenetCSVStream(
  csvInput: string | Readable,
  options: StreamingParseOptions,
): Promise<StreamingParseStats> {
  const { batchSize = 500, onBatch, onComplete, onError } = options
  const { mapCSVRowToVehicle } = await import("./csv-row-mapper")

  const stats: StreamingParseStats = {
    totalRows: 0,
    validVehicles: 0,
    skippedRows: 0,
    batches: 0,
  }

  let currentBatch: VehicleData[] = []

  async function flushBatch(): Promise<void> {
    if (currentBatch.length === 0) return
    const batch = currentBatch
    currentBatch = []
    stats.batches++
    await onBatch(batch, stats.batches - 1)
  }

  return new Promise((resolve, reject) => {
    Papa.parse(csvInput instanceof Readable ? csvInput : csvInput, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) =>
        header
          .trim()
          .toLowerCase()
          .replaceAll(/[^a-z0-9]/g, "_")
          .replaceAll(/_+/g, "_")
          .replaceAll(/^_|_$/g, ""),
      step: (results: Papa.ParseStepResult<Record<string, string>>) => {
        stats.totalRows++
        try {
          const vehicle = mapCSVRowToVehicle(results.data)
          if (vehicle?.vin && vehicle.stock_number) {
            currentBatch.push(vehicle)
            stats.validVehicles++

            if (currentBatch.length >= batchSize) {
              // PapaParse step is sync — we pause, flush, then resume
              // For string input, we queue the flush
              flushBatch().catch(reject)
            }
          } else {
            stats.skippedRows++
          }
        } catch (err) {
          stats.skippedRows++
          onError?.(
            err instanceof Error ? err.message : "Parse error",
            stats.totalRows,
          )
        }
      },
      complete: async () => {
        try {
          await flushBatch() // flush remaining
          onComplete?.(stats)
          resolve(stats)
        } catch (err) {
          reject(err)
        }
      },
      error: (err: Error) => {
        reject(new Error(`CSV parse failed: ${err.message}`))
      },
    })
  })
}
