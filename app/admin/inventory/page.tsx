"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  Plus, Search, MoreVertical, Edit, Trash2, Eye,
  Download, Upload, ChevronLeft, ChevronRight, CheckCircle,
  Clock, AlertCircle, Car, RefreshCw, Loader2, X,
  Scan, ImagePlus, ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { VehicleRow } from "@/types/supabase"

// ─── Types ────────────────────────────────────────────────────────────────

interface VehiclesResponse {
  vehicles: VehicleRow[]
  total: number
  totalVehicles: number
  statusCounts: { available: number; reserved: number; pending: number; sold: number }
  limit: number
  offset: number
}

interface SyncStatus {
  configured: boolean
  lastSyncEstimate: string | null
  cronSchedule: string
  cronDescription: string
}

interface VinDecodeResult {
  vin: string
  year: string
  make: string
  model: string
  trim: string
  body_style: string
  drivetrain: string
  transmission: string
  engine: string
  fuel_type: string
  is_ev: string
  doors: string
  battery_capacity_kwh?: string
  range_miles?: string
  decode_error?: string
}

type VehicleFormData = {
  stock_number: string
  vin: string
  year: string
  make: string
  model: string
  trim: string
  body_style: string
  exterior_color: string
  interior_color: string
  price: string
  msrp: string
  mileage: string
  drivetrain: string
  transmission: string
  engine: string
  fuel_type: string
  is_ev: boolean
  battery_capacity_kwh: string
  range_miles: string
  status: string
  is_certified: boolean
  is_new_arrival: boolean
  featured: boolean
  has_360_spin: boolean
  location: string
  primary_image_url: string
  video_url: string
}

