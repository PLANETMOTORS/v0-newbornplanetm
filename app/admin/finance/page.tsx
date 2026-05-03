"use client"

import { useState, useEffect, useCallback } from "react"

import {
  DollarSign, Search, Filter, Download, Eye, CheckCircle,
  XCircle, Clock, FileText, User, Car, Phone, Mail,
  RefreshCw, CreditCard, MapPin, Briefcase, Home, History,
  Users, ArrowRightLeft, Save, AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DeleteRowButton } from "@/components/admin/delete-row-button"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Applicant {
  id: string
  applicant_type: string
  is_active: boolean
  relation_to_primary: string | null
  salutation: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  sin_encrypted: string | null
  date_of_birth: string | null
  gender: string | null
  marital_status: string | null
  phone: string | null
  mobile_phone: string | null
  email: string | null
  no_email: boolean
  language_preference: string
  credit_rating: string | null
  credit_score: number | null
}

interface Address {
  id: string
  applicant_id: string
  address_type: string
  address_line: string | null
  suite_number: string | null
  street_number: string | null
  street_name: string | null
  street_type: string | null
  street_direction: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country: string | null
  duration_years: number
  duration_months: number
}

interface Employment {
  id: string
  applicant_id: string
  employment_type: string
  employment_status: string | null
  employer_name: string | null
  occupation: string | null
  job_title: string | null
  employer_city: string | null
  employer_province: string | null
  employer_phone: string | null
  duration_years: number
  duration_months: number
}

interface Income {
  id: string
  applicant_id: string
  gross_income: number
  income_frequency: string
  other_income_type: string | null
  other_income_amount: number | null
  other_income_frequency: string | null
  annual_total: number | null
}

interface Housing {
  id: string
  applicant_id: string
  home_status: string | null
  market_value: number | null
  mortgage_amount: number | null
  mortgage_holder: string | null
  monthly_payment: number | null
  outstanding_mortgage: number | null
}

interface TradeIn {
  id: string
  vin: string | null
  year: number | null
  make: string | null
  model: string | null
  trim: string | null
  color: string | null
  mileage: number | null
  condition: string | null
  estimated_value: number | null
  offered_value: number | null
  has_lien: boolean
  lien_holder: string | null
  lien_amount: number | null
  net_trade_value: number | null
}

interface StatusHistory {
  id: string
  from_status: string | null
  to_status: string
  changed_by: string | null
  notes: string | null
  changed_at: string
}

interface FinanceApplication {
  id: string
  application_number: string
  status: string
  agreement_type: string
  created_at: string
  submitted_at: string | null
  updated_at: string | null
  decision_at: string | null
  requested_amount: number
  down_payment: number
  max_down_payment: number | null
  loan_term_months: number
  payment_frequency: string
  interest_rate: number | null
  admin_fee: number | null
  sales_tax_rate: number | null
  estimated_payment: number
  total_amount_financed: number | null
  total_interest: number | null
  total_to_repay: number | null
  has_trade_in: boolean
  trade_in_value: number | null
  trade_in_lien_amount: number | null
  additional_notes: string | null
  internal_notes: string | null
  vehicle: {
    id: string
    year: number
    make: string
    model: string
    trim: string | null
    price: number
    mileage: number | null
    vin: string | null
    stock_number: string | null
    primary_photo_url: string | null
  } | null
  primary_applicant: Applicant | null
  co_applicants: Applicant[]
  addresses: Address[]
  employment: Employment[]
  income: Income[]
  housing: Housing[]
  documents: {
    id: string
    document_type: string
    document_name: string
    file_url: string
    file_size: number | null
    file_type: string | null
    is_verified: boolean
    verified_at: string | null
    verification_notes: string | null
    uploaded_at: string
  }[]
  trade_ins: TradeIn[]
  history: StatusHistory[]
}

