"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  CalendarCheck, RefreshCw, DollarSign, Clock, Ban,
  CheckCircle2, Mail, Phone, Car, User
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Vehicle {
  year: number
  make: string
  model: string
  trim: string | null
  price: number
  stock_number: string
  primary_image_url: string | null
}

interface Reservation {
  id: string
  vehicle_id: string
  customer_email: string
  customer_phone: string | null
  customer_name: string | null
  status: string
  deposit_amount: number
  deposit_status: string
  stripe_payment_intent_id: string | null
  expires_at: string
  notes: string | null
  created_at: string
  updated_at: string
  vehicle: Vehicle | null
}

interface ReservationStats {
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  totalDeposits: number
}

function statusBadge(status: string): { variant: "default" | "secondary" | "outline" | "destructive"; label: string } {
  switch (status) {
    case "pending": return { variant: "secondary", label: "Pending" }
    case "confirmed": return { variant: "default", label: "Confirmed" }
    case "completed": return { variant: "outline", label: "Completed" }
    case "cancelled": return { variant: "destructive", label: "Cancelled" }
    case "expired": return { variant: "destructive", label: "Expired" }
    default: return { variant: "secondary", label: status }
  }
}

function depositBadge(status: string): { color: string; label: string } {
  switch (status) {
    case "paid": return { color: "bg-green-100 text-green-700", label: "Paid" }
    case "pending": return { color: "bg-yellow-100 text-yellow-700", label: "Pending" }
    case "refunded": return { color: "bg-blue-100 text-blue-700", label: "Refunded" }
    case "failed": return { color: "bg-red-100 text-red-700", label: "Failed" }
    default: return { color: "bg-gray-100 text-gray-700", label: status }
  }
}

// deposit_amount and vehicle.price are stored in cents; render as dollars
function formatCents(cents: number | null | undefined): string {
  return "$" + Math.round((cents || 0) / 100).toLocaleString()
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

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState<ReservationStats>({ pending: 0, confirmed: 0, completed: 0, cancelled: 0, totalDeposits: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null)

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/v1/admin/reservations?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setReservations(data.reservations || [])
      setStats(data.stats || { pending: 0, confirmed: 0, completed: 0, cancelled: 0, totalDeposits: 0 })
    } catch (err) {
      console.error("Reservations fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchReservations() }, [fetchReservations])

  const updateStatus = async (resId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/v1/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resId, status: newStatus }),
      })
      if (res.ok) {
        fetchReservations()
      }
    } catch (err) {
      console.error("Status update error:", err)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations & Deposits</h1>
          <p className="text-sm text-gray-500">Track vehicle reservations and deposit payments</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReservations}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-xs text-gray-500">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarCheck className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Ban className="w-5 h-5 mx-auto mb-1 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-2xl font-bold text-emerald-600">${stats.totalDeposits.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Deposits</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "pending", "confirmed", "completed", "cancelled", "expired"].map(s => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Reservations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <Card><CardContent className="p-8 text-center text-gray-500">Loading reservations...</CardContent></Card>
          ) : reservations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No reservations found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reservations.map(res => {
                const sb = statusBadge(res.status)
                const db = depositBadge(res.deposit_status)
                return (
                  <Card
                    key={res.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${selectedRes?.id === res.id ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => setSelectedRes(res)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {res.vehicle?.primary_image_url ? (
                            <Image src={res.vehicle.primary_image_url} alt="" width={64} height={48} className="w-16 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <Car className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {res.vehicle ? `${res.vehicle.year} ${res.vehicle.make} ${res.vehicle.model}` : "Vehicle"}
                            </p>
                            <p className="text-xs text-gray-500">{res.customer_name || res.customer_email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={sb.variant} className="text-xs">{sb.label}</Badge>
                              <span className={`text-xs px-2 py-0.5 rounded ${db.color}`}>{formatCents(res.deposit_amount)} — {db.label}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">{timeAgo(res.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <Card className="h-fit">
          {selectedRes ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedRes.vehicle ? `${selectedRes.vehicle.year} ${selectedRes.vehicle.make} ${selectedRes.vehicle.model}` : "Reservation Details"}
                </CardTitle>
                {selectedRes.vehicle && (
                  <CardDescription>Stock #{selectedRes.vehicle.stock_number} — {formatCents(selectedRes.vehicle.price)}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    {selectedRes.customer_name || "No name"}
                  </div>
                  <a href={`mailto:${selectedRes.customer_email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Mail className="w-4 h-4" />
                    {selectedRes.customer_email}
                  </a>
                  {selectedRes.customer_phone && (
                    <a href={`tel:${selectedRes.customer_phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Phone className="w-4 h-4" />
                      {selectedRes.customer_phone}
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Deposit</p>
                    <p className="font-medium">{formatCents(selectedRes.deposit_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Deposit Status</p>
                    <span className={`text-xs px-2 py-1 rounded ${depositBadge(selectedRes.deposit_status).color}`}>
                      {selectedRes.deposit_status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Expires</p>
                    <p className="text-sm">{new Date(selectedRes.expires_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Created</p>
                    <p className="text-sm">{new Date(selectedRes.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedRes.stripe_payment_intent_id && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Stripe Payment</p>
                    <p className="text-xs font-mono text-gray-600 truncate">{selectedRes.stripe_payment_intent_id}</p>
                  </div>
                )}

                {selectedRes.notes && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{selectedRes.notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "confirmed", "completed", "cancelled"].map(s => (
                      <Button
                        key={s}
                        variant={selectedRes.status === s ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => updateStatus(selectedRes.id, s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-8 text-center text-gray-500">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Select a reservation to view details</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
