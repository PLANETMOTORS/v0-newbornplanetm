"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, FileText, RefreshCw, ChevronLeft, ChevronRight,
  DollarSign, Clock, CheckCircle, XCircle, Truck, CreditCard,
  User, Car
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface OrderCustomer {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

interface OrderVehicle {
  id: string
  year: number
  make: string
  model: string
  trim: string
  price: number
  stockNumber: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  deliveryType: string
  vehiclePriceCents: number
  totalPriceCents: number
  taxAmountCents: number
  downPaymentCents: number
  createdAt: string
  updatedAt: string | null
  customer: OrderCustomer | null
  vehicle: OrderVehicle | null
}

interface OrderStats {
  total: number
  created: number
  processing: number
  delivered: number
  cancelled: number
  totalRevenue: number
}

// Order statuses per schema: created, confirmed, processing, ready_for_delivery, in_transit, delivered, cancelled, refunded
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  created: { label: "Created", color: "bg-blue-100 text-blue-800", icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed: { label: "Confirmed", color: "bg-cyan-100 text-cyan-800", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  processing: { label: "Processing", color: "bg-yellow-100 text-yellow-800", icon: <FileText className="w-3.5 h-3.5" /> },
  ready_for_delivery: { label: "Ready", color: "bg-purple-100 text-purple-800", icon: <Car className="w-3.5 h-3.5" /> },
  in_transit: { label: "In Transit", color: "bg-indigo-100 text-indigo-800", icon: <Truck className="w-3.5 h-3.5" /> },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: <XCircle className="w-3.5 h-3.5" /> },
  refunded: { label: "Refunded", color: "bg-orange-100 text-orange-800", icon: <CreditCard className="w-3.5 h-3.5" /> },
}

const PAGE_SIZE = 20

/**
 * Format an amount expressed in cents as a Canadian dollar currency string with no fractional digits.
 *
 * @param cents - Amount in cents (for example, `12345` represents $123.45)
 * @returns The amount formatted as a CAD currency string with no fractional digits (for example, `CA$1,234`)
 */
function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/**
 * Admin page for browsing, filtering, and inspecting paginated orders.
 *
 * Renders summary statistics, a searchable and status-filterable orders table with pagination, and a read-only order detail dialog. Fetches pages from /api/v1/admin/orders (supports `limit`/`offset`, `status`, and `search`), shows loading/error/empty states, and provides a manual refresh action.
 *
 * @returns The page's JSX element containing the orders management UI.
 */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({ total: 0, created: 0, processing: 0, delivered: 0, cancelled: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (debouncedSearch) params.set("search", debouncedSearch)

      const res = await fetch(`/api/v1/admin/orders?${params}`)
      if (!res.ok) {
        setError("Failed to load orders")
        return
      }
      const data = await res.json()
      setOrders(data.orders || [])
      setStats(prev => data.stats ?? prev)
      setTotalCount(data.total ?? 0)
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, debouncedSearch])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const formatDate = (dateString: string | null) => {
    if (!isMounted || !dateString) return ""
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: null }
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">Order Management</h1>
          <p className="text-gray-500">{stats.total} total orders</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.created}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.processing}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Delivered</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.delivered}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl text-gray-900">{formatCents(stats.totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                aria-label="Search orders by order number"
                placeholder="Search by order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(0) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready_for_delivery">Ready for Delivery</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {(() => {
            if (loading) {
              return (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading orders...</span>
                </div>
              )
            }
            if (error) {
              return (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <XCircle className="w-12 h-12 mb-4 text-red-300" />
                  <p className="text-lg font-medium text-red-600">{error}</p>
                  <Button variant="outline" onClick={fetchOrders} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )
            }
            if (orders.length === 0) {
              const emptyHint = debouncedSearch || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Orders will appear here when customers purchase vehicles"
              return (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No orders found</p>
                  <p className="text-sm">{emptyHint}</p>
                </div>
              )
            }
            return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => { setSelectedOrder(order); setDetailOpen(true) }}
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                    </TableCell>
                    <TableCell>
                      {order.customer ? (
                        <div>
                          <p className="font-medium text-sm">
                            {order.customer.firstName || order.customer.lastName
                              ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()
                              : order.customer.email}
                          </p>
                          <p className="text-xs text-gray-500">{order.customer.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.vehicle ? (
                        <div>
                          <p className="font-medium text-sm">
                            {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                          </p>
                          <p className="text-xs text-gray-500">{order.vehicle.trim}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {order.paymentMethod.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCents(order.totalPriceCents)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )
          })()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedOrder.status)}
                <Badge variant="outline" className="capitalize">
                  {selectedOrder.paymentMethod.replaceAll("_", " ")}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedOrder.deliveryType}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer
                </h3>
                {selectedOrder.customer ? (
                  <div className="space-y-1">
                    <p className="font-medium">
                      {selectedOrder.customer.firstName || selectedOrder.customer.lastName
                        ? `${selectedOrder.customer.firstName || ""} ${selectedOrder.customer.lastName || ""}`.trim()
                        : "No name on file"}
                    </p>
                    <p className="text-sm text-gray-600">{selectedOrder.customer.email}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">Customer data unavailable</p>
                )}
              </div>

              {/* Vehicle Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <Car className="w-4 h-4" /> Vehicle
                </h3>
                {selectedOrder.vehicle ? (
                  <div className="space-y-1">
                    <p className="font-medium">
                      {selectedOrder.vehicle.year} {selectedOrder.vehicle.make} {selectedOrder.vehicle.model}
                    </p>
                    <p className="text-sm text-gray-600">{selectedOrder.vehicle.trim}</p>
                    <p className="text-sm text-gray-500">Stock #: {selectedOrder.vehicle.stockNumber}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">Vehicle data unavailable</p>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Pricing
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle Price</span>
                    <span>{formatCents(selectedOrder.vehiclePriceCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatCents(selectedOrder.taxAmountCents)}</span>
                  </div>
                  {selectedOrder.downPaymentCents > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Down Payment</span>
                      <span>-{formatCents(selectedOrder.downPaymentCents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatCents(selectedOrder.totalPriceCents)}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Created: {formatDate(selectedOrder.createdAt)}
                {selectedOrder.updatedAt && ` • Updated: ${formatDate(selectedOrder.updatedAt)}`}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
