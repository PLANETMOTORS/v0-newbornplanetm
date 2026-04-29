/**
 * __tests__/lib/supabase-read-replica.test.ts
 *
 * Coverage for lib/supabase/read-replica.ts. We mock @supabase/supabase-js
 * and the primary static client so we can assert which factory the read
 * client falls through to.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const createSupabaseClientMock = vi.hoisted(() => vi.fn())
const createStaticClientMock = vi.hoisted(() => vi.fn())

vi.mock("@supabase/supabase-js", () => ({
  createClient: createSupabaseClientMock,
}))

vi.mock("@/lib/supabase/static", () => ({
  createStaticClient: createStaticClientMock,
}))

const REPLICA_URL_ENV = "SUPABASE_READ_REPLICA_URL"
const REPLICA_KEY_ENV = "SUPABASE_READ_REPLICA_ANON_KEY"

describe("lib/supabase/read-replica", () => {
  beforeEach(() => {
    vi.resetModules()
    createSupabaseClientMock.mockReset()
    createStaticClientMock.mockReset()
    delete process.env[REPLICA_URL_ENV]
    delete process.env[REPLICA_KEY_ENV]
  })

  afterEach(() => {
    delete process.env[REPLICA_URL_ENV]
    delete process.env[REPLICA_KEY_ENV]
  })

  describe("getReadReplicaUrl / getReadReplicaAnonKey", () => {
    it("returns undefined when env vars are unset", async () => {
      const mod = await import("@/lib/supabase/read-replica")
      expect(mod.getReadReplicaUrl()).toBeUndefined()
      expect(mod.getReadReplicaAnonKey()).toBeUndefined()
    })

    it("returns the configured values when set", async () => {
      process.env[REPLICA_URL_ENV] = "https://replica.example.supabase.co"
      process.env[REPLICA_KEY_ENV] = "anon-key-xyz"
      const mod = await import("@/lib/supabase/read-replica")
      expect(mod.getReadReplicaUrl()).toBe("https://replica.example.supabase.co")
      expect(mod.getReadReplicaAnonKey()).toBe("anon-key-xyz")
    })
  })

  describe("isReadReplicaConfigured", () => {
    it("is false when neither env var is set", async () => {
      const mod = await import("@/lib/supabase/read-replica")
      expect(mod.isReadReplicaConfigured()).toBe(false)
    })

    it("is false when only the URL is set", async () => {
      process.env[REPLICA_URL_ENV] = "https://replica.example.supabase.co"
      const mod = await import("@/lib/supabase/read-replica")
      expect(mod.isReadReplicaConfigured()).toBe(false)
    })

    it("is false when only the key is set", async () => {
      process.env[REPLICA_KEY_ENV] = "anon-key-xyz"
      const mod = await import("@/lib/supabase/read-replica")
      expect(mod.isReadReplicaConfigured()).toBe(false)
    })

    it("is true when both env vars are set", async () => {
      process.env[REPLICA_URL_ENV] = "https://replica.example.supabase.co"
      process.env[REPLICA_KEY_ENV] = "anon-key-xyz"
      const mod = await import("@/lib/supabase/read-replica")
      expect(mod.isReadReplicaConfigured()).toBe(true)
    })
  })

  describe("createReadClient", () => {
    it("falls back to the static client when replica is not configured", async () => {
      const fakeStaticClient = { __id: "static-client" }
      createStaticClientMock.mockReturnValue(fakeStaticClient)
      const mod = await import("@/lib/supabase/read-replica")
      const client = mod.createReadClient()
      expect(client).toBe(fakeStaticClient)
      expect(createStaticClientMock).toHaveBeenCalledOnce()
      expect(createSupabaseClientMock).not.toHaveBeenCalled()
    })

    it("falls back to the static client when only the URL is configured", async () => {
      process.env[REPLICA_URL_ENV] = "https://replica.example.supabase.co"
      const fakeStaticClient = { __id: "static-client" }
      createStaticClientMock.mockReturnValue(fakeStaticClient)
      const mod = await import("@/lib/supabase/read-replica")
      mod.createReadClient()
      expect(createStaticClientMock).toHaveBeenCalledOnce()
      expect(createSupabaseClientMock).not.toHaveBeenCalled()
    })

    it("builds a replica client when both env vars are set", async () => {
      process.env[REPLICA_URL_ENV] = "https://replica.example.supabase.co"
      process.env[REPLICA_KEY_ENV] = "anon-key-xyz"
      const fakeReplicaClient = { __id: "replica-client" }
      createSupabaseClientMock.mockReturnValue(fakeReplicaClient)

      const mod = await import("@/lib/supabase/read-replica")
      mod.__resetReadReplicaClientForTests()
      const client = mod.createReadClient()

      expect(client).toBe(fakeReplicaClient)
      expect(createSupabaseClientMock).toHaveBeenCalledOnce()
      expect(createSupabaseClientMock).toHaveBeenCalledWith(
        "https://replica.example.supabase.co",
        "anon-key-xyz",
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          }),
        }),
      )
      expect(createStaticClientMock).not.toHaveBeenCalled()
    })

    it("memoises the replica client across multiple calls", async () => {
      process.env[REPLICA_URL_ENV] = "https://replica.example.supabase.co"
      process.env[REPLICA_KEY_ENV] = "anon-key-xyz"
      const fakeReplicaClient = { __id: "replica-client" }
      createSupabaseClientMock.mockReturnValue(fakeReplicaClient)

      const mod = await import("@/lib/supabase/read-replica")
      mod.__resetReadReplicaClientForTests()

      const first = mod.createReadClient()
      const second = mod.createReadClient()

      expect(first).toBe(second)
      expect(createSupabaseClientMock).toHaveBeenCalledOnce()
    })

    it("rebuilds the client after __resetReadReplicaClientForTests()", async () => {
      process.env[REPLICA_URL_ENV] = "https://replica.example.supabase.co"
      process.env[REPLICA_KEY_ENV] = "anon-key-xyz"
      createSupabaseClientMock
        .mockReturnValueOnce({ __id: "replica-client-a" })
        .mockReturnValueOnce({ __id: "replica-client-b" })

      const mod = await import("@/lib/supabase/read-replica")
      mod.__resetReadReplicaClientForTests()
      const a = mod.createReadClient()
      mod.__resetReadReplicaClientForTests()
      const b = mod.createReadClient()

      expect(a).not.toBe(b)
      expect(createSupabaseClientMock).toHaveBeenCalledTimes(2)
    })
  })
})