/** Format currency */
function fmtCurrency(val: number | null | undefined): string {
  if (val == null) return "—"
  return `$${Number(val).toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/** Format an address object into a single line */
function fmtAddress(a: Address): string {
  const parts: string[] = []
  if (a.suite_number) parts.push(`#${a.suite_number}`)
  if (a.street_number) parts.push(a.street_number)
  if (a.street_name) parts.push(a.street_name)
  if (a.street_type) parts.push(a.street_type)
  if (a.street_direction) parts.push(a.street_direction)
  const line1 = parts.join(" ")
  const line2 = [a.city, a.province, a.postal_code].filter(Boolean).join(", ")
  return [line1, line2].filter(Boolean).join(", ") || "No address provided"
}

/** Duration string */
function fmtDuration(years: number, months: number): string {
  const parts: string[] = []
  if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`)
  if (months) parts.push(`${months} mo`)
  return parts.join(" ") || "—"
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  funded: "bg-purple-100 text-purple-800",
  cancelled: "bg-gray-100 text-gray-600"
}

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="w-4 h-4" />,
  submitted: <FileText className="w-4 h-4" />,
  under_review: <Eye className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  declined: <XCircle className="w-4 h-4" />,
  funded: <DollarSign className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />
}

/**
 * Admin page for listing, filtering, viewing, and updating finance applications.
 *
 * Renders UI for application statistics, searchable & filterable application list, and a detail dialog
 * that exposes documents, vehicle info, financing terms, and status update actions.
 *
 * @returns A JSX element containing the finance applications admin interface (list, filters, stats, and detail dialog).
 */
export default function AdminFinancePage() {
  const [applications, setApplications] = useState<FinanceApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedApp, setSelectedApp] = useState<FinanceApplication | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [internalNotes, setInternalNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    funded: 0,
    totalValue: 0
  })

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const statusQuery = statusFilter === "all" ? "" : `?status=${statusFilter}`
      const url = `/api/v1/admin/finance/applications${statusQuery}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
        setStats(data.stats || { total: 0, pending: 0, approved: 0, funded: 0, totalValue: 0 })
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  // Sync internal notes when app is selected
  useEffect(() => {
    setInternalNotes(selectedApp?.internal_notes || "")
  }, [selectedApp?.id, selectedApp?.internal_notes])

  const handleApplicationDeleted = (appId: string) => {
    setApplications((prev) => {
      const removed = prev.find((a) => a.id === appId)
      const next = prev.filter((a) => a.id !== appId)
      setStats({
        total: next.length,
        pending: next.filter((a) => ["submitted", "under_review"].includes(a.status)).length,
        approved: next.filter((a) => a.status === "approved").length,
        funded: next.filter((a) => a.status === "funded").length,
        totalValue: removed
          ? Math.max(0, stats.totalValue - (removed.requested_amount ?? 0))
          : stats.totalValue,
      })
      return next
    })
    if (selectedApp?.id === appId) {
      setSelectedApp(null)
      setDetailOpen(false)
    }
  }

  const updateStatus = async (appId: string, newStatus: string, notes?: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/v1/admin/finance/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes })
      })
      if (res.ok) {
        fetchApplications()
        if (selectedApp?.id === appId) {
          setSelectedApp({ ...selectedApp, status: newStatus })
        }
      }
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setUpdating(false)
    }
  }

  const saveInternalNotes = async () => {
    if (!selectedApp) return
    setSavingNotes(true)
    try {
      const res = await fetch("/api/v1/admin/finance/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedApp.id, internal_notes: internalNotes })
      })
      if (res.ok) {
        setSelectedApp({ ...selectedApp, internal_notes: internalNotes })
      }
    } catch (error) {
      console.error("Error saving notes:", error)
    } finally {
      setSavingNotes(false)
    }
  }

  const exportCsv = () => {
    if (filteredApplications.length === 0) return
    const headers = [
      "Application #", "Status", "Type", "Applicant Name", "Email", "Phone",
      "Vehicle", "Amount", "Down Payment", "Term", "Payment", "Frequency",
      "Trade-In", "Trade Value", "Date"
    ]
    const rows = filteredApplications.map(app => [
      app.application_number,
      app.status,
      app.agreement_type,
      app.primary_applicant ? `${app.primary_applicant.first_name} ${app.primary_applicant.last_name}` : "",
      app.primary_applicant?.email || "",
      app.primary_applicant?.phone || "",
      app.vehicle ? `${app.vehicle.year} ${app.vehicle.make} ${app.vehicle.model}` : "Pre-approval",
      app.requested_amount?.toString() || "",
      app.down_payment?.toString() || "",
      `${app.loan_term_months} months`,
      app.estimated_payment?.toString() || "",
      app.payment_frequency || "",
      app.has_trade_in ? "Yes" : "No",
      app.trade_in_value?.toString() || "",
      app.submitted_at || app.created_at
    ])
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = globalThis.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finance-applications-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    globalThis.URL.revokeObjectURL(url)
    a.remove()
  }

  const downloadDocument = async (pathname: string, fileName: string) => {
    try {
      const res = await fetch(`/api/v1/financing/documents/download?pathname=${encodeURIComponent(pathname)}&admin=true`)
      if (res.ok) {
        const blob = await res.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()
      }
    } catch (error) {
      console.error("Error downloading document:", error)
    }
  }

  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.application_number?.toLowerCase().includes(query) ||
      app.primary_applicant?.first_name?.toLowerCase().includes(query) ||
      app.primary_applicant?.last_name?.toLowerCase().includes(query) ||
      app.primary_applicant?.email?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">Finance Applications</h1>
          <p className="text-gray-500">Manage and review customer financing applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchApplications}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportCsv} disabled={filteredApplications.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Funded</p>
                <p className="text-2xl font-bold text-purple-600">{stats.funded}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold">${(stats.totalValue / 1000000).toFixed(1)}M</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                aria-label="Search finance applications by name, email, or application number"
                placeholder="Search by name, email, or application #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          {(() => {
            if (loading) {
              return (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading applications...</span>
                </div>
              )
            }
            if (filteredApplications.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No applications found</p>
                </div>
              )
            }
            return (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Application</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Applicant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Vehicle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Documents</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-mono text-sm font-medium">{app.application_number}</p>
                        <p className="text-xs text-gray-500 capitalize">{app.agreement_type}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">
                          {app.primary_applicant?.first_name} {app.primary_applicant?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{app.primary_applicant?.email}</p>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {app.vehicle ? (
                          <>
                            <p className="font-medium">{app.vehicle.year} {app.vehicle.make}</p>
                            <p className="text-sm text-gray-500">{app.vehicle.model}</p>
                          </>
                        ) : (
                          <span className="text-gray-400">Pre-approval</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">${app.requested_amount?.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          ${app.estimated_payment?.toLocaleString()}/{app.payment_frequency?.replaceAll("_", "-")}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[app.status]}>
                          <span className="flex items-center gap-1">
                            {statusIcons[app.status]}
                            {app.status?.replaceAll("_", " ")}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{app.documents?.length || 0} files</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <p className="text-sm">
                          {new Date(app.submitted_at || app.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(app.submitted_at || app.created_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app)
                              setDetailOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <DeleteRowButton
                            endpoint={`/api/v1/admin/finance/applications/${app.id}`}
                            id={app.id}
                            label={`application ${app.application_number}`}
                            onDeleted={handleApplicationDeleted}
                          />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Application {selectedApp?.application_number}
              <Badge className={statusColors[selectedApp?.status || "draft"]}>
                {selectedApp?.status?.replaceAll("_", " ")}
              </Badge>
              <Badge variant="outline" className="capitalize">{selectedApp?.agreement_type}</Badge>
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedApp?.submitted_at ? new Date(selectedApp.submitted_at).toLocaleString() : "Draft"}
              {selectedApp?.decision_at && ` • Decision: ${new Date(selectedApp.decision_at).toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <Tabs defaultValue="applicant" className="mt-4">
              <TabsList className="flex w-full overflow-x-auto">
                <TabsTrigger value="applicant">Applicant</TabsTrigger>
                <TabsTrigger value="finances">Finances</TabsTrigger>
                <TabsTrigger value="vehicle">Vehicle & Trade-In</TabsTrigger>
                <TabsTrigger value="documents">Docs ({selectedApp.documents?.length || 0})</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              {/* ── APPLICANT TAB ── */}
              <TabsContent value="applicant" className="space-y-4 mt-4">
                {/* Primary Applicant Personal Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" /> Primary Applicant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-500">Full Name</Label>
                      <p className="font-medium">
                        {[selectedApp.primary_applicant?.salutation, selectedApp.primary_applicant?.first_name, selectedApp.primary_applicant?.middle_name, selectedApp.primary_applicant?.last_name, selectedApp.primary_applicant?.suffix].filter(Boolean).join(" ") || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Date of Birth</Label>
                      <p className="font-medium">{selectedApp.primary_applicant?.date_of_birth ? new Date(selectedApp.primary_applicant.date_of_birth).toLocaleDateString() : "—"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Credit Rating</Label>
                      <p className="font-medium capitalize">{selectedApp.primary_applicant?.credit_rating || "Unknown"}{selectedApp.primary_applicant?.credit_score ? ` (${selectedApp.primary_applicant.credit_score})` : ""}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {selectedApp.primary_applicant?.email || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Phone</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {selectedApp.primary_applicant?.phone || "—"}
                      </p>
                    </div>
                    {selectedApp.primary_applicant?.mobile_phone && (
                      <div>
                        <Label className="text-gray-500">Mobile</Label>
                        <p className="font-medium">{selectedApp.primary_applicant.mobile_phone}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-500">Marital Status</Label>
                      <p className="font-medium capitalize">{selectedApp.primary_applicant?.marital_status?.replaceAll("_", " ") || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Language</Label>
                      <p className="font-medium">{selectedApp.primary_applicant?.language_preference === "fr" ? "French" : "English"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Address */}
                {(() => {
                  const primaryAddresses = selectedApp.addresses.filter(a => a.applicant_id === selectedApp.primary_applicant?.id)
                  if (primaryAddresses.length === 0) return null
                  return (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="w-5 h-5" /> Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {primaryAddresses.map(addr => (
                          <div key={addr.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <Badge variant="outline" className="capitalize shrink-0">{addr.address_type}</Badge>
                            <div>
                              <p className="font-medium">{fmtAddress(addr)}</p>
                              <p className="text-sm text-gray-500">Duration: {fmtDuration(addr.duration_years, addr.duration_months)}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Employment */}
                {(() => {
                  const primaryEmployment = selectedApp.employment.filter(e => e.applicant_id === selectedApp.primary_applicant?.id)
                  if (primaryEmployment.length === 0) return null
                  return (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Briefcase className="w-5 h-5" /> Employment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {primaryEmployment.map(emp => (
                          <div key={emp.id} className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                            <div>
                              <Label className="text-gray-500">Status</Label>
                              <p className="font-medium capitalize">{emp.employment_status?.replaceAll("_", " ") || emp.employment_type || "—"}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Employer</Label>
                              <p className="font-medium">{emp.employer_name || "—"}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Title / Occupation</Label>
                              <p className="font-medium">{emp.job_title || emp.occupation || "—"}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Duration</Label>
                              <p className="font-medium">{fmtDuration(emp.duration_years, emp.duration_months)}</p>
                            </div>
                            {emp.employer_phone && (
                              <div>
                                <Label className="text-gray-500">Employer Phone</Label>
                                <p className="font-medium">{emp.employer_phone}</p>
                              </div>
                            )}
                            {(emp.employer_city || emp.employer_province) && (
                              <div>
                                <Label className="text-gray-500">Location</Label>
                                <p className="font-medium">{[emp.employer_city, emp.employer_province].filter(Boolean).join(", ")}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Income */}
                {(() => {
                  const primaryIncome = selectedApp.income.filter(i => i.applicant_id === selectedApp.primary_applicant?.id)
                  if (primaryIncome.length === 0) return null
                  return (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="w-5 h-5" /> Income
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {primaryIncome.map(inc => (
                          <div key={inc.id} className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                            <div>
                              <Label className="text-gray-500">Gross Income</Label>
                              <p className="font-medium">{fmtCurrency(inc.gross_income)} / {inc.income_frequency}</p>
                            </div>
                            {inc.annual_total != null && (
                              <div>
                                <Label className="text-gray-500">Annual Total</Label>
                                <p className="font-medium text-green-600">{fmtCurrency(inc.annual_total)}</p>
                              </div>
                            )}
                            {inc.other_income_amount != null && (
                              <div>
                                <Label className="text-gray-500">Other Income</Label>
                                <p className="font-medium">{fmtCurrency(inc.other_income_amount)} / {inc.other_income_frequency} ({inc.other_income_type})</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Housing */}
                {(() => {
                  const primaryHousing = selectedApp.housing.filter(h => h.applicant_id === selectedApp.primary_applicant?.id)
                  if (primaryHousing.length === 0) return null
                  return (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Home className="w-5 h-5" /> Housing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {primaryHousing.map(h => (
                          <div key={h.id} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div><Label className="text-gray-500">Status</Label><p className="font-medium capitalize">{h.home_status?.replaceAll("_", " ") || "—"}</p></div>
                            {h.monthly_payment != null && <div><Label className="text-gray-500">Monthly Payment</Label><p className="font-medium">{fmtCurrency(h.monthly_payment)}</p></div>}
                            {h.market_value != null && <div><Label className="text-gray-500">Market Value</Label><p className="font-medium">{fmtCurrency(h.market_value)}</p></div>}
                            {h.mortgage_holder && <div><Label className="text-gray-500">Mortgage Holder</Label><p className="font-medium">{h.mortgage_holder}</p></div>}
                            {h.outstanding_mortgage != null && <div><Label className="text-gray-500">Outstanding Mortgage</Label><p className="font-medium">{fmtCurrency(h.outstanding_mortgage)}</p></div>}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Co-Applicants */}
                {selectedApp.co_applicants.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" /> Co-Applicant{selectedApp.co_applicants.length > 1 ? "s" : ""}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedApp.co_applicants.map(co => (
                        <div key={co.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">{co.applicant_type.replaceAll("_", " ")}</Badge>
                            {co.relation_to_primary && <span className="text-sm text-gray-500">({co.relation_to_primary})</span>}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div><Label className="text-gray-500">Name</Label><p className="font-medium">{co.first_name} {co.last_name}</p></div>
                            <div><Label className="text-gray-500">Email</Label><p className="font-medium">{co.email || "—"}</p></div>
                            <div><Label className="text-gray-500">Phone</Label><p className="font-medium">{co.phone || "—"}</p></div>
                            {co.date_of_birth && <div><Label className="text-gray-500">DOB</Label><p className="font-medium">{new Date(co.date_of_birth).toLocaleDateString()}</p></div>}
                            <div><Label className="text-gray-500">Credit</Label><p className="font-medium capitalize">{co.credit_rating || "Unknown"}</p></div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Additional Notes from applicant */}
                {selectedApp.additional_notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> Applicant Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedApp.additional_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── FINANCES TAB ── */}
              <TabsContent value="finances" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" /> Financing Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div><Label className="text-gray-500">Requested Amount</Label><p className="font-medium text-lg">{fmtCurrency(selectedApp.requested_amount)}</p></div>
                    <div><Label className="text-gray-500">Down Payment</Label><p className="font-medium text-lg">{fmtCurrency(selectedApp.down_payment)}</p></div>
                    <div><Label className="text-gray-500">Term</Label><p className="font-medium text-lg">{selectedApp.loan_term_months} months</p></div>
                    <div><Label className="text-gray-500">Payment Frequency</Label><p className="font-medium capitalize">{selectedApp.payment_frequency?.replaceAll("_", "-")}</p></div>
                    <div><Label className="text-gray-500">Estimated Payment</Label><p className="font-medium text-lg text-primary">{fmtCurrency(selectedApp.estimated_payment)}</p></div>
                    {selectedApp.interest_rate != null && <div><Label className="text-gray-500">Interest Rate</Label><p className="font-medium">{selectedApp.interest_rate}%</p></div>}
                    {selectedApp.admin_fee != null && <div><Label className="text-gray-500">Admin Fee</Label><p className="font-medium">{fmtCurrency(selectedApp.admin_fee)}</p></div>}
                    {selectedApp.sales_tax_rate != null && <div><Label className="text-gray-500">Sales Tax Rate</Label><p className="font-medium">{selectedApp.sales_tax_rate}%</p></div>}
                    {selectedApp.total_amount_financed != null && <div><Label className="text-gray-500">Total Financed</Label><p className="font-medium text-lg font-bold">{fmtCurrency(selectedApp.total_amount_financed)}</p></div>}
                    {selectedApp.total_interest != null && <div><Label className="text-gray-500">Total Interest</Label><p className="font-medium">{fmtCurrency(selectedApp.total_interest)}</p></div>}
                    {selectedApp.total_to_repay != null && <div><Label className="text-gray-500">Total to Repay</Label><p className="font-medium text-lg font-bold text-red-600">{fmtCurrency(selectedApp.total_to_repay)}</p></div>}
                  </CardContent>
                </Card>

                {selectedApp.has_trade_in && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5" /> Trade-In Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div><Label className="text-gray-500">Trade-In Value</Label><p className="font-medium text-green-600">{fmtCurrency(selectedApp.trade_in_value)}</p></div>
                      {selectedApp.trade_in_lien_amount != null && selectedApp.trade_in_lien_amount > 0 && (
                        <div><Label className="text-gray-500">Lien Amount</Label><p className="font-medium text-red-600">{fmtCurrency(selectedApp.trade_in_lien_amount)}</p></div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── VEHICLE & TRADE-IN TAB ── */}
              <TabsContent value="vehicle" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="w-5 h-5" /> Vehicle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApp.vehicle ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div><Label className="text-gray-500">Vehicle</Label><p className="font-medium text-lg">{selectedApp.vehicle.year} {selectedApp.vehicle.make} {selectedApp.vehicle.model}{selectedApp.vehicle.trim ? ` ${selectedApp.vehicle.trim}` : ""}</p></div>
                        <div><Label className="text-gray-500">Price</Label><p className="font-medium text-lg">{fmtCurrency(selectedApp.vehicle.price)}</p></div>
                        {selectedApp.vehicle.mileage != null && <div><Label className="text-gray-500">Mileage</Label><p className="font-medium">{selectedApp.vehicle.mileage.toLocaleString()} km</p></div>}
                        {selectedApp.vehicle.vin && <div><Label className="text-gray-500">VIN</Label><p className="font-mono text-sm">{selectedApp.vehicle.vin}</p></div>}
                        {selectedApp.vehicle.stock_number && <div><Label className="text-gray-500">Stock #</Label><p className="font-mono text-sm">{selectedApp.vehicle.stock_number}</p></div>}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Car className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Pre-approval — no vehicle selected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Trade-In Details */}
                {selectedApp.trade_ins.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5" /> Trade-In Vehicle{selectedApp.trade_ins.length > 1 ? "s" : ""}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedApp.trade_ins.map(ti => (
                        <div key={ti.id} className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                          <div><Label className="text-gray-500">Vehicle</Label><p className="font-medium">{[ti.year, ti.make, ti.model, ti.trim].filter(Boolean).join(" ") || "—"}</p></div>
                          {ti.vin && <div><Label className="text-gray-500">VIN</Label><p className="font-mono text-sm">{ti.vin}</p></div>}
                          {ti.mileage != null && <div><Label className="text-gray-500">Mileage</Label><p className="font-medium">{ti.mileage.toLocaleString()} km</p></div>}
                          {ti.condition && <div><Label className="text-gray-500">Condition</Label><p className="font-medium capitalize">{ti.condition}</p></div>}
                          {ti.color && <div><Label className="text-gray-500">Color</Label><p className="font-medium capitalize">{ti.color}</p></div>}
                          <div><Label className="text-gray-500">Estimated Value</Label><p className="font-medium text-green-600">{fmtCurrency(ti.estimated_value)}</p></div>
                          {ti.offered_value != null && <div><Label className="text-gray-500">Offered Value</Label><p className="font-medium">{fmtCurrency(ti.offered_value)}</p></div>}
                          {ti.has_lien && (
                            <>
                              <div><Label className="text-gray-500">Lien Holder</Label><p className="font-medium">{ti.lien_holder || "—"}</p></div>
                              <div><Label className="text-gray-500">Lien Amount</Label><p className="font-medium text-red-600">{fmtCurrency(ti.lien_amount)}</p></div>
                            </>
                          )}
                          {ti.net_trade_value != null && <div><Label className="text-gray-500">Net Trade Value</Label><p className="font-medium font-bold">{fmtCurrency(ti.net_trade_value)}</p></div>}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── DOCUMENTS TAB ── */}
              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    {selectedApp.documents?.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No documents uploaded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedApp.documents?.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.document_name}</p>
                                <p className="text-sm text-gray-500 capitalize">{doc.document_type.replaceAll("_", " ")}</p>
                                {doc.file_size && <p className="text-xs text-gray-400">{(doc.file_size / 1024).toFixed(0)} KB</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.is_verified ? (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                  <Clock className="w-3 h-3 mr-1" /> Pending
                                </Badge>
                              )}
                              <Button variant="outline" size="sm" onClick={() => downloadDocument(doc.file_url, doc.document_name)}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── HISTORY TAB ── */}
              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="w-5 h-5" /> Status History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApp.history.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No status changes recorded</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedApp.history.map(h => (
                          <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {h.from_status && <Badge className={statusColors[h.from_status]}>{h.from_status.replaceAll("_", " ")}</Badge>}
                                {h.from_status && <span className="text-gray-400">→</span>}
                                <Badge className={statusColors[h.to_status]}>{h.to_status.replaceAll("_", " ")}</Badge>
                              </div>
                              {h.notes && <p className="text-sm text-gray-600 mt-1">{h.notes}</p>}
                              <p className="text-xs text-gray-400 mt-1">{new Date(h.changed_at).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── ACTIONS TAB ── */}
              <TabsContent value="actions" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Update Status</CardTitle>
                    <CardDescription>Change the application status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1" onClick={() => updateStatus(selectedApp.id, "under_review")} disabled={updating || selectedApp.status === "under_review"}>
                        <Eye className="w-6 h-6 text-yellow-600" /><span>Mark Under Review</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1" onClick={() => updateStatus(selectedApp.id, "approved")} disabled={updating || selectedApp.status === "approved"}>
                        <CheckCircle className="w-6 h-6 text-green-600" /><span>Approve</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1" onClick={() => updateStatus(selectedApp.id, "funded")} disabled={updating || selectedApp.status === "funded"}>
                        <DollarSign className="w-6 h-6 text-purple-600" /><span>Mark Funded</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1 text-red-600 hover:bg-red-50" onClick={() => updateStatus(selectedApp.id, "declined")} disabled={updating || selectedApp.status === "declined"}>
                        <XCircle className="w-6 h-6" /><span>Decline</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Internal Notes</CardTitle>
                    <CardDescription>Private notes visible only to admin staff</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Add internal notes about this application..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      rows={4}
                    />
                    <Button onClick={saveInternalNotes} disabled={savingNotes}>
                      <Save className="w-4 h-4 mr-2" />
                      {savingNotes ? "Saving..." : "Save Notes"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Contact Applicant</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button variant="outline" asChild>
                      <a href={`mailto:${selectedApp.primary_applicant?.email}`}>
                        <Mail className="w-4 h-4 mr-2" /> Send Email
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`tel:${selectedApp.primary_applicant?.phone}`}>
                        <Phone className="w-4 h-4 mr-2" /> Call
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
