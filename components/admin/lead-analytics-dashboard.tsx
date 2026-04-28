 
"use client"

/**
 * components/admin/lead-analytics-dashboard.tsx
 *
 * Real-time Lead Analytics Dashboard
 *
 * Visualizes lead pipeline data from /api/v1/admin/leads in real-time.
 * Auto-refreshes every 30 seconds. Shows:
 *  - Live KPI cards (total, new, conversion rate, avg response time)
 *  - Source breakdown bar chart (pure CSS, no chart library needed)
 *  - Status funnel visualization
 *  - Recent leads feed with live timestamps
 *  - AB test experiment impressions (from lib/ab-testing.ts GTM events)
 *
 * Used by: app/admin/leads/page.tsx and app/admin/analytics/page.tsx
 */

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Users, TrendingUp, Clock, Zap, RefreshCw,
  MessageSquare, Bot, DollarSign, Car, CalendarCheck,
  Phone, Mail, ArrowUpRight, Activity, Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Stable keys for the loading-state KPI skeleton grid.
const LEAD_ANALYTICS_SKELETON_KEYS = ["kpi-total", "kpi-new", "kpi-conv", "kpi-rt"] as const

// ── Types ──────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  source: string
  status: string
  priority: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  subject: string
  vehicle_info: string | null
  created_at: string
}

interface LeadStats {
  total: number
  new: number
  contacted: number
  qualified: number
  converted: number
}

interface LeadsApiResponse {
  leads: Lead[]
  stats: LeadStats
  total: number
}

interface DashboardProps {
  /** Auto-refresh interval in ms. Default: 30000 (30s) */
  refreshInterval?: number
  /** Max recent leads to show in the feed. Default: 8 */
  feedLimit?: number
  /** Show the AB experiment panel. Default: true */
  showExperiments?: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  contact_form: "Contact Form",
  chat: "Anna Chat",
  phone: "Phone",
  finance_app: "Finance App",
  trade_in: "Trade-In",
  reservation: "Reservation",
  test_drive: "Test Drive",
  vdp_inquiry: "VDP Inquiry",
  lead_capture_form: "Lead Form",
  walk_in: "Walk-In",
  referral: "Referral",
}

