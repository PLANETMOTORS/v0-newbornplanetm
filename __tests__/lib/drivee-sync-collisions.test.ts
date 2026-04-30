import { describe, it, expect, vi, beforeEach } from "vitest"
import { findExistingMidConflict } from "@/lib/drivee-sync"

interface QueryResult {
  data: { vin: string } | null
  error: { message: string } | null
}

function makeSupabase(result: QueryResult) {
  const calls: { table: string; cols: string; eqMid: string; neqVin: string; limitN: number }[] = []
  const client = {
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (col1: string, mid: string) => ({
          neq: (col2: string, vin: string) => ({
            limit: (n: number) => ({
              maybeSingle: async () => {
                calls.push({ table, cols, eqMid: mid, neqVin: vin, limitN: n })
                expect(col1).toBe("mid")
                expect(col2).toBe("vin")
                return result
              },
            }),
          }),
        }),
      }),
    }),
  }
  return { client, calls }
}

describe("findExistingMidConflict", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns conflict=false when no row exists for that MID", async () => {
    const { client, calls } = makeSupabase({ data: null, error: null })
    const result = await findExistingMidConflict(client, "190171976531", "1C4JJXP60MW777382")
    expect(result).toEqual({ conflict: false })
    expect(calls).toHaveLength(1)
    expect(calls[0].eqMid).toBe("190171976531")
    expect(calls[0].neqVin).toBe("1C4JJXP60MW777382")
    expect(calls[0].limitN).toBe(1)
  })

  it("returns conflict=true with existingVin when another VIN already owns the MID", async () => {
    const { client } = makeSupabase({
      data: { vin: "1C4JJXP60MW777382" }, // granite Jeep already owns the MID
      error: null,
    })
    const result = await findExistingMidConflict(
      client,
      "190171976531",
      "1C4JJXP6XMW777356", // red Jeep tries to claim same MID
    )
    expect(result).toEqual({
      conflict: true,
      existingVin: "1C4JJXP60MW777382",
    })
  })

  it("returns conflict=false on DB error (fail-open — don't block sync)", async () => {
    const { client } = makeSupabase({
      data: null,
      error: { message: "connection reset" },
    })
    const result = await findExistingMidConflict(client, "190171976531", "1C4JJXP60MW777382")
    expect(result).toEqual({ conflict: false })
  })

  it("queries the correct table", async () => {
    const { client, calls } = makeSupabase({ data: null, error: null })
    await findExistingMidConflict(client, "999", "VIN1")
    expect(calls[0].table).toBe("drivee_mappings")
  })

  it("selects only the VIN column (minimal payload)", async () => {
    const { client, calls } = makeSupabase({ data: null, error: null })
    await findExistingMidConflict(client, "999", "VIN1")
    expect(calls[0].cols).toBe("vin")
  })
})
