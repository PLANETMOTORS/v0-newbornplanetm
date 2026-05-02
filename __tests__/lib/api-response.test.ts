import { describe, expect, it } from "vitest"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"

async function readJson(res: Response) {
  return JSON.parse(await res.text())
}

describe("lib/api-response apiSuccess", () => {
  it("wraps payload in { success: true, data } with default 200 status", async () => {
    const res = apiSuccess({ id: 1 })
    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ success: true, data: { id: 1 } })
  })

  it("respects an explicit non-200 status", async () => {
    const res = apiSuccess({ ok: true }, 201)
    expect(res.status).toBe(201)
    expect(await readJson(res)).toEqual({ success: true, data: { ok: true } })
  })

  it("supports primitive data values", async () => {
    const res = apiSuccess(42)
    expect(await readJson(res)).toEqual({ success: true, data: 42 })
  })

  it("supports null data", async () => {
    const res = apiSuccess(null)
    expect(await readJson(res)).toEqual({ success: true, data: null })
  })
})

describe("lib/api-response apiError", () => {
  it("returns { success: false, error: { code, message } } and default 500 status", async () => {
    const res = apiError("BOOM", "Something failed")
    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({
      success: false,
      error: { code: "BOOM", message: "Something failed" },
    })
  })

  it("respects an explicit status code", async () => {
    const res = apiError(ErrorCode.UNAUTHORIZED, "Auth required", 401)
    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Auth required" },
    })
  })

  it("includes details when provided (non-undefined)", async () => {
    const res = apiError(ErrorCode.VALIDATION_ERROR, "Invalid", 400, { field: "email" })
    const body = await readJson(res)
    expect(body.error.details).toEqual({ field: "email" })
  })

  it("does NOT include details key when details is omitted", async () => {
    const body = await readJson(apiError("X", "Y", 400))
    expect("details" in body.error).toBe(false)
  })

  it("does NOT include details key when details is explicitly undefined", async () => {
    const body = await readJson(apiError("X", "Y", 400, undefined))
    expect("details" in body.error).toBe(false)
  })

  it("includes details when value is null (treated as defined)", async () => {
    const body = await readJson(apiError("X", "Y", 400, null))
    expect(body.error.details).toBeNull()
  })

  it("includes details when value is falsy 0 / '' / false", async () => {
    expect((await readJson(apiError("X", "Y", 400, 0))).error.details).toBe(0)
    expect((await readJson(apiError("X", "Y", 400, ""))).error.details).toBe("")
    expect((await readJson(apiError("X", "Y", 400, false))).error.details).toBe(false)
  })
})

describe("lib/api-response ErrorCode", () => {
  it("exports all expected codes as string literals", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR")
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED")
    expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN")
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND")
    expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED")
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR")
    expect(ErrorCode.CONFIG_ERROR).toBe("CONFIG_ERROR")
  })
})
