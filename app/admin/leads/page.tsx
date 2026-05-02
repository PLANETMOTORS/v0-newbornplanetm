"use client"

import { useState, useEffect, useCallback } from "react"
import {
  MessageSquare, Search, RefreshCw, Phone, Mail,
  ChevronLeft, ChevronRight,
  User
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { timeAgo, sourceIcon, leadStatusVariant as statusVariant } from "@/lib/admin/lead-utils"
import { DeleteRowButton } from "@/components/admin/delete-row-button"

interface Lead {
  id: string
  source: string
  status: string
  priority: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  subject: string
  message: string | null
  vehicle_info: string | null
  notes: string | null
  assigned_to: string | null
  created_at: string
  source_table?: string
}

interface LeadStats {
  total: number
  new: number
  contacted: number
  qualified: number
  converted: number
}

const SOURCE_LABELS: Record<string, string> = {
  contact_form: "Contact Form",
  chat: "Anna Chat",
  phone: "Phone",
  finance_app: "Finance App",
  trade_in: "Trade-In",
  reservation: "Reservation",
  test_drive: "Test Drive",
  walk_in: "Walk-In",
  newsletter: "Newsletter",
  referral: "Referral",
  other: "Other",
}

const STATUS_OPTIONS = ["all", "new", "contacted", "qualified", "negotiating", "converted", "lost", "archived"]
const SOURCE_OPTIONS = ["all", "contact_form", "chat", "finance_app", "trade_in", "reservation", "test_drive", "newsletter"]

function priorityColor(priority: string): string {
  switch (priority) {
    case "urgent": return "bg-red-100 text-red-700"
    case "high": return "bg-orange-100 text-orange-700"
    case "medium": return "bg-blue-100 text-blue-700"
    case "low": return "bg-gray-100 text-gray-700"
    default: return "bg-gray-100 text-gray-700"
  }
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats>({ total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const limit = 20

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (sourceFilter !== "all") params.set("source", sourceFilter)
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const res = await fetch(`/api/v1/admin/leads?${params}`)
      if (!res.ok) throw new Error("Failed to fetch leads")
      const data = await res.json()
      setLeads(data.leads || [])
      setStats(data.stats || { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 })
      setTotal(data.total || 0)
    } catch (err) {
      console.error("Leads fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sourceFilter, search, page])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const handleLeadDeleted = useCallback((leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId))
    setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
    setTotal((prev) => Math.max(0, prev - 1))
    setSelectedLead((prev) => (prev?.id === leadId ? null : prev))
  }, [])

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/v1/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      })
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
        if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err) {
      console.error("Status update error:", err)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">Leads & Inquiries</h1>
          <p className="text-sm text-gray-500">All customer inquiries from contact form, Anna chat, finance apps, and more</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLeads}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900" },
          { label: "New", value: stats.new, color: "text-blue-600" },
          { label: "Contacted", value: stats.contacted, color: "text-yellow-600" },
          { label: "Qualified", value: stats.qualified, color: "text-green-600" },
          { label: "Converted", value: stats.converted, color: "text-purple-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="border rounded-md px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }}
          className="border rounded-md px-3 py-2 text-sm"
        >
          {SOURCE_OPTIONS.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Sources" : SOURCE_LABELS[s] || s}</option>
          ))}
        </select>
      </div>

      {/* Leads List + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {(() => {
                if (loading) {
                  return <div className="p-8 text-center text-gray-500">Loading leads...</div>
                }
                if (leads.length === 0) {
                  return (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No leads found</p>
                      <p className="text-xs mt-1">Leads will appear when customers submit inquiries, chat with Anna, or apply for financing</p>
                    </div>
                  )
                }
                return (
                <div className="divide-y">
                  {leads.map(lead => {
                    const Icon = sourceIcon(lead.source)
                    return (
                      <div
                        key={lead.id}
                        className={`flex items-start gap-2 p-4 hover:bg-gray-50 transition-colors ${selectedLead?.id === lead.id ? "bg-blue-50" : ""}`}
                      >
                        <button
                          type="button"
                          className="flex-1 text-left cursor-pointer"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{lead.customer_name || lead.customer_email || "Unknown"}</p>
                                <p className="text-xs text-gray-500 truncate">{lead.subject}</p>
                                {lead.vehicle_info && (
                                  <p className="text-xs text-gray-400 truncate">{lead.vehicle_info}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <Badge variant={statusVariant(lead.status)} className="text-xs">{lead.status}</Badge>
                              {lead.priority && lead.priority !== "medium" && (
                                <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 ${priorityColor(lead.priority)}`}>
                                  {lead.priority}
                                </span>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(lead.created_at)}</p>
                            </div>
                          </div>
                        </button>
                        <DeleteRowButton
                          endpoint={`/api/v1/admin/leads/${lead.id}`}
                          id={lead.id}
                          label={`lead from ${lead.customer_name || lead.customer_email || "Unknown"}`}
                          onDeleted={handleLeadDeleted}
                        />
                      </div>
                    )
                  })}
                </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">Page {page} of {totalPages} ({total} leads)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <Card className="h-fit">
          {selectedLead ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg">{selectedLead.customer_name || "Unknown"}</CardTitle>
                <CardDescription>{SOURCE_LABELS[selectedLead.source] || selectedLead.source}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  {selectedLead.customer_email && (
                    <a href={`mailto:${selectedLead.customer_email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Mail className="w-4 h-4" />
                      {selectedLead.customer_email}
                    </a>
                  )}
                  {selectedLead.customer_phone && (
                    <a href={`tel:${selectedLead.customer_phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Phone className="w-4 h-4" />
                      {selectedLead.customer_phone}
                    </a>
                  )}
                </div>

                {/* Subject & Message */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Subject</p>
                  <p className="text-sm">{selectedLead.subject}</p>
                </div>
                {selectedLead.message && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Message</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedLead.message}</p>
                  </div>
                )}
                {selectedLead.vehicle_info && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Vehicle Interest</p>
                    <p className="text-sm">{selectedLead.vehicle_info}</p>
                  </div>
                )}

                {/* Status Actions */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {["new", "contacted", "qualified", "negotiating", "converted", "lost"].map(s => (
                      <Button
                        key={s}
                        variant={selectedLead.status === s ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => updateLeadStatus(selectedLead.id, s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-400">Created {new Date(selectedLead.created_at).toLocaleString()}</p>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Select a lead to view details</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