const SOURCE_COLORS: Record<string, string> = {
  contact_form: "bg-blue-500",
  chat: "bg-violet-500",
  finance_app: "bg-emerald-500",
  trade_in: "bg-amber-500",
  reservation: "bg-cyan-500",
  test_drive: "bg-orange-500",
  vdp_inquiry: "bg-pink-500",
  lead_capture_form: "bg-indigo-500",
  walk_in: "bg-teal-500",
  referral: "bg-rose-500",
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

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function statusColor(status: string): string {
  switch (status) {
    case "new": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    case "contacted": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "qualified": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
    case "negotiating": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    case "converted": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    case "lost": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
  }
}

// ── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, icon: Icon, trend, color = "blue", pulse = false,
}: Readonly<{
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
  trend?: string
  color?: "blue" | "green" | "amber" | "violet"
  pulse?: boolean
}>) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
  }
  return (
    <Card className="relative overflow-hidden">
      {pulse && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            {trend && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />{trend}
              </p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Source Bar Chart ───────────────────────────────────────────────────────

function SourceBreakdown({ leads }: Readonly<{ leads: Lead[] }>) {
  const counts: Record<string, number> = {}
  for (const lead of leads) {
    counts[lead.source] = (counts[lead.source] ?? 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7)
  const max = sorted[0]?.[1] ?? 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          Lead Sources
        </CardTitle>
        <CardDescription className="text-xs">Distribution across all channels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No leads yet</p>
        ) : sorted.map(([source, count]) => {
          const pct = Math.round((count / max) * 100)
          const color = SOURCE_COLORS[source] ?? "bg-slate-400"
          const label = SOURCE_LABELS[source] ?? source
          return (
            <div key={source}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground font-mono">{count}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ── Status Funnel ──────────────────────────────────────────────────────────

function StatusFunnel({ stats }: Readonly<{ stats: LeadStats }>) {
  const stages = [
    { label: "New", value: stats.new, color: "bg-blue-500", pct: stats.total ? Math.round((stats.new / stats.total) * 100) : 0 },
    { label: "Contacted", value: stats.contacted, color: "bg-yellow-500", pct: stats.total ? Math.round((stats.contacted / stats.total) * 100) : 0 },
    { label: "Qualified", value: stats.qualified, color: "bg-purple-500", pct: stats.total ? Math.round((stats.qualified / stats.total) * 100) : 0 },
    { label: "Converted", value: stats.converted, color: "bg-emerald-500", pct: stats.total ? Math.round((stats.converted / stats.total) * 100) : 0 },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-violet-500" />
          Pipeline Funnel
        </CardTitle>
        <CardDescription className="text-xs">Lead progression through stages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-20 shrink-0">{stage.label}</span>
            <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden relative">
              <div
                className={`h-full rounded-md transition-all duration-700 ${stage.color} opacity-80`}
                style={{ width: `${Math.max(stage.pct, 2)}%` }}
              />
              <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold text-white mix-blend-difference">
                {stage.value}
              </span>
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right font-mono">{stage.pct}%</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Recent Leads Feed ──────────────────────────────────────────────────────

function RecentLeadsFeed({ leads }: Readonly<{ leads: Lead[] }>) {
  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Live Lead Feed
          </CardTitle>{" "}
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No leads yet — they'll appear here in real-time</p>
        ) : (
          <div className="divide-y divide-border">
            {leads.map((lead) => {
              const Icon = sourceIcon(lead.source)
              return (
                <div key={lead.id} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-muted shrink-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">{lead.customer_name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                      {lead.priority === "high" && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          HIGH
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {lead.vehicle_info ?? lead.subject}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <a href={`mailto:${lead.customer_email}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />{lead.customer_email}
                      </a>
                      {lead.customer_phone && (
                        <a href={`tel:${lead.customer_phone}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />{lead.customer_phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{timeAgo(lead.created_at)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{SOURCE_LABELS[lead.source] ?? lead.source}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export function LeadAnalyticsDashboard({
  refreshInterval = 30_000,
  feedLimit = 8,
}: Readonly<DashboardProps>) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats>({ total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(refreshInterval / 1000)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/leads?limit=${feedLimit}&page=1`)
      if (!res.ok) {
        if (res.status === 401) { setError("Unauthorized — admin access required"); return }
        setError("Failed to load leads")
        return
      }
      const json: LeadsApiResponse = await res.json()
      setLeads(json.leads ?? [])
      setStats(json.stats ?? { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 })
      setLastRefresh(new Date())
      setError(null)
    } catch {
      setError("Network error — retrying…")
    } finally {
      setLoading(false)
    }
  }, [feedLimit])

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchLeads()
    intervalRef.current = setInterval(() => {
      fetchLeads()
      setCountdown(refreshInterval / 1000)
    }, refreshInterval)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchLeads, refreshInterval])

  // Countdown ticker
  useEffect(() => {
    setCountdown(refreshInterval / 1000)
    countdownRef.current = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1))
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [refreshInterval, lastRefresh])

  const conversionRate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : "0.0"

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {LEAD_ANALYTICS_SKELETON_KEYS.map((skeletonKey) => (
          <div key={skeletonKey} className="h-28 bg-muted rounded-xl" />
        ))}
        <div className="col-span-full h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchLeads}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Refresh bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {lastRefresh ? `Updated ${timeAgo(lastRefresh.toISOString())}` : "Loading…"}
        </span>
        <div className="flex items-center gap-3">
          <span>Auto-refresh in {countdown}s</span>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { fetchLeads(); setCountdown(refreshInterval / 1000) }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Leads"
          value={stats.total}
          sub="All time"
          icon={Users}
          color="blue"
          pulse
        />
        <KpiCard
          title="New Leads"
          value={stats.new}
          sub="Awaiting contact"
          icon={Zap}
          color="amber"
          trend={stats.new > 0 ? `${stats.new} need attention` : undefined}
        />
        <KpiCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          sub={`${stats.converted} converted`}
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          title="In Pipeline"
          value={stats.contacted + stats.qualified}
          sub="Contacted + Qualified"
          icon={Target}
          color="violet"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SourceBreakdown leads={leads} />
        <StatusFunnel stats={stats} />
      </div>

      {/* Live feed */}
      <div className="grid grid-cols-1">
        <RecentLeadsFeed leads={leads} />
      </div>
    </div>
  )
}
