import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock createClient and ADMIN_EMAILS before importing
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/admin", () => ({
  ADMIN_EMAILS: ["admin@example.com"],
}))

import { getAuthenticatedUser, getProfileField, getAuthenticatedAdmin } from "@/lib/api/auth-helpers"
import { createClient } from "@/lib/supabase/server"

const mockCreateClient = vi.mocked(createClient)

function makeMockSupabase(authReturn: { data: { user: unknown }; error: unknown }) {
  const supabase = {
    auth: { getUser: vi.fn().mockResolvedValue(authReturn) },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  }
  return supabase
}

describe("getAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns user and supabase when authenticated", async () => {
    const user = { id: "u1", email: "test@test.com" }
    const supabase = makeMockSupabase({ data: { user }, error: null })
    mockCreateClient.mockResolvedValue(supabase as never)

    const result = await getAuthenticatedUser()
    expect(result.error).toBeNull()
    expect(result.user).toEqual(user)
  })

  it("returns error when not authenticated", async () => {
    const supabase = makeMockSupabase({ data: { user: null }, error: null })
    mockCreateClient.mockResolvedValue(supabase as never)

    const result = await getAuthenticatedUser()
    expect(result.error).not.toBeNull()
    expect(result.user).toBeNull()
  })

  it("returns error when auth throws", async () => {
    const supabase = makeMockSupabase({ data: { user: null }, error: new Error("auth failed") })
    mockCreateClient.mockResolvedValue(supabase as never)

    const result = await getAuthenticatedUser()
    expect(result.error).not.toBeNull()
  })
})

describe("getProfileField", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns profile data on success", async () => {
    const profile = { search_alerts: [{ id: "s1" }] }
    const supabase = makeMockSupabase({ data: { user: null }, error: null })
    supabase.maybeSingle.mockResolvedValue({ data: profile, error: null })
    mockCreateClient.mockResolvedValue(supabase as never)

    const result = await getProfileField<typeof profile>(
      supabase as never, "u1", "search_alerts", "Failed",
    )
    expect(result.error).toBeNull()
    expect(result.profile).toEqual(profile)
  })

  it("returns error when profile fetch fails", async () => {
    const supabase = makeMockSupabase({ data: { user: null }, error: null })
    supabase.maybeSingle.mockResolvedValue({ data: null, error: new Error("db error") })
    mockCreateClient.mockResolvedValue(supabase as never)

    const result = await getProfileField(
      supabase as never, "u1", "search_alerts", "Custom error msg",
    )
    expect(result.error).not.toBeNull()
    expect(result.profile).toBeNull()
  })
})

describe("getAuthenticatedAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns admin user when email is in ADMIN_EMAILS", async () => {
    const user = { id: "a1", email: "admin@example.com" }
    const supabase = makeMockSupabase({ data: { user }, error: null })
    mockCreateClient.mockResolvedValue(supabase as never)

    const result = await getAuthenticatedAdmin()
    expect(result.error).toBeNull()
    expect(result.user).toEqual(user)
  })

  it("returns error when user is not admin", async () => {
    const user = { id: "u2", email: "notadmin@example.com" }
    const supabase = makeMockSupabase({ data: { user }, error: null })
    mockCreateClient.mockResolvedValue(supabase as never)

    const result = await getAuthenticatedAdmin()
    expect(result.error).not.toBeNull()
  })

  it("returns error when no user", async () => {
    const supabase = makeMockSupabase({ data: { user: null }, error: null })
    mockCreateClient.mockResolvedValue(supabase as never)

    const result = await getAuthenticatedAdmin()
    expect(result.error).not.toBeNull()
  })

  it("returns error when user has no email", async () => {
    const user = { id: "u3", email: null }
    const supabase = makeMockSupabase({ data: { user }, error: null })
    mockCreateClient.mockResolvedValue(supabase as never)

    const result = await getAuthenticatedAdmin()
    expect(result.error).not.toBeNull()
  })
})
