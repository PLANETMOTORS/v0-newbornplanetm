"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  Car, DollarSign, TrendingUp, ArrowUpRight,
  MessageSquare, Clock,
  ChevronRight, CalendarCheck, Users, Bot, RefreshCw, FileText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalInventory: number
  availableVehicles: number
  soldVehicles: number
  totalOrders: number
  recentOrders: number
  totalFinanceApps: number
  pendingFinanceApps: number
  activeReservations: number
  totalCustomers: number
  newCustomersThisWeek: number
  totalTradeIns: number
}

interface RecentLead {
  id: string
  source: string
  status: string
  customer_name: string
  customer_email: string
  subject: string
  vehicle_info: string | null
  created_at: string
}

interface ActivityItem {
  type: string
  title: string
  detail: string
  time: string
  status: string
  id: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function sourceIcon(source: string) {
  switch (source) {
    case "contact_form": return MessageSquare
    case "chat": return Bot
    case "finance_app": return DollarSign
    case "reservation": return CalendarCheck
    case "trade_in": return Car
    case "test_drive": return Clock
    default: return MessageSquare
  }
}

function statusColor(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "new": return "default"
    case "contacted": return "secondary"
    case "qualified": return "outline"
    case "converted": return "default"
    case "lost": return "destructive"
    default: return "secondary"
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/v1/admin/dashboard")
      if (!res.ok) throw new Error("Failed to fetch dashboard data")
      const data = await res.json()
      setStats(data.stats)
      setRecentLeads(data.recentLeads || [])
      setRecentActivity(data.recentActivity || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">Dashboard</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-16 bg-gray-200 rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || "Failed to load dashboard"}</p>
            <Button onClick={fetchDashboard} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    { name: "Available Vehicles", value: stats.availableVehicles, sub: `${stats.soldVehicles} sold`, icon: Car, href: "/admin/inventory", color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Active Leads", value: recentLeads.filter(l => l.status === "new").length || stats.pendingFinanceApps, sub: `${recentLeads.length} total`, icon: MessageSquare, href: "/admin/leads", color: "text-green-600", bg: "bg-green-50" },
    { name: "Finance Apps", value: stats.pendingFinanceApps, sub: `${stats.totalFinanceApps} total`, icon: DollarSign, href: "/admin/finance", color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Reservations", value: stats.activeReservations, sub: "active", icon: CalendarCheck, href: "/admin/reservations", color: "text-orange-600", bg: "bg-orange-50" },
    { name: "Customers", value: stats.totalCustomers, sub: `+${stats.newCustomersThisWeek} this week`, icon: Users, href: "/admin/customers", color: "text-indigo-600", bg: "bg-indigo-50" },
    { name: "Trade-Ins", value: stats.totalTradeIns, sub: "requests", icon: TrendingUp, href: "/admin/trade-ins", color: "text-teal-600", bg: "bg-teal-50" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time overview of Planet Motors operations</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-gray-400" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.name}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest customer inquiries from all sources</CardDescription>
            </div>
            <Link href="/admin/leads">
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No leads yet. They&apos;ll appear here when customers submit inquiries, chat with Anna, or apply for financing.</p>
            ) : (
              <div className="space-y-3">
                {recentLeads.slice(0, 6).map((lead) => {
                  const Icon = sourceIcon(lead.source)
                  return (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{lead.customer_name || lead.customer_email}</p>
                          <p className="text-xs text-gray-500 truncate">{lead.subject}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={statusColor(lead.status)}>{lead.status}</Badge>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(lead.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest orders, finance apps, and reservations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.slice(0, 8).map((activity, index) => (
                  <div key={`${activity.id}-${index}`} className="flex gap-3">
                    {(() => {
                      const DOT_COLORS: Record<string, string> = {
                        order: "bg-green-600",
                        finance: "bg-purple-600",
                        reservation: "bg-orange-600",
                      }
                      const dotColor = DOT_COLORS[activity.type] ?? "bg-blue-600"
                      return <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dotColor}`} />
                    })()}
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.detail}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(activity.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href="/admin/inventory">
              <Button variant="outline" className="w-full h-auto flex flex-col items-center gap-2 py-4">
                <Car className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Add Vehicle</span>
              </Button>
            </Link>
            <Link href="/admin/leads">
              <Button variant="outline" className="w-full h-auto flex flex-col items-center gap-2 py-4">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span className="text-xs">View Leads</span>
              </Button>
            </Link>
            <Link href="/admin/finance">
              <Button variant="outline" className="w-full h-auto flex flex-col items-center gap-2 py-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-xs">Finance Apps</span>
              </Button>
            </Link>
            <Link href="/admin/reservations">
              <Button variant="outline" className="w-full h-auto flex flex-col items-center gap-2 py-4">
                <CalendarCheck className="w-5 h-5 text-orange-600" />
                <span className="text-xs">Reservations</span>
              </Button>
            </Link>
            <Link href="/admin/ai-agents">
              <Button variant="outline" className="w-full h-auto flex flex-col items-center gap-2 py-4">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span className="text-xs">AI Agents</span>
              </Button>
            </Link>
            <Link href="/admin/customers">
              <Button variant="outline" className="w-full h-auto flex flex-col items-center gap-2 py-4">
                <Users className="w-5 h-5 text-teal-600" />
                <span className="text-xs">Customers</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
