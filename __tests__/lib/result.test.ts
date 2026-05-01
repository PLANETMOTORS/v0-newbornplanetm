import { describe, it, expect } from "vitest"
import {
  ok,
  err,
  mapResult,
  andThen,
  mapErr,
  fromPromise,
  fromTry,
  isResult,
} from "@/lib/result"

describe("ok / err", () => {
  it("ok wraps a value", () => {
    const r = ok(42)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(42)
  })

  it("err wraps an error", () => {
    const r = err("nope")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe("nope")
  })
})

describe("mapResult", () => {
  it("maps the success value", () => {
    const r = mapResult(ok(2), (n) => n * 3)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(6)
  })

  it("passes errors through unchanged", () => {
    const r = mapResult(err("fail"), (n: number) => n * 3)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe("fail")
  })
})

describe("andThen", () => {
  it("chains a Result-returning function on success", () => {
    const r = andThen(ok(2), (n) => ok(n + 1))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(3)
  })

  it("short-circuits on the first error", () => {
    const r = andThen(ok(2), () => err("oops"))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe("oops")
  })

  it("does not invoke the chained function on err input", () => {
    let called = false
    const r = andThen(err("first"), (_n: number) => {
      called = true
      return ok(0)
    })
    expect(called).toBe(false)
    expect(r.ok).toBe(false)
  })
})

describe("mapErr", () => {
  it("maps the error channel", () => {
    const r = mapErr(err("low"), (e) => `wrapped:${e}`)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe("wrapped:low")
  })

  it("passes successes through unchanged", () => {
    const r = mapErr(ok(7), (e: string) => `wrapped:${e}`)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(7)
  })
})

describe("fromPromise", () => {
  it("captures resolved values as ok", async () => {
    const r = await fromPromise(Promise.resolve("hello"))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe("hello")
  })

  it("captures rejected Errors as err", async () => {
    const r = await fromPromise(Promise.reject(new Error("boom")))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.message).toBe("boom")
  })

  it("normalises non-Error rejections to Error", async () => {
    const r = await fromPromise(Promise.reject("plain string"))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(Error)
      expect(r.error.message).toBe("plain string")
    }
  })
})

describe("fromTry", () => {
  it("captures pure return values", () => {
    const r = fromTry(() => 9)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(9)
  })

  it("captures thrown Errors as err", () => {
    const r = fromTry(() => {
      throw new Error("bad")
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.message).toBe("bad")
  })

  it("normalises non-Error throws", () => {
    const r = fromTry(() => {
      throw 42 as unknown as Error
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.message).toBe("42")
  })
})

describe("isResult", () => {
  it("recognises ok shapes", () => {
    expect(isResult(ok(1))).toBe(true)
  })
  it("recognises err shapes", () => {
    expect(isResult(err("x"))).toBe(true)
  })
  it("rejects null", () => {
    expect(isResult(null)).toBe(false)
  })
  it("rejects plain values", () => {
    expect(isResult(42)).toBe(false)
    expect(isResult("hello")).toBe(false)
    expect(isResult(undefined)).toBe(false)
  })
  it("rejects objects without ok", () => {
    expect(isResult({ value: 1 })).toBe(false)
  })
  it("rejects objects with non-boolean ok", () => {
    expect(isResult({ ok: "yes" })).toBe(false)
  })
})
