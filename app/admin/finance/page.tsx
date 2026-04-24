"use client"

import { useState, useEffect } from "react"

import { 
  DollarSign, Search, Filter, Download, Eye, CheckCircle, 
  XCircle, Clock, FileText, User, Car, Phone, Mail,
  RefreshCw,
  CreditCard
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

interface FinanceApplication {
  id: string
  application_number: string
  status: string
  agreement_type: string
  created_at: string
  submitted_at: string | null
  requested_amount: number
  down_payment: number
  loan_term_months: number
  payment_frequency: string
  estimated_payment: number
  has_trade_in: boolean
  trade_in_value: number | null
  vehicle: {
    year: number
    make: string
    model: string
    price: number
  } | null
  primary_applicant: {
    first_name: string
    last_name: string
    email: string
    phone: string
    credit_rating: string
  } | null
  documents: {
    id: string
    document_type: string
    document_name: string
    file_url: string
    is_verified: boolean
    uploaded_at: string
  }[]
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

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    funded: 0,
    totalValue: 0
  })

  useEffect(() => {
    fetchApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const url = `/api/v1/admin/finance/applications${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
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

  const downloadDocument = async (pathname: string, fileName: string) => {
    try {
      const res = await fetch(`/api/v1/financing/documents/download?pathname=${encodeURIComponent(pathname)}&admin=true`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
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
          <Button>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading applications...</span>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No applications found</p>
            </div>
          ) : (
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
                          ${app.estimated_payment?.toLocaleString()}/{app.payment_frequency?.replace("_", "-")}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[app.status]}>
                          <span className="flex items-center gap-1">
                            {statusIcons[app.status]}
                            {app.status?.replace("_", " ")}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Application {selectedApp?.application_number}
              <Badge className={statusColors[selectedApp?.status || "draft"]}>
                {selectedApp?.status?.replace("_", " ")}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedApp?.submitted_at ? new Date(selectedApp.submitted_at).toLocaleString() : "Draft"}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents ({selectedApp.documents?.length || 0})</TabsTrigger>
                <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Applicant Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Primary Applicant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Name</Label>
                      <p className="font-medium">
                        {selectedApp.primary_applicant?.first_name} {selectedApp.primary_applicant?.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Credit Rating</Label>
                      <p className="font-medium capitalize">{selectedApp.primary_applicant?.credit_rating || "Unknown"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {selectedApp.primary_applicant?.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Phone</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {selectedApp.primary_applicant?.phone}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Financing Terms */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Financing Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-500">Amount Financed</Label>
                      <p className="font-medium text-lg">${selectedApp.requested_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Down Payment</Label>
                      <p className="font-medium text-lg">${selectedApp.down_payment?.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Term</Label>
                      <p className="font-medium text-lg">{selectedApp.loan_term_months} months</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Payment Frequency</Label>
                      <p className="font-medium capitalize">{selectedApp.payment_frequency?.replace("_", "-")}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Estimated Payment</Label>
                      <p className="font-medium text-lg text-primary">${selectedApp.estimated_payment?.toLocaleString()}</p>
                    </div>
                    {selectedApp.has_trade_in && (
                      <div>
                        <Label className="text-gray-500">Trade-In Value</Label>
                        <p className="font-medium text-lg text-green-600">${selectedApp.trade_in_value?.toLocaleString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

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
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.document_name}</p>
                                <p className="text-sm text-gray-500 capitalize">
                                  {doc.document_type.replaceAll(/_/g, " ")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.is_verified ? (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadDocument(doc.file_url, doc.document_name)}
                              >
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

              <TabsContent value="vehicle" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Vehicle Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApp.vehicle ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-500">Vehicle</Label>
                          <p className="font-medium text-lg">
                            {selectedApp.vehicle.year} {selectedApp.vehicle.make} {selectedApp.vehicle.model}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Price</Label>
                          <p className="font-medium text-lg">${selectedApp.vehicle.price?.toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Car className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Pre-approval application - no vehicle selected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Update Status</CardTitle>
                    <CardDescription>Change the application status and add notes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-1"
                        onClick={() => updateStatus(selectedApp.id, "under_review")}
                        disabled={updating || selectedApp.status === "under_review"}
                      >
                        <Eye className="w-6 h-6 text-yellow-600" />
                        <span>Mark Under Review</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-1"
                        onClick={() => updateStatus(selectedApp.id, "approved")}
                        disabled={updating || selectedApp.status === "approved"}
                      >
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-1"
                        onClick={() => updateStatus(selectedApp.id, "funded")}
                        disabled={updating || selectedApp.status === "funded"}
                      >
                        <DollarSign className="w-6 h-6 text-purple-600" />
                        <span>Mark Funded</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-1 text-red-600 hover:bg-red-50"
                        onClick={() => updateStatus(selectedApp.id, "declined")}
                        disabled={updating || selectedApp.status === "declined"}
                      >
                        <XCircle className="w-6 h-6" />
                        <span>Decline</span>
                      </Button>
                    </div>

                    <div className="pt-4 border-t">
                      <Label>Internal Notes</Label>
                      <Textarea
                        placeholder="Add internal notes about this application..."
                        className="mt-2"
                      />
                      <Button className="mt-2" disabled={updating}>
                        Save Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Contact Applicant</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button variant="outline" asChild>
                      <a href={`mailto:${selectedApp.primary_applicant?.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`tel:${selectedApp.primary_applicant?.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
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
