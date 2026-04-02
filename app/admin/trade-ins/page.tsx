"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Search, 
  RefreshCw, 
  Car, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowUpDown
} from "lucide-react"

interface TradeInQuote {
  id: string
  quote_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  vehicle_year: number
  vehicle_make: string
  vehicle_model: string
  vehicle_trim: string
  mileage: number
  condition: string
  postal_code: string
  vin: string
  offer_amount: number
  offer_low: number
  offer_high: number
  status: string
  source: string
  created_at: string
  accepted_at: string
  valid_until: string
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  quoted: { label: "Quoted", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  expired: { label: "Expired", variant: "destructive" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export default function AdminTradeInsPage() {
  const [quotes, setQuotes] = useState<TradeInQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedQuote, setSelectedQuote] = useState<TradeInQuote | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const fetchQuotes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/v1/admin/trade-ins")
      if (response.ok) {
        const data = await response.json()
        setQuotes(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching quotes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quote_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${quote.vehicle_year} ${quote.vehicle_make} ${quote.vehicle_model}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === "pending" || q.status === "quoted").length,
    accepted: quotes.filter(q => q.status === "accepted").length,
    totalValue: quotes.filter(q => q.status === "accepted").reduce((sum, q) => sum + (q.offer_amount || 0), 0)
  }

  const updateStatus = async (quoteId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/v1/admin/trade-ins/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        fetchQuotes()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trade-In Quotes</h1>
          <p className="text-muted-foreground">Manage trade-in and ICO requests</p>
        </div>
        <Button onClick={fetchQuotes} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Quotes</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Accepted</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.accepted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value</CardDescription>
            <CardTitle className="text-3xl text-primary">${stats.totalValue.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, quote ID, or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading quotes...
                  </TableCell>
                </TableRow>
              ) : filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No trade-in quotes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-sm">
                      {quote.quote_id?.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{quote.customer_name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{quote.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span>{quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}</span>
                      </div>
                    </TableCell>
                    <TableCell>{quote.mileage?.toLocaleString()} km</TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        ${quote.offer_amount?.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[quote.status]?.variant || "secondary"}>
                        {statusConfig[quote.status]?.label || quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(quote.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedQuote(quote)
                            setIsDetailOpen(true)
                          }}
                        >
                          View
                        </Button>
                        {quote.status === "accepted" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(quote.id, "completed")}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quote Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trade-In Quote Details</DialogTitle>
            <DialogDescription>Quote ID: {selectedQuote?.quote_id}</DialogDescription>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedQuote.customer_name || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${selectedQuote.customer_email}`} className="text-primary hover:underline">
                        {selectedQuote.customer_email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${selectedQuote.customer_phone}`} className="text-primary hover:underline">
                        {selectedQuote.customer_phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedQuote.postal_code}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Vehicle Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">
                      {selectedQuote.vehicle_year} {selectedQuote.vehicle_make} {selectedQuote.vehicle_model}
                    </p>
                    {selectedQuote.vehicle_trim && (
                      <p className="text-sm text-muted-foreground">Trim: {selectedQuote.vehicle_trim}</p>
                    )}
                    <p className="text-sm">Mileage: {selectedQuote.mileage?.toLocaleString()} km</p>
                    <p className="text-sm">Condition: {selectedQuote.condition}</p>
                    {selectedQuote.vin && (
                      <p className="text-sm font-mono">VIN: {selectedQuote.vin}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Offer Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Offer Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Offer Range</p>
                      <p className="text-lg">
                        ${selectedQuote.offer_low?.toLocaleString()} - ${selectedQuote.offer_high?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Accepted Offer</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${selectedQuote.offer_amount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Actions */}
              <div className="flex items-center justify-between">
                <Badge variant={statusConfig[selectedQuote.status]?.variant || "secondary"} className="text-lg px-4 py-1">
                  {statusConfig[selectedQuote.status]?.label || selectedQuote.status}
                </Badge>
                <div className="flex gap-2">
                  {selectedQuote.status === "accepted" && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          updateStatus(selectedQuote.id, "cancelled")
                          setIsDetailOpen(false)
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          updateStatus(selectedQuote.id, "completed")
                          setIsDetailOpen(false)
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Completed
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
