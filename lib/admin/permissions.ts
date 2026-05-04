/**
 * Granular feature-level permission system for the admin portal.
 *
 * Each admin user has a `permissions` JSONB column that maps feature keys
 * to access levels: "none", "read", or "full".
 *
 * Preset roles (admin/manager/viewer) serve as quick-start templates,
 * but the owner can customise any user's access after assigning a role.
 */

/** Every feature gated by admin permissions. */
export const ADMIN_FEATURES = [
  "dashboard",
  "vehicles",
  "customers",
  "leads",
  "reservations",
  "orders",
  "finance_apps",
  "trade_ins",
  "ai_agents",
  "ai_config",
  "ai_knowledge",
  "workflows",
  "photos_360",
  "backgrounds",
  "analytics",
  "admin_users",
  "settings",
] as const

export type AdminFeature = (typeof ADMIN_FEATURES)[number]

/** Access level for a single feature. */
export type AccessLevel = "none" | "read" | "full"

/** Map of feature → access level stored in `admin_users.permissions`. */
export type PermissionMap = Record<AdminFeature, AccessLevel>

/** Human-readable labels for each feature. */
export const FEATURE_LABELS: Record<AdminFeature, string> = {
  dashboard: "Dashboard",
  vehicles: "Vehicles",
  customers: "Customers",
  leads: "Leads",
  reservations: "Reservations",
  orders: "Orders",
  finance_apps: "Finance Apps",
  trade_ins: "Trade-Ins",
  ai_agents: "AI Agents",
  ai_config: "AI Config",
  ai_knowledge: "AI Knowledge",
  workflows: "Workflows",
  photos_360: "360° Photos",
  backgrounds: "Backgrounds",
  analytics: "Analytics",
  admin_users: "Admin Users",
  settings: "Settings",
}

/** Map sidebar route paths to feature keys. */
export const ROUTE_TO_FEATURE: Record<string, AdminFeature> = {
  "/admin": "dashboard",
  "/admin/inventory": "vehicles",
  "/admin/customers": "customers",
  "/admin/leads": "leads",
  "/admin/reservations": "reservations",
  "/admin/orders": "orders",
  "/admin/finance": "finance_apps",
  "/admin/trade-ins": "trade_ins",
  "/admin/ai-agents": "ai_agents",
  "/admin/ai-config": "ai_config",
  "/admin/ai-knowledge": "ai_knowledge",
  "/admin/workflows": "workflows",
  "/admin/360-upload": "photos_360",
  "/admin/backgrounds": "backgrounds",
  "/admin/analytics": "analytics",
  "/admin/users": "admin_users",
  "/admin/settings": "settings",
}

// ── Preset templates ─────────────────────────────────────────────────

function fill(level: AccessLevel): PermissionMap {
  return Object.fromEntries(
    ADMIN_FEATURES.map((f) => [f, level]),
  ) as PermissionMap
}

/** Admin: full access to everything. */
export const PRESET_ADMIN: PermissionMap = fill("full")

/** Manager: full access to inventory + leads + finance, read elsewhere, no admin users or settings. */
export const PRESET_MANAGER: PermissionMap = {
  ...fill("read"),
  vehicles: "full",
  customers: "full",
  leads: "full",
  reservations: "full",
  orders: "full",
  finance_apps: "full",
  admin_users: "none",
  settings: "none",
}

/** Viewer: read-only across all features, no admin users or settings. */
export const PRESET_VIEWER: PermissionMap = {
  ...fill("read"),
  admin_users: "none",
  settings: "none",
}

export const ROLE_PRESETS: Record<string, PermissionMap> = {
  admin: PRESET_ADMIN,
  manager: PRESET_MANAGER,
  viewer: PRESET_VIEWER,
}

/**
 * Resolve the effective permissions for an admin user.
 * If they have custom permissions stored, use those.
 * Otherwise fall back to the preset for their role.
 */
export function resolvePermissions(
  role: string,
  customPermissions?: Partial<PermissionMap> | null,
): PermissionMap {
  const base = ROLE_PRESETS[role] ?? PRESET_VIEWER
  if (!customPermissions) return base
  return { ...base, ...customPermissions } as PermissionMap
}

/** Check if a user has at least the given access level for a feature. */
export function hasAccess(
  permissions: PermissionMap,
  feature: AdminFeature,
  requiredLevel: AccessLevel = "read",
): boolean {
  const level = permissions[feature] ?? "none"
  if (requiredLevel === "none") return true
  if (requiredLevel === "read") return level === "read" || level === "full"
  return level === "full"
}

/** Get the feature key for a given admin route path. */
export function featureForRoute(pathname: string): AdminFeature | null {
  // Exact match first
  if (pathname in ROUTE_TO_FEATURE) return ROUTE_TO_FEATURE[pathname]
  // Prefix match (e.g. /admin/leads/123 → leads)
  for (const [route, feature] of Object.entries(ROUTE_TO_FEATURE)) {
    if (route !== "/admin" && pathname.startsWith(route + "/")) return feature
  }
  return null
}
