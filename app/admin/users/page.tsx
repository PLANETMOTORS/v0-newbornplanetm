"use client"

/**
 * /admin/users — runtime admin roster management.
 *
 * Lists every row from `admin_users`, lets a logged-in admin invite a
 * new admin, change role / active flag, and revoke access.
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

type AdminRole = "admin" | "manager" | "viewer"

interface AdminUserRow {
  id: string
  email: string
  role: AdminRole
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

const ROLE_OPTIONS: readonly AdminRole[] = ["admin", "manager", "viewer"]

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

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [admins, setAdmins] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<AdminRole>("admin")
  const [inviteNotes, setInviteNotes] = useState("")
  const [inviting, setInviting] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

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
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          notes: inviteNotes.trim() || undefined,
        }),
      })
      await throwIfNotOk(res, "Invite failed")
      setInviteEmail("")
      setInviteNotes("")
      setInviteRole("admin")
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
    patch: { role?: AdminRole; is_active?: boolean },
  ) => {
    await runMutation(id, "Update failed", () =>
      fetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    )
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
            Manage who has access to the admin panel. Roles are: admin
            (full), manager (inventory + leads), viewer (read-only).
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Invite admin
          </CardTitle>
          <CardDescription>
            Add a teammate by email. They&apos;ll need to log in once via the
            same Supabase account; their role takes effect on next request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={submitInvite}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-5">
              <Input
                type="email"
                required
                placeholder="teammate@planetmotors.ca"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                aria-label="Invite admin email"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                className="border rounded-md px-3 py-2 text-sm w-full h-10"
                aria-label="Invite admin role"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <Input
                placeholder="Notes (optional)"
                value={inviteNotes}
                onChange={(e) => setInviteNotes(e.target.value)}
                aria-label="Invite admin notes"
              />
            </div>
            <div className="sm:col-span-1">
              <Button type="submit" disabled={inviting} className="w-full">
                {inviting ? "..." : "Invite"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
              No admins on file. Invite the first one above.
            </p>
          )}
          {!loading && admins.length > 0 && (
            <div className="divide-y" data-testid="admin-roster">
              {admins.map((row) => {
                const self = isSelf(row)
                const busy = pendingId === row.id
                return (
                  <div
                    key={row.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3"
                    data-testid="admin-row"
                  >
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
                          patchAdmin(row.id, {
                            role: e.target.value as AdminRole,
                          })
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
                        disabled={busy || self}
                        onClick={() => removeAdmin(row.id, row.email)}
                        aria-label={`Remove ${row.email}`}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
