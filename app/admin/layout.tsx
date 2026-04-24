"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { 
  LayoutDashboard, Car, Users, FileText, DollarSign,
  MessageSquare, Settings, LogOut, Menu, X,
  BarChart3, Bell, Search, Shield, Camera,
  Bot, CalendarCheck, Mail
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { ADMIN_EMAILS } from "@/lib/admin"

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
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/login?redirectTo=/admin")
      } else {
        // Check if user is admin
        const userIsAdmin = ADMIN_EMAILS.includes(user.email || "") || 
                           user.user_metadata?.is_admin === true
        setIsAdmin(userIsAdmin)
        if (!userIsAdmin) {
          router.push("/")
        }
      }
    }
  }, [user, isLoading, router])

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pm-surface-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-pm-text-secondary">Verifying access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pm-surface-light">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
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
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
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
        <header className="bg-white border-b border-pm-border sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-pm-surface-light rounded"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-muted" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-pm-surface-light rounded-full">
                <Bell className="w-5 h-5 text-pm-text-secondary" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 pl-3 border-l">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-pm-text-secondary">Administrator</p>
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
