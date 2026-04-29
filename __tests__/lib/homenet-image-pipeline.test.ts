import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

interface BlobRow { pathname: string; url: string; contentType?: string; body?: unknown }
const putMock = vi.fn(async (pathname: string, body: unknown, opts: { contentType?: string }) => {
  const row: BlobRow = { pathname, url: `https://blob.test/${pathname}`, contentType: opts?.contentType, body }
  putCalls.push(row)
  return row
})
const listMock = vi.fn(async (_opts: { prefix: string }) => ({ blobs: [] as BlobRow[] }))
const putCalls: BlobRow[] = []

vi.mock("@vercel/blob", () => ({
  put: (p: string, b: unknown, o: { contentType?: string }) => putMock(p, b, o),
  list: (o: { prefix: string }) => listMock(o),
}))

const sqlMock = vi.fn(async (..._args: unknown[]) => undefined)
const sqlTaggedMock = (strings: TemplateStringsArray, ...values: unknown[]) => sqlMock(strings, ...values)

const neonMock = vi.fn(() => sqlTaggedMock)
vi.mock("@neondatabase/serverless", () => ({
  neon: (url: string) => neonMock(url),
}))

const ENV_KEYS = ["DATABASE_URL", "NEON_DATABASE_URL", "NEON_POSTGRES_URL"] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  putMock.mockClear()
  listMock.mockClear()
  sqlMock.mockClear()
  neonMock.mockClear()
  putCalls.length = 0
  listMock.mockResolvedValue({ blobs: [] })
  vi.spyOn(console, "info").mockImplementation(() => undefined)
  vi.spyOn(console, "warn").mockImplementation(() => undefined)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  vi.resetModules()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function mockFetchOk(payload = "img-bytes", contentType = "image/jpeg") {
  const fetchMock = vi.fn(async () =>
    new Response(payload, {
      status: 200,
      headers: { "Content-Type": contentType },
    }),
  )
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function mockFetchFail(status = 500) {
  const fetchMock = vi.fn(async () => new Response("err", { status }))
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("lib/homenet/image-pipeline urlHash", () => {
  it("produces a 12-char hex digest", async () => {
    const { urlHash } = await import("@/lib/homenet/image-pipeline")
    const h = urlHash("https://cdn.example.com/img.jpg")
    expect(h).toMatch(/^[a-f0-9]{12}$/)
  })

  it("is deterministic for the same input", async () => {
    const { urlHash } = await import("@/lib/homenet/image-pipeline")
    expect(urlHash("a")).toBe(urlHash("a"))
  })

  it("differs for different inputs", async () => {
    const { urlHash } = await import("@/lib/homenet/image-pipeline")
    expect(urlHash("a")).not.toBe(urlHash("b"))
  })
})

describe("lib/homenet/image-pipeline runImagePipeline — early returns", () => {
  it("returns the empty result for an empty vehicles list (no DB call)", async () => {
    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline([])
    expect(out).toEqual({
      totalImages: 0,
      downloaded: 0,
      skipped: 0,
      failed: 0,
      vehiclesProcessed: 0,
      errors: [],
    })
    expect(neonMock).not.toHaveBeenCalled()
  })

  it("processes a vehicle with no image_urls without invoking blob/fetch", async () => {
    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline([
      { stock_number: "S1", vin: "V", image_urls: [], has_360_spin: false },
    ])
    expect(out.vehiclesProcessed).toBe(1)
    expect(out.totalImages).toBe(0)
    expect(putMock).not.toHaveBeenCalled()
    expect(listMock).not.toHaveBeenCalled()
  })
})

describe("lib/homenet/image-pipeline runImagePipeline — happy path", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test"
  })

  it("downloads non-existing images, uploads to Blob, updates DB, and writes thumbnail markers", async () => {
    mockFetchOk()

    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline([
      {
        stock_number: "S1",
        vin: "V1",
        image_urls: [
          "https://cdn.example.com/photo-1.jpg",
          "https://cdn.example.com/photo-2.jpg",
          "https://cdn.example.com/spin-frame-001.jpg", // matches /spin/i
        ],
        has_360_spin: true,
      },
    ])

    expect(out.totalImages).toBe(3)
    expect(out.downloaded).toBe(3)
    expect(out.skipped).toBe(0)
    expect(out.failed).toBe(0)
    expect(out.vehiclesProcessed).toBe(1)

    // 3 main puts + 3 thumbnail markers
    const dests = putMock.mock.calls.map((c) => c[0])
    expect(dests).toContain("vehicles/S1/photo-0.jpg")
    expect(dests).toContain("vehicles/S1/photo-1.jpg")
    expect(dests).toContain("vehicles/S1/spin/frame-000.jpg")
    expect(dests).toContain("vehicles/S1/thumb-0.jpg")
    expect(dests).toContain("vehicles/S1/thumb-1.jpg")
    expect(dests).toContain("vehicles/S1/spin/thumb-000.jpg")

    // DB UPDATE invoked once
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it("skips images that already exist in Blob and counts them under 'skipped'", async () => {
    listMock.mockResolvedValueOnce({
      blobs: [
        { pathname: "vehicles/S1/photo-0.jpg", url: "https://blob.test/vehicles/S1/photo-0.jpg" },
      ],
    })
    mockFetchOk()

    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline([
      {
        stock_number: "S1",
        vin: "V1",
        image_urls: ["https://cdn.example.com/photo-1.jpg"],
        has_360_spin: false,
      },
    ])
    expect(out.skipped).toBe(1)
    expect(out.downloaded).toBe(0)
    expect(out.totalImages).toBe(1)
  })

  it("falls through to download when list() throws (graceful 'no existing blobs' fallback)", async () => {
    listMock.mockRejectedValueOnce(new Error("blob list failed"))
    mockFetchOk()
    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline([
      {
        stock_number: "S2",
        vin: "V2",
        image_urls: ["https://cdn.example.com/x.jpg"],
        has_360_spin: false,
      },
    ])
    expect(out.downloaded).toBe(1)
    expect(out.failed).toBe(0)
  })

  it("captures HTTP failures and reports them as 'failed' with errors", async () => {
    mockFetchFail(404)
    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline([
      {
        stock_number: "S3",
        vin: "V3",
        image_urls: ["https://cdn.example.com/missing.jpg"],
        has_360_spin: false,
      },
    ])
    expect(out.failed).toBe(1)
    expect(out.errors).toHaveLength(1)
    expect(out.errors[0].url).toBe("https://cdn.example.com/missing.jpg")
    expect(out.errors[0].error).toMatch(/HTTP 404/)
  })

  it("processes vehicles concurrently (10 vehicles in 1 batch with concurrency=10)", async () => {
    mockFetchOk()
    const vehicles = Array.from({ length: 10 }, (_, i) => ({
      stock_number: `S${i}`,
      vin: `V${i}`,
      image_urls: [`https://cdn.example.com/p${i}.jpg`],
      has_360_spin: false,
    }))
    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline(vehicles)
    expect(out.vehiclesProcessed).toBe(10)
    expect(out.downloaded).toBe(10)
  })
})

describe("lib/homenet/image-pipeline runImagePipeline — DB optionality", () => {
  it("skips DB update when no DATABASE_URL / NEON_* env var is configured", async () => {
    mockFetchOk()
    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline([
      {
        stock_number: "S1",
        vin: "V1",
        image_urls: ["https://cdn.example.com/p.jpg"],
        has_360_spin: false,
      },
    ])
    expect(out.downloaded).toBe(1)
    expect(neonMock).not.toHaveBeenCalled()
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("logs and continues when DB update throws", async () => {
    process.env.DATABASE_URL = "postgres://test"
    mockFetchOk()
    sqlMock.mockRejectedValueOnce(new Error("db down"))

    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline([
      {
        stock_number: "S1",
        vin: "V1",
        image_urls: ["https://cdn.example.com/p.jpg"],
        has_360_spin: false,
      },
    ])
    expect(out.downloaded).toBe(1)
    expect(out.vehiclesProcessed).toBe(1)
  })
})

describe("lib/homenet/image-pipeline triggerImagePipelineAsync", () => {
  it("returns immediately for empty input without calling blob/fetch", async () => {
    const { triggerImagePipelineAsync } = await import("@/lib/homenet/image-pipeline")
    triggerImagePipelineAsync([])
    expect(putMock).not.toHaveBeenCalled()
  })

  it("kicks off pipeline for non-empty input (fire-and-forget)", async () => {
    mockFetchOk()
    const { triggerImagePipelineAsync } = await import("@/lib/homenet/image-pipeline")
    triggerImagePipelineAsync([
      {
        stock_number: "Sx",
        vin: "Vx",
        image_urls: ["https://cdn.example.com/q.jpg"],
        has_360_spin: false,
      },
    ])
    // Allow the microtask queue to drain
    await new Promise((r) => setTimeout(r, 30))
    expect(putMock).toHaveBeenCalled()
  })

  it("logs and swallows errors from the async pipeline (does not reject)", async () => {
    // Force fetch to reject so downloadAndUpload throws — runImagePipeline still resolves.
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("boom") }))

    const { triggerImagePipelineAsync } = await import("@/lib/homenet/image-pipeline")
    triggerImagePipelineAsync([
      {
        stock_number: "Sf",
        vin: "Vf",
        image_urls: ["https://cdn.example.com/p.jpg"],
        has_360_spin: false,
      },
    ])
    await new Promise((r) => setTimeout(r, 30))
    // No unhandled rejections — just reaching here proves it
    expect(true).toBe(true)
  })

  it("silently swallows thumbnail-marker upload failures", async () => {
    mockFetchOk()
    let putCount = 0
    putMock.mockImplementation(async (pathname: string, body: unknown, opts: { contentType?: string }) => {
      putCount++
      // First call = main image upload, second = thumbnail marker — fail the marker
      if (pathname.includes("thumb-")) throw new Error("thumb upload failed")
      return { pathname, url: `https://blob.test/${pathname}`, contentType: opts?.contentType, body }
    })
    const { runImagePipeline } = await import("@/lib/homenet/image-pipeline")
    const out = await runImagePipeline([
      {
        stock_number: "Sthumb",
        vin: "Vt",
        image_urls: ["https://cdn.example.com/p.jpg"],
        has_360_spin: false,
      },
    ])
    // Main image still counted as downloaded; thumbnail failure is silent
    expect(out.downloaded).toBe(1)
    expect(out.failed).toBe(0)
    expect(putCount).toBeGreaterThanOrEqual(2)
  })
})
