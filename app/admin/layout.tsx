"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import {
  LayoutDashboard, Car, Users, FileText, DollarSign,
  MessageSquare, Settings, LogOut, Menu, X,
  BarChart3, Bell, Search, Shield, Camera, Paintbrush,
  Bot, CalendarCheck, Mail, UserCog,
  Sparkles, Globe, ZoomIn, Clapperboard
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { ADMIN_EMAILS } from "@/lib/admin"
import {
  type PermissionMap,
  ROUTE_TO_FEATURE,
  resolvePermissions,
  hasAccess,
} from "@/lib/admin/permissions"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Vehicles", href: "/admin/inventory", icon: Car },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Leads", href: "/admin/leads", icon: MessageSquare },
  { name: "Reservations", href: "/admin/reservations", icon: CalendarCheck },
  { name: "Orders", href: "/admin/orders", icon: FileText },
  { name: "Finance Apps", href: "/admin/finance", icon: DollarSign },
  { name: "AI Agents", href: "/admin/ai-agents", icon: Bot },
  { name: "Workflows", href: "/admin/workflows", icon: Mail },
  { name: "360° Photos", href: "/admin/360-upload", icon: Camera },
  { name: "Backgrounds", href: "/admin/backgrounds", icon: Paintbrush },
  { name: "AI Writer", href: "/admin/ai-writer", icon: Sparkles },
  { name: "AI SEO", href: "/admin/ai-seo", icon: Globe },
  { name: "AI Enhance", href: "/admin/ai-enhance", icon: ZoomIn },
  { name: "AI Video", href: "/admin/ai-video", icon: Clapperboard },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Admin Users", href: "/admin/users", icon: UserCog },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [permissions, setPermissions] = useState<PermissionMap | null>(null)

  // Allow auth-related pages to render without admin shell or auth gate
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/forgot-password" || pathname === "/admin/reset-password"

  useEffect(() => {
    if (isAuthPage || isLoading) return
    if (!user) {
      router.push("/admin/login")
      return
    }

    // Synchronous fast-path: if the current user is in the env list or has
    // the legacy is_admin metadata claim, render the shell immediately.
    const fastPathAdmin =
      ADMIN_EMAILS.includes(user.email || "") ||
      user.user_metadata?.is_admin === true
    if (fastPathAdmin) {
      setIsAdmin(true)
      setPermissions(resolvePermissions("admin"))
      return
    }

    // Slow path: consult the DB-backed admin_users table for runtime-invited
    // admins. A failure here is not authoritative — keep the user on the
    // verifying screen rather than redirecting to "/".
    let cancelled = false
    fetch("/api/v1/admin/me")
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setIsAdmin(false)
          router.push("/")
          return
        }
        const json = (await res.json()) as { isAdmin?: boolean; role?: string; permissions?: Partial<PermissionMap> | null }
        if (cancelled) return
        if (json.isAdmin) {
          setIsAdmin(true)
          setPermissions(resolvePermissions(json.role ?? "viewer", json.permissions))
        } else {
          router.push("/")
        }
      })
      .catch(() => {
        if (cancelled) return
        router.push("/")
      })
    return () => {
      cancelled = true
    }
  }, [user, isLoading, router, isAuthPage])

  // Filter sidebar navigation based on user permissions
  const visibleNavigation = useMemo(() => {
    if (!permissions) return navigation
    return navigation.filter((item) => {
      const feature = ROUTE_TO_FEATURE[item.href]
      if (!feature) return true
      return hasAccess(permissions, feature, "read")
    })
  }, [permissions])

  // Render auth pages without the admin shell
  if (isAuthPage) {
    return <>{children}</>
  }

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transform transition-transform duration-200
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-400" />
            <span className="font-bold text-lg">Admin Panel</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-2 hover:bg-slate-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {visibleNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5 text-slate-400" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 mb-2">
            <LayoutDashboard className="w-5 h-5 text-slate-400" />
            <span>View Website</span>
          </Link>
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 w-full text-left text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="lg:hidden p-2 hover:bg-gray-100 rounded"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  aria-label="Search admin"
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative p-2 hover:bg-gray-100 rounded-full"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 pl-3 border-l">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