const EMPTY_FORM: VehicleFormData = {
  stock_number: "", vin: "", year: "", make: "", model: "", trim: "",
  body_style: "", exterior_color: "", interior_color: "",
  price: "", msrp: "", mileage: "",
  drivetrain: "", transmission: "", engine: "", fuel_type: "",
  is_ev: false, battery_capacity_kwh: "", range_miles: "",
  status: "available", is_certified: false, is_new_arrival: true,
  featured: false, has_360_spin: false, location: "Richmond Hill, ON",
  primary_image_url: "", video_url: "",
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function statusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "available": return "default"
    case "reserved": return "secondary"
    case "pending": return "outline"
    case "sold": return "destructive"
    default: return "outline"
  }
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function formatPrice(cents: number): string {
  return "$" + Math.round(cents / 100).toLocaleString()
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function AdminInventoryPage() {
  // Data state
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState({ available: 0, reserved: 0, pending: 0, sold: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  // UI state
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState<"create" | "edit" | null>(null)
  const [editingVehicle, setEditingVehicle] = useState<VehicleRow | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [decoding, setDecoding] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<VehicleRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  // CSV import state
  const [importingCSV, setImportingCSV] = useState(false)
  const [csvResult, setCsvResult] = useState<string | null>(null)

  // Debounced search — must be declared before fetchVehicles so it can close over debouncedSearch
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // ─── Data fetching ────────────────────────────────────────────────────

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        sort: "updated_at",
        order: "desc",
      })
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter !== "all") params.set("status", statusFilter)

      const res = await fetch(`/api/v1/admin/vehicles?${params}`)
      if (!res.ok) {
        setError("Failed to load vehicles")
        return
      }
      const data: VehiclesResponse = await res.json()
      setVehicles(data.vehicles)
      setTotal(data.total)
      setStatusCounts(data.statusCounts)
    } catch (err) {
      console.error("Failed to fetch vehicles:", err)
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  // Fetch sync status on mount
  useEffect(() => {
    fetch("/api/v1/admin/vehicles/homenet-sync")
      .then(r => r.json())
      .then(setSyncStatus)
      .catch(() => {})
  }, [])

  // ─── VIN Decode ───────────────────────────────────────────────────────

  const decodeVin = async () => {
    const vin = formData.vin.trim().toUpperCase()
    if (vin.length !== 17) { setFormError("VIN must be 17 characters"); return }
    setDecoding(true)
    setFormError("")
    try {
      const res = await fetch(`/api/v1/admin/vehicles/vin-decode?vin=${vin}`)
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || "VIN decode failed"); return }
      const d: VinDecodeResult = data.decoded
      setFormData(prev => ({
        ...prev,
        vin: d.vin || prev.vin,
        year: d.year || prev.year,
        make: d.make || prev.make,
        model: d.model || prev.model,
        trim: d.trim || prev.trim,
        body_style: d.body_style || prev.body_style,
        drivetrain: d.drivetrain || prev.drivetrain,
        transmission: d.transmission || prev.transmission,
        engine: d.engine || prev.engine,
        fuel_type: d.fuel_type || prev.fuel_type,
        is_ev: d.is_ev === "true",
        battery_capacity_kwh: d.battery_capacity_kwh || prev.battery_capacity_kwh,
        range_miles: d.range_miles || prev.range_miles,
      }))
      if (d.decode_error) setFormError(`Partial decode: ${d.decode_error}`)
    } catch {
      setFormError("Network error decoding VIN")
    } finally {
      setDecoding(false)
    }
  }

  // ─── CRUD Handlers ────────────────────────────────────────────────────

  const openCreate = () => {
    setFormData(EMPTY_FORM)
    setFormError("")
    setEditingVehicle(null)
    setShowDialog("create")
  }

  const openEdit = (v: VehicleRow) => {
    setEditingVehicle(v)
    setFormData({
      stock_number: v.stock_number,
      vin: v.vin,
      year: String(v.year),
      make: v.make,
      model: v.model,
      trim: v.trim || "",
      body_style: v.body_style || "",
      exterior_color: v.exterior_color || "",
      interior_color: v.interior_color || "",
      price: String(Math.round(v.price / 100)),
      msrp: v.msrp ? String(Math.round(v.msrp / 100)) : "",
      mileage: String(v.mileage),
      drivetrain: v.drivetrain || "",
      transmission: v.transmission || "",
      engine: v.engine || "",
      fuel_type: v.fuel_type || "",
      is_ev: v.is_ev,
      battery_capacity_kwh: v.battery_capacity_kwh ? String(v.battery_capacity_kwh) : "",
      range_miles: v.range_miles ? String(v.range_miles) : "",
      status: v.status,
      is_certified: v.is_certified,
      is_new_arrival: v.is_new_arrival,
      featured: v.featured,
      has_360_spin: v.has_360_spin,
      location: v.location || "Richmond Hill, ON",
      primary_image_url: v.primary_image_url || "",
      video_url: v.video_url || "",
    })
    setFormError("")
    setShowDialog("edit")
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError("")

    // Build payload — prices stored as cents in DB
    const payload = {
      ...formData,
      year: parseInt(formData.year),
      price: parseInt(formData.price) * 100,
      msrp: formData.msrp ? parseInt(formData.msrp) * 100 : null,
      mileage: parseInt(formData.mileage),
      battery_capacity_kwh: formData.battery_capacity_kwh ? parseFloat(formData.battery_capacity_kwh) : null,
      range_miles: formData.range_miles ? parseInt(formData.range_miles) : null,
      primary_image_url: formData.primary_image_url || null,
      video_url: formData.video_url || null,
    }

    try {
      let res: Response
      if (showDialog === "edit" && editingVehicle) {
        res = await fetch(`/api/v1/admin/vehicles/${editingVehicle.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/v1/admin/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || "Save failed")
        return
      }

      setShowDialog(null)
      fetchVehicles()
    } catch {
      setFormError("Network error saving vehicle")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/admin/vehicles/${deleteConfirm.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteConfirm(null)
        fetchVehicles()
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  // ─── HomeNet Sync ─────────────────────────────────────────────────────

  const triggerSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/v1/admin/vehicles/homenet-sync", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setSyncResult(`Synced ${data.vehiclesParsed || 0} vehicles (${data.inserted || 0} new, ${data.updated || 0} updated)`)
        fetchVehicles()
      } else {
        setSyncResult(`Sync failed: ${data.error || "Unknown error"}`)
      }
    } catch {
      setSyncResult("Network error during sync")
    } finally {
      setSyncing(false)
    }
  }

  // ─── CSV Import ───────────────────────────────────────────────────────

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportingCSV(true)
    setCsvResult(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/v1/inventory/import", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok) {
        setCsvResult(`Imported ${data.imported} vehicles${data.errors?.length ? ` (${data.errors.length} errors)` : ""}`)
        fetchVehicles()
      } else {
        setCsvResult(`Import failed: ${data.error}`)
      }
    } catch {
      setCsvResult("Network error during import")
    } finally {
      setImportingCSV(false)
      e.target.value = ""
    }
  }

  // ─── CSV Export ───────────────────────────────────────────────────────

  const handleCSVExport = async () => {
    // Fetch ALL vehicles (not just current page) for a full inventory export
    const allVehicles: VehicleRow[] = []
    let offset = 0
    const batchSize = 200 // API max per request
    try {
      while (true) {
        const params = new URLSearchParams({ limit: String(batchSize), offset: String(offset), sort: "updated_at", order: "desc" })
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (statusFilter !== "all") params.set("status", statusFilter)
        const res = await fetch(`/api/v1/admin/vehicles?${params}`)
        if (!res.ok) break
        const data: VehiclesResponse = await res.json()
        allVehicles.push(...data.vehicles)
        if (allVehicles.length >= data.total || data.vehicles.length < batchSize) break
        offset += batchSize
      }
    } catch {
      // Fall back to current page only if no batches succeeded
      if (allVehicles.length === 0) {
        allVehicles.push(...vehicles)
      }
    }

    const headers = ["stock_number","vin","year","make","model","trim","price","mileage","status","exterior_color","drivetrain","fuel_type"]
    const rows = allVehicles.map(v => [
      v.stock_number, v.vin, v.year, v.make, v.model, v.trim || "",
      Math.round(v.price / 100), v.mileage, v.status, v.exterior_color || "",
      v.drivetrain || "", v.fuel_type || ""
    ])
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `planet-motors-inventory-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Pagination ───────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const toggleSelectAll = () => {
    const allCurrentSelected = vehicles.length > 0 && vehicles.every(v => selectedVehicles.includes(v.id))
    if (allCurrentSelected) setSelectedVehicles(prev => prev.filter(id => !vehicles.some(v => v.id === id)))
    else setSelectedVehicles(prev => [...new Set([...prev, ...vehicles.map(v => v.id)])])
  }
  const toggleSelect = (id: string) => {
    setSelectedVehicles(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  }

  // ─── Render ───────────────────────────────────────────────────────────

  const totalAll = statusCounts.available + statusCounts.reserved + statusCounts.pending + statusCounts.sold

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-500">{totalAll} vehicles in inventory</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* HomeNet Sync */}
          <Button variant="outline" onClick={triggerSync} disabled={syncing} title="Trigger HomeNet sync">
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync HomeNet"}
          </Button>
          {/* CSV Import */}
          <label>
            <Button variant="outline" asChild>
              <span>
                {importingCSV ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Import CSV
              </span>
            </Button>
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVImport} disabled={importingCSV} />
          </label>
          {/* CSV Export */}
          <Button variant="outline" onClick={handleCSVExport} disabled={vehicles.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {/* Add Vehicle */}
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Sync / Import feedback */}
      {syncResult && (
        <div className={`p-3 rounded-lg text-sm ${syncResult.includes("failed") || syncResult.includes("error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {syncResult}
          <button onClick={() => setSyncResult(null)} className="ml-2 font-bold">&times;</button>
        </div>
      )}
      {csvResult && (
        <div className={`p-3 rounded-lg text-sm ${csvResult.includes("failed") || csvResult.includes("error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {csvResult}
          <button onClick={() => setCsvResult(null)} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* HomeNet Status Banner */}
      {syncStatus && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${syncStatus.configured ? "bg-green-500" : "bg-yellow-500"}`} />
                <span className="text-gray-600">
                  HomeNet SFTP: {syncStatus.configured ? "Connected" : "Not configured"}
                </span>
                {syncStatus.lastSyncEstimate && (
                  <span className="text-gray-400">
                    &middot; Last update: {new Date(syncStatus.lastSyncEstimate).toLocaleString()}
                  </span>
                )}
              </div>
              <span className="text-gray-400">Auto-sync: {syncStatus.cronDescription}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.available}</p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.reserved}</p>
                <p className="text-sm text-gray-500">Reserved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.sold}</p>
                <p className="text-sm text-gray-500">Sold</p>
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
                aria-label="Search inventory by make, model, trim, VIN, or stock number"
                placeholder="Search by make, model, trim, VIN, stock #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center p-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">{error}</p>
              <Button variant="outline" onClick={fetchVehicles} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No vehicles found</p>
              <p className="text-sm">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Click \"Add Vehicle\" or trigger a HomeNet sync to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-3 px-4 text-left">
                        <input
                          type="checkbox"
                          checked={vehicles.length > 0 && vehicles.every(v => selectedVehicles.includes(v.id))}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Vehicle</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Stock #</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Price</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Mileage</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-center font-medium text-gray-500">360°</th>
                      <th className="py-3 px-4 text-center font-medium text-gray-500">Days</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedVehicles.includes(vehicle.id)}
                            onChange={() => toggleSelect(vehicle.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {vehicle.primary_image_url ? (
                              <Image
                                src={vehicle.primary_image_url}
                                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                width={80}
                                height={60}
                                className="rounded object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-20 h-[60px] bg-gray-100 rounded flex items-center justify-center">
                                <ImagePlus className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </p>
                              <p className="text-sm text-gray-500">{vehicle.trim}</p>
                              <p className="text-xs text-gray-400 font-mono">{vehicle.vin}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{vehicle.stock_number}</td>
                        <td className="py-3 px-4 font-medium">{formatPrice(vehicle.price)}</td>
                        <td className="py-3 px-4 text-sm">{vehicle.mileage.toLocaleString()} km</td>
                        <td className="py-3 px-4">
                          <Badge variant={statusBadgeVariant(vehicle.status)}>
                            {vehicle.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {vehicle.has_360_spin ? (
                            <span className="text-green-600 text-sm font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-300 text-sm">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={daysAgo(vehicle.created_at) > 30 ? "text-red-600 font-medium" : ""}>
                            {daysAgo(vehicle.created_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={`/vehicles/${vehicle.id}`} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View on Site
                                  <ExternalLink className="w-3 h-3 ml-auto" />
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(vehicle)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Vehicle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteConfirm(vehicle)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} vehicles
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page + 1} of {totalPages || 1}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedVehicles.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm">{selectedVehicles.length} selected</span>
          <Button size="sm" variant="secondary">Update Status</Button>
          <Button size="sm" variant="destructive" disabled title="Bulk delete coming soon">Delete</Button>
          <button
            onClick={() => setSelectedVehicles([])}
            className="text-gray-400 hover:text-white ml-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ─── Create/Edit Vehicle Dialog ─────────────────────────────────── */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 mb-8">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {showDialog === "create" ? "Add New Vehicle" : `Edit ${editingVehicle?.year} ${editingVehicle?.make} ${editingVehicle?.model}`}
              </h2>
              <button onClick={() => setShowDialog(null)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{formError}</div>
              )}

              {/* VIN Section */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Scan className="w-4 h-4" /> VIN Decoder
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 17-character VIN"
                    value={formData.vin}
                    onChange={e => setFormData(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                    maxLength={17}
                    className="font-mono flex-1"
                  />
                  <Button variant="outline" onClick={decodeVin} disabled={decoding || formData.vin.length !== 17}>
                    {decoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                    <span className="ml-2">Decode</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Enter VIN and click Decode to auto-fill vehicle details from NHTSA</p>
              </div>

              {/* Identity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Stock Number *</label>
                  <Input value={formData.stock_number} onChange={e => setFormData(prev => ({ ...prev, stock_number: e.target.value }))} placeholder="PM-2024-001" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Year *</label>
                    <Input type="number" value={formData.year} onChange={e => setFormData(prev => ({ ...prev, year: e.target.value }))} placeholder="2024" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Make *</label>
                    <Input value={formData.make} onChange={e => setFormData(prev => ({ ...prev, make: e.target.value }))} placeholder="Tesla" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Model *</label>
                    <Input value={formData.model} onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))} placeholder="Model 3" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Trim</label>
                    <Input value={formData.trim} onChange={e => setFormData(prev => ({ ...prev, trim: e.target.value }))} placeholder="Long Range" />
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Specifications</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Body Style</label>
                    <Input value={formData.body_style} onChange={e => setFormData(prev => ({ ...prev, body_style: e.target.value }))} placeholder="Sedan" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Drivetrain</label>
                    <Input value={formData.drivetrain} onChange={e => setFormData(prev => ({ ...prev, drivetrain: e.target.value }))} placeholder="AWD" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Transmission</label>
                    <Input value={formData.transmission} onChange={e => setFormData(prev => ({ ...prev, transmission: e.target.value }))} placeholder="Automatic" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Engine</label>
                    <Input value={formData.engine} onChange={e => setFormData(prev => ({ ...prev, engine: e.target.value }))} placeholder="Electric Motor" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fuel Type</label>
                    <Input value={formData.fuel_type} onChange={e => setFormData(prev => ({ ...prev, fuel_type: e.target.value }))} placeholder="Electric" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ext. Color</label>
                    <Input value={formData.exterior_color} onChange={e => setFormData(prev => ({ ...prev, exterior_color: e.target.value }))} placeholder="White" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Int. Color</label>
                    <Input value={formData.interior_color} onChange={e => setFormData(prev => ({ ...prev, interior_color: e.target.value }))} placeholder="Black" />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Pricing & Mileage</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Price (CAD) *</label>
                    <Input type="number" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="39990" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">MSRP (CAD)</label>
                    <Input type="number" value={formData.msrp} onChange={e => setFormData(prev => ({ ...prev, msrp: e.target.value }))} placeholder="45990" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Mileage (km) *</label>
                    <Input type="number" value={formData.mileage} onChange={e => setFormData(prev => ({ ...prev, mileage: e.target.value }))} placeholder="15000" />
                  </div>
                </div>
              </div>

              {/* EV Fields */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">EV / Electric</h3>
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.is_ev} onChange={e => setFormData(prev => ({ ...prev, is_ev: e.target.checked }))} className="rounded" />
                    <span className="text-sm">Electric Vehicle</span>
                  </label>
                </div>
                {formData.is_ev && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Battery (kWh)</label>
                      <Input type="number" step="0.1" value={formData.battery_capacity_kwh} onChange={e => setFormData(prev => ({ ...prev, battery_capacity_kwh: e.target.value }))} placeholder="75" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Range (miles)</label>
                      <Input type="number" value={formData.range_miles} onChange={e => setFormData(prev => ({ ...prev, range_miles: e.target.value }))} placeholder="358" />
                    </div>
                  </div>
                )}
              </div>

              {/* Flags */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Flags</h3>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.is_certified} onChange={e => setFormData(prev => ({ ...prev, is_certified: e.target.checked }))} className="rounded" />
                    <span className="text-sm">PM Certified</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.is_new_arrival} onChange={e => setFormData(prev => ({ ...prev, is_new_arrival: e.target.checked }))} className="rounded" />
                    <span className="text-sm">New Arrival</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.featured} onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))} className="rounded" />
                    <span className="text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.has_360_spin} onChange={e => setFormData(prev => ({ ...prev, has_360_spin: e.target.checked }))} className="rounded" />
                    <span className="text-sm">Has 360° Spin</span>
                  </label>
                </div>
              </div>

              {/* Media */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Media</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Primary Image URL</label>
                    <Input value={formData.primary_image_url} onChange={e => setFormData(prev => ({ ...prev, primary_image_url: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Video URL</label>
                    <Input value={formData.video_url} onChange={e => setFormData(prev => ({ ...prev, video_url: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <Input value={formData.location} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} placeholder="Richmond Hill, ON" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setShowDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {showDialog === "create" ? "Create Vehicle" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Vehicle?</h2>
            <p className="text-gray-600 mb-4">
              This will permanently delete <strong>{deleteConfirm.year} {deleteConfirm.make} {deleteConfirm.model}</strong> ({deleteConfirm.vin}).
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
