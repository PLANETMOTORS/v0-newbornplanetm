"use client"

import { useState, useEffect } from "react"
import { 
  Search, Phone, Mail, MessageSquare,
  User, Car
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const leadsData = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "416-985-2277",
    type: "Finance Application",
    vehicle: "2024 Tesla Model Y Long Range AWD",
    vehicleId: "2024-tesla-model-y",
    status: "new",
    source: "Website",
    createdAt: "2026-03-28T10:30:00",
    notes: "Looking for low down payment options"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "416-985-2277",
    type: "Trade-In Request",
    vehicle: "2024 BMW M4 Competition",
    vehicleId: "2024-bmw-m4",
    status: "contacted",
    source: "Phone",
    createdAt: "2026-03-28T09:15:00",
    notes: "Has 2020 Mercedes C300 to trade"
  },
  {
    id: 3,
    name: "Mike Brown",
    email: "mike.brown@example.com",
    phone: "416-985-2277",
    type: "Test Drive",
    vehicle: "2024 Porsche Taycan 4S",
    vehicleId: "2024-porsche-taycan",
    status: "new",
    source: "Website",
    createdAt: "2026-03-28T08:45:00",
    notes: "Available weekends only"
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.d@example.com",
    phone: "416-985-2277",
    type: "Reservation",
    vehicle: "2023 Mercedes EQS 580",
    vehicleId: "2023-mercedes-eqs",
    status: "pending",
    source: "Chat",
    createdAt: "2026-03-28T07:30:00",
    notes: "Wants to pay full amount"
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david.w@example.com",
    phone: "416-985-2277",
    type: "General Inquiry",
    vehicle: "2024 Ford F-150 Lightning",
    vehicleId: "2024-ford-f150",
    status: "qualified",
    source: "Referral",
    createdAt: "2026-03-27T16:20:00",
    notes: "Referred by John Smith"
  },
]

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  pending: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-800",
  lost: "bg-red-100 text-red-800",
}

/**
 * Renders the Lead Management admin page with searchable and filterable lead list and a sticky details sidebar.
 *
 * Displays stats, a search input, status and type filters, a list of leads derived from local mock data, and a details panel for the selected lead. The lead list supports selecting a lead to view contact info, interest, notes, and status update controls.
 *
 * @returns The Lead Management page rendered as JSX elements
 */
export default function AdminLeadsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedLead, setSelectedLead] = useState<typeof leadsData[0] | null>(null)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const filteredLeads = leadsData.filter(lead => {
    const matchesSearch = `${lead.name} ${lead.email} ${lead.vehicle}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    const matchesType = typeFilter === "all" || lead.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const formatDate = (dateString: string) => {
    if (!isMounted) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-500">{leadsData.length} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Export Leads</Button>
          <Button>Add Lead Manually</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "New", count: 23, color: "blue" },
          { label: "Contacted", count: 34, color: "yellow" },
          { label: "Qualified", count: 18, color: "green" },
          { label: "Pending", count: 12, color: "purple" },
          { label: "Closed", count: 45, color: "gray" },
        ].map((stat) => (
          <Card key={stat.label} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stat.count}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                aria-label="Search leads by name, email, or vehicle"
                placeholder="Search by name, email, vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="Finance Application">Finance</option>
              <option value="Trade-In Request">Trade-In</option>
              <option value="Test Drive">Test Drive</option>
              <option value="Reservation">Reservation</option>
              <option value="General Inquiry">General</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredLeads.map((lead) => (
            <Card 
              key={lead.id} 
              className={`cursor-pointer transition-all ${
                selectedLead?.id === lead.id ? "ring-2 ring-blue-500" : "hover:shadow-md"
              }`}
              onClick={() => setSelectedLead(lead)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {lead.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{lead.name}</h3>
                        <Badge className={statusColors[lead.status]}>
                          {lead.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{lead.type}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Car className="w-3 h-3" />
                        {lead.vehicle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDate(lead.createdAt)}</p>
                    <p className="text-xs text-gray-400 mt-1">via {lead.source}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lead Details Sidebar */}
        <div className="lg:col-span-1">
          {selectedLead ? (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Lead Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                    {selectedLead.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h3 className="font-semibold text-lg">{selectedLead.name}</h3>
                  <Badge className={statusColors[selectedLead.status]}>
                    {selectedLead.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <a 
                    href={`mailto:${selectedLead.email}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{selectedLead.email}</span>
                  </a>
                  <a 
                    href={`tel:${selectedLead.phone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{selectedLead.phone}</span>
                  </a>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Interest</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{selectedLead.type}</p>
                    <p className="text-sm text-gray-600">{selectedLead.vehicle}</p>
                  </div>
                </div>

                {selectedLead.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedLead.notes}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Button className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Update Status</h4>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed - Won</option>
                    <option value="lost">Closed - Lost</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a lead to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
