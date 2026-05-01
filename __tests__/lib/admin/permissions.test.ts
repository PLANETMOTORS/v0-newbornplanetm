import { describe, it, expect } from "vitest"
import {
  ADMIN_FEATURES,
  FEATURE_LABELS,
  ROUTE_TO_FEATURE,
  PRESET_ADMIN,
  PRESET_MANAGER,
  PRESET_VIEWER,
  ROLE_PRESETS,
  resolvePermissions,
  hasAccess,
  featureForRoute,
} from "@/lib/admin/permissions"

describe("ADMIN_FEATURES", () => {
  it("contains 13 features", () => {
    expect(ADMIN_FEATURES).toHaveLength(13)
  })

  it("every feature has a label", () => {
    for (const f of ADMIN_FEATURES) {
      expect(FEATURE_LABELS[f]).toBeTruthy()
    }
  })
})

describe("preset permissions", () => {
  it("admin preset gives full access everywhere", () => {
    for (const f of ADMIN_FEATURES) {
      expect(PRESET_ADMIN[f]).toBe("full")
    }
  })

  it("manager preset gives full to inventory/leads/finance, read to others, none to admin_users/settings", () => {
    expect(PRESET_MANAGER.vehicles).toBe("full")
    expect(PRESET_MANAGER.leads).toBe("full")
    expect(PRESET_MANAGER.finance_apps).toBe("full")
    expect(PRESET_MANAGER.admin_users).toBe("none")
    expect(PRESET_MANAGER.settings).toBe("none")
    expect(PRESET_MANAGER.analytics).toBe("read")
  })

  it("viewer preset gives read to most, none to admin_users/settings", () => {
    expect(PRESET_VIEWER.dashboard).toBe("read")
    expect(PRESET_VIEWER.admin_users).toBe("none")
    expect(PRESET_VIEWER.settings).toBe("none")
  })
})

describe("resolvePermissions", () => {
  it("returns preset when no custom permissions", () => {
    expect(resolvePermissions("admin")).toEqual(PRESET_ADMIN)
    expect(resolvePermissions("manager")).toEqual(PRESET_MANAGER)
    expect(resolvePermissions("viewer")).toEqual(PRESET_VIEWER)
  })

  it("returns preset when custom permissions is null", () => {
    expect(resolvePermissions("admin", null)).toEqual(PRESET_ADMIN)
  })

  it("merges custom permissions over preset", () => {
    const custom = { analytics: "full" as const, settings: "full" as const }
    const result = resolvePermissions("viewer", custom)
    expect(result.analytics).toBe("full")
    expect(result.settings).toBe("full")
    expect(result.dashboard).toBe("read")
  })

  it("falls back to viewer for unknown role", () => {
    const result = resolvePermissions("unknown_role")
    expect(result).toEqual(PRESET_VIEWER)
  })
})

describe("hasAccess", () => {
  it("grants read when level is full", () => {
    expect(hasAccess(PRESET_ADMIN, "dashboard", "read")).toBe(true)
  })

  it("grants full when level is full", () => {
    expect(hasAccess(PRESET_ADMIN, "dashboard", "full")).toBe(true)
  })

  it("denies full when level is read", () => {
    expect(hasAccess(PRESET_VIEWER, "dashboard", "full")).toBe(false)
  })

  it("denies read when level is none", () => {
    expect(hasAccess(PRESET_VIEWER, "admin_users", "read")).toBe(false)
  })

  it("always grants access for requiredLevel=none", () => {
    expect(hasAccess(PRESET_VIEWER, "admin_users", "none")).toBe(true)
  })
})

describe("featureForRoute", () => {
  it("maps exact admin routes", () => {
    expect(featureForRoute("/admin")).toBe("dashboard")
    expect(featureForRoute("/admin/inventory")).toBe("vehicles")
    expect(featureForRoute("/admin/users")).toBe("admin_users")
  })

  it("maps prefixed routes", () => {
    expect(featureForRoute("/admin/leads/123")).toBe("leads")
    expect(featureForRoute("/admin/finance/detail")).toBe("finance_apps")
  })

  it("returns null for unknown routes", () => {
    expect(featureForRoute("/some/other/path")).toBeNull()
  })
})

describe("ROUTE_TO_FEATURE", () => {
  it("maps all 13 sidebar routes", () => {
    expect(Object.keys(ROUTE_TO_FEATURE)).toHaveLength(13)
  })
})

describe("ROLE_PRESETS", () => {
  it("contains admin, manager, viewer", () => {
    expect(ROLE_PRESETS).toHaveProperty("admin")
    expect(ROLE_PRESETS).toHaveProperty("manager")
    expect(ROLE_PRESETS).toHaveProperty("viewer")
  })
})
