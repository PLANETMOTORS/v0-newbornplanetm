import { describe, it, expect } from "vitest"
import {
  inviteAdminSchema,
  updateAdminSchema,
  adminUserIdParamSchema,
  ADMIN_ROLES,
} from "@/lib/admin/users/schemas"

describe("inviteAdminSchema", () => {
  it("accepts a valid invite with role default", () => {
    const r = inviteAdminSchema.parse({ email: "Foo@Bar.COM" })
    expect(r.email).toBe("foo@bar.com")
    expect(r.role).toBe("admin")
    expect(r.notes).toBeUndefined()
  })

  it("trims and lowercases the email", () => {
    const r = inviteAdminSchema.parse({ email: "  Foo@Bar.com  " })
    expect(r.email).toBe("foo@bar.com")
  })

  it("accepts every role", () => {
    for (const role of ADMIN_ROLES) {
      const r = inviteAdminSchema.parse({ email: "a@b.com", role })
      expect(r.role).toBe(role)
    }
  })

  it("rejects an unknown role", () => {
    const r = inviteAdminSchema.safeParse({ email: "a@b.com", role: "owner" })
    expect(r.success).toBe(false)
  })

  it("rejects an invalid email", () => {
    const r = inviteAdminSchema.safeParse({ email: "not-an-email" })
    expect(r.success).toBe(false)
  })

  it("rejects an email longer than 254 characters", () => {
    const long = "a".repeat(260) + "@x.com"
    const r = inviteAdminSchema.safeParse({ email: long })
    expect(r.success).toBe(false)
  })

  it("rejects extra unknown keys", () => {
    const r = inviteAdminSchema.safeParse({
      email: "a@b.com",
      isSuperAdmin: true,
    })
    expect(r.success).toBe(false)
  })

  it("accepts an optional notes field", () => {
    const r = inviteAdminSchema.parse({ email: "a@b.com", notes: "VP of Sales" })
    expect(r.notes).toBe("VP of Sales")
  })

  it("rejects notes longer than the cap", () => {
    const long = "x".repeat(2_001)
    const r = inviteAdminSchema.safeParse({ email: "a@b.com", notes: long })
    expect(r.success).toBe(false)
  })
})

describe("updateAdminSchema", () => {
  it("accepts a role-only patch", () => {
    const r = updateAdminSchema.parse({ role: "manager" })
    expect(r.role).toBe("manager")
  })

  it("accepts an is_active-only patch", () => {
    const r = updateAdminSchema.parse({ is_active: false })
    expect(r.is_active).toBe(false)
  })

  it("accepts a notes-only patch", () => {
    const r = updateAdminSchema.parse({ notes: "Changed role today" })
    expect(r.notes).toBe("Changed role today")
  })

  it("accepts a notes:null patch (clears the field)", () => {
    const r = updateAdminSchema.parse({ notes: null })
    expect(r.notes).toBe(null)
  })

  it("rejects an empty patch", () => {
    const r = updateAdminSchema.safeParse({})
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/no editable fields/)
    }
  })

  it("rejects an unknown role", () => {
    const r = updateAdminSchema.safeParse({ role: "ceo" })
    expect(r.success).toBe(false)
  })

  it("rejects unknown keys", () => {
    const r = updateAdminSchema.safeParse({ role: "admin", isSuperAdmin: true })
    expect(r.success).toBe(false)
  })
})

describe("adminUserIdParamSchema", () => {
  it("accepts a valid uuid", () => {
    const r = adminUserIdParamSchema.parse({
      id: "00000000-0000-0000-0000-000000000001",
    })
    expect(r.id).toBe("00000000-0000-0000-0000-000000000001")
  })

  it("rejects a non-uuid id", () => {
    const r = adminUserIdParamSchema.safeParse({ id: "not-a-uuid" })
    expect(r.success).toBe(false)
  })

  it("rejects extra keys", () => {
    const r = adminUserIdParamSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
      extra: 1,
    })
    expect(r.success).toBe(false)
  })
})
