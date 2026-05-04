"use client"

import { ShieldOff, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { AdminFeature } from "@/lib/admin/permissions"
import { FEATURE_LABELS } from "@/lib/admin/permissions"

interface AccessDeniedProps {
  /** The feature the user tried to access. */
  feature: AdminFeature | null
  /** The user's current role (admin/manager/viewer). */
  role: string
  /** The user's email for display. */
  email?: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-blue-100 text-blue-800",
  manager: "bg-amber-100 text-amber-800",
  viewer: "bg-gray-100 text-gray-800",
}

export function AccessDenied({ feature, role, email }: AccessDeniedProps) {
  const router = useRouter()
  const featureLabel = feature ? FEATURE_LABELS[feature] ?? feature : "this page"
  const roleColor = ROLE_COLORS[role] ?? ROLE_COLORS.viewer

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to access <strong>{featureLabel}</strong>.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
          {email && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Signed in as</span>
              <span className="font-medium text-gray-900">{email}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Your role</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColor}`}>
              {role}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Required access</span>
            <span className="text-xs font-medium text-gray-700">
              Read access to &quot;{featureLabel}&quot;
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Contact your administrator to request access to this feature.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Go Back
          </Button>
          <Button variant="default" size="sm" onClick={() => router.push("/admin")}>
            <Home className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
