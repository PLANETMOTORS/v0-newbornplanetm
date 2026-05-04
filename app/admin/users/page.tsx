"use client"

/**
 * /admin/users — runtime admin roster management with granular permissions.
 *
 * Lists every row from `admin_users`, lets a logged-in admin invite a
 * new admin, change role / active flag, customise feature-level permissions,
 * and revoke access.
 *
 * Self-protection: the API blocks self-deactivation / self-deletion;
 * the UI also disables those buttons for the caller's own row.
 */

import { useCallback, useEffect, useState } from "react"
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import {
  ADMIN_FEATURES,
  FEATURE_LABELS,
  ROLE_PRESETS,
  resolvePermissions,
  type AdminFeature,
  type AccessLevel,
  type PermissionMap,
} from "@/lib/admin/permissions"

type AdminRole = "admin" | "manager" | "viewer"

interface AdminUserRow {
  id: string
  email: string
  role: AdminRole
  is_active: boolean
  notes: string | null
  permissions: Partial<PermissionMap> | null
  created_at: string
  updated_at: string
}

const ROLE_OPTIONS: readonly AdminRole[] = ["admin", "manager", "viewer"]
const ACCESS_LEVELS: readonly AccessLevel[] = ["none", "read", "full"]

async function throwIfNotOk(res: Response, label: string): Promise<void> {
  if (res.ok) return
  const j = (await res.json().catch(() => ({}))) as {
    error?: { message?: string } | string
  }
  const msg =
    typeof j.error === "string"
      ? j.error
      : j.error?.message ?? `${label} (${res.status})`
  throw new Error(msg)
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function roleBadgeVariant(
  role: AdminRole,
): "default" | "secondary" | "outline" {
  switch (role) {
    case "admin":
      return "default"
    case "manager":
      return "secondary"
    case "viewer":
      return "outline"
  }
}

function accessLevelColor(level: AccessLevel): string {
  switch (level) {
    case "full":
      return "bg-green-100 text-green-800 border-green-200"
    case "read":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "none":
      return "bg-gray-100 text-gray-500 border-gray-200"
  }
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [admins, setAdmins] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<AdminRole>("viewer")
  const [inviteNotes, setInviteNotes] = useState("")
  const [inviting, setInviting] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resending, setResending] = useState<string | null>(null)

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/admin/users")
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = (await res.json()) as { admins: AdminUserRow[] }
      setAdmins(data.admins ?? [])
      setError(null)
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : "Failed to load admins",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const submitInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const perms = ROLE_PRESETS[inviteRole] ?? null
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          notes: inviteNotes.trim() || undefined,
          permissions: perms,
        }),
      })
      await throwIfNotOk(res, "Invite failed")
      setInviteEmail("")
      setInviteNotes("")
      setInviteRole("viewer")
      await fetchAdmins()
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Invite failed")
    } finally {
      setInviting(false)
    }
  }

  const runMutation = useCallback(
    async (id: string, label: string, request: () => Promise<Response>) => {
      setPendingId(id)
      try {
        const res = await request()
        await throwIfNotOk(res, label)
        await fetchAdmins()
        setError(null)
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : label)
      } finally {
        setPendingId(null)
      }
    },
    [fetchAdmins],
  )

  const patchAdmin = async (
    id: string,
    patch: { role?: AdminRole; is_active?: boolean; permissions?: Partial<PermissionMap> | null },
  ) => {
    await runMutation(id, "Update failed", () =>
      fetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    )
  }

  const changeRole = async (id: string, newRole: AdminRole) => {
    const presetPerms = ROLE_PRESETS[newRole]
    await patchAdmin(id, { role: newRole, permissions: presetPerms })
  }

  const changePermission = async (
    row: AdminUserRow,
    feature: AdminFeature,
    level: AccessLevel,
  ) => {
    const current = resolvePermissions(row.role, row.permissions)
    const updated = { ...current, [feature]: level }
    await patchAdmin(row.id, { permissions: updated })
  }

  const resendInvitation = async (id: string, email: string) => {
    setResending(id)
    try {
      const res = await fetch(`/api/v1/admin/users/${id}/resend`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? "Failed to resend invitation")
        return
      }
      setError(null)
      alert(`Invitation re-sent to ${email}`)
    } catch {
      setError("Network error resending invitation")
    } finally {
      setResending(null)
    }
  }

  const removeAdmin = async (id: string, email: string) => {
    if (
      !globalThis.confirm(
        `Remove ${email} from the admin roster? This cannot be undone.`,
      )
    )
      return
    await runMutation(id, "Delete failed", () =>
      fetch(`/api/v1/admin/users/${id}`, { method: "DELETE" }),
    )
  }

  const isSelf = (row: AdminUserRow) =>
    Boolean(currentUser?.email) &&
    row.email.toLowerCase() === currentUser?.email?.toLowerCase()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">
            Admin Users
          </h1>
          <p className="text-sm text-gray-500">
            Manage access to the admin panel. Assign preset roles or customise
            per-feature permissions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAdmins}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* ── Invite form ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add user
          </CardTitle>
          <CardDescription>
            Enter email &amp; select a preset role. You can customise their
            permissions after they&apos;re added.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={submitInvite}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-4">
              <Input
                type="email"
                required
                placeholder="teammate@planetmotors.ca"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                aria-label="Invite admin email"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                className="border rounded-md px-3 py-2 text-sm w-full h-10"
                aria-label="Invite admin role"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4">
              <Input
                placeholder="Notes (optional)"
                value={inviteNotes}
                onChange={(e) => setInviteNotes(e.target.value)}
                aria-label="Invite admin notes"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={inviting} className="w-full aria-busy:opacity-80 aria-busy:cursor-wait" aria-busy={inviting}>
                {inviting ? "Adding..." : "Add User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Roster ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Current roster ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-gray-500 py-6 text-center">
              Loading admins...
            </p>
          )}
          {!loading && admins.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center">
              No admins on file. Add the first one above.
            </p>
          )}
          {!loading && admins.length > 0 && (
            <div className="divide-y" data-testid="admin-roster">
              {admins.map((row) => {
                const self = isSelf(row)
                const busy = pendingId === row.id
                const expanded = expandedId === row.id
                const effectivePerms = resolvePermissions(row.role, row.permissions)

                return (
                  <div key={row.id} data-testid="admin-row">
                    {/* ── User row ────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {row.email}
                          {self && (
                            <span className="ml-2 text-xs text-gray-400">
                              (you)
                            </span>
                          )}
                        </p>
                        {row.notes && (
                          <p className="text-xs text-gray-500 truncate">
                            {row.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Added {formatTime(row.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={roleBadgeVariant(row.role)}>
                          {row.role}
                        </Badge>
                        <select
                          value={row.role}
                          disabled={busy || self}
                          onChange={(e) =>
                            changeRole(row.id, e.target.value as AdminRole)
                          }
                          className="border rounded-md px-2 py-1 text-xs"
                          aria-label={`Change role for ${row.email}`}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy || self}
                          onClick={() =>
                            patchAdmin(row.id, { is_active: !row.is_active })
                          }
                          aria-label={
                            row.is_active
                              ? `Deactivate ${row.email}`
                              : `Activate ${row.email}`
                          }
                        >
                          {row.is_active ? (
                            <>
                              <ToggleRight className="w-4 h-4 mr-1 text-green-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 mr-1 text-gray-400" />
                              Inactive
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setExpandedId(expanded ? null : row.id)
                          }
                          aria-label={`${expanded ? "Hide" : "Show"} permissions for ${row.email}`}
                        >
                          {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span className="ml-1 text-xs">Permissions</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy || resending === row.id}
                          onClick={() => resendInvitation(row.id, row.email)}
                          aria-label={`Resend invitation to ${row.email}`}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Mail className="w-4 h-4" />
                          {resending === row.id && <span className="ml-1 text-xs">Sending…</span>}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy || self}
                          onClick={() => removeAdmin(row.id, row.email)}
                          aria-label={`Remove ${row.email}`}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* ── Permission matrix (expandable) ──────── */}
                    {expanded && (
                      <div className="pb-4 pl-4 pr-4">
                        <div className="bg-gray-50 rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Feature Permissions
                            </p>
                            {!self && (
                              <div className="flex gap-1">
                                {ROLE_OPTIONS.map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => changeRole(row.id, preset)}
                                    disabled={busy}
                                    className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    Reset to {preset}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {ADMIN_FEATURES.map((feature) => {
                              const level = effectivePerms[feature]
                              return (
                                <div
                                  key={feature}
                                  className="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded border"
                                >
                                  <span className="text-sm text-gray-700 truncate">
                                    {FEATURE_LABELS[feature]}
                                  </span>
                                  {self ? (
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded border ${accessLevelColor(level)}`}
                                    >
                                      {level}
                                    </span>
                                  ) : (
                                    <select
                                      value={level}
                                      disabled={busy}
                                      onChange={(e) =>
                                        changePermission(
                                          row,
                                          feature,
                                          e.target.value as AccessLevel,
                                        )
                                      }
                                      className={`text-xs px-2 py-0.5 rounded border cursor-pointer ${accessLevelColor(level)}`}
                                      aria-label={`${FEATURE_LABELS[feature]} access for ${row.email}`}
                                    >
                                      {ACCESS_LEVELS.map((al) => (
                                        <option key={al} value={al}>
                                          {al}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
