"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye,
  Download, Upload, ChevronLeft, ChevronRight, CheckCircle,
  Clock, AlertCircle, Car, X, Loader2, Save
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

// ─── Types ──────────────────────────────────────────────────────────────────
interface Vehicle {
  id: string
  stock_number: string
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  body_style: string | null
  exterior_color: string | null
  interior_color: string | null
  price: number        // cents in DB
  msrp: number | null  // cents in DB
  mileage: number
  drivetrain: string | null
  transmission: string | null
  engine: string | null
  fuel_type: string | null
  status: string
  is_certified: boolean
  is_new_arrival: boolean
  featured: boolean
  primary_image_url: string | null
  created_at: string
  updated_at: string
}

interface EditFormData {
  year: string
  make: string
  model: string
  trim: string
  price: string     // dollars with decimals (e.g. "39990.50")
  msrp: string      // dollars with decimals
  mileage: string
  status: string
  stock_number: string
  vin: string
  exterior_color: string
  fuel_type: string
  transmission: string
  drivetrain: string
  body_style: string
}

// ─── Cents ↔ Dollars helpers ────────────────────────────────────────────────
// DB stores INTEGER cents.  We display and accept decimal dollars in the form.
// toFixed(2) preserves fractional cents; .replace strips trailing ".00" for
// clean display when the price is a whole number.

/** Convert cents (integer) → display dollars string, keeping decimals if present */
function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2).replace(/\.00$/, "")
}

/** Convert dollars string (e.g. "39990.50") → cents integer, rounding safely */
function dollarsToCents(dollars: string): number {
  return Math.round(Number(dollars) * 100)
}

const PAGE_SIZE = 50

export default function AdminInventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit modal state
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<EditFormData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // ─── Fetch vehicles ─────────────────────────────────────────────────────
  const fetchVehicles = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", String(PAGE_SIZE))
      params.set("offset", String(page))
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (searchQuery.trim()) params.set("q", searchQuery.trim())

      const res = await fetch(`/api/v1/admin/vehicles?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setVehicles(data.vehicles || [])
      setTotal(data.total || 0)
    } catch {
      setVehicles([])
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = {
    available: vehicles.filter(v => v.status === "available").length,
    reserved: vehicles.filter(v => v.status === "reserved").length,
    pending: vehicles.filter(v => v.status === "pending").length,
    sold: vehicles.filter(v => v.status === "sold").length,
  }

  // ─── Selection ──────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    setSelectedVehicles(prev =>
      prev.length === vehicles.length ? [] : vehicles.map(v => v.id)
    )
  }
  const toggleSelect = (id: string) => {
    setSelectedVehicles(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  // ─── Edit ───────────────────────────────────────────────────────────────
  const openEdit = (v: Vehicle) => {
    setEditVehicle(v)
    setSaveError("")
    setFormData({
      year: String(v.year),
      make: v.make,
      model: v.model,
      trim: v.trim || "",
      // cents → decimal dollars, strip trailing .00 for whole numbers
      price: centsToDollars(v.price),
      msrp: v.msrp ? centsToDollars(v.msrp) : "",
      mileage: String(v.mileage),
      status: v.status,
      stock_number: v.stock_number,
      vin: v.vin,
      exterior_color: v.exterior_color || "",
      fuel_type: v.fuel_type || "",
      transmission: v.transmission || "",
      drivetrain: v.drivetrain || "",
      body_style: v.body_style || "",
    })
  }

  const handleSave = async () => {
    if (!editVehicle || !formData) return
    setIsSaving(true)
    setSaveError("")
    try {
      const res = await fetch(`/api/v1/admin/vehicles/${editVehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(formData.year),
          make: formData.make,
          model: formData.model,
          trim: formData.trim || null,
          // decimal dollars → integer cents via Math.round
          price: dollarsToCents(formData.price),
          msrp: formData.msrp ? dollarsToCents(formData.msrp) : null,
          mileage: parseInt(formData.mileage),
          status: formData.status,
          stock_number: formData.stock_number,
          vin: formData.vin,
          exterior_color: formData.exterior_color || null,
          fuel_type: formData.fuel_type || null,
          transmission: formData.transmission || null,
          drivetrain: formData.drivetrain || null,
          body_style: formData.body_style || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Save failed")
      }
      setEditVehicle(null)
      setFormData(null)
      fetchVehicles()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(page / PAGE_SIZE) + 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500">{total} vehicles in database</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Upload className="w-4 h-4 mr-2" />Import CSV</Button>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Link href="/admin/inventory/new"><Button><Plus className="w-4 h-4 mr-2" />Add Vehicle</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Available", value: stats.available, icon: CheckCircle, bg: "bg-green-100", fg: "text-green-600" },
          { label: "Reserved", value: stats.reserved, icon: Clock, bg: "bg-yellow-100", fg: "text-yellow-600" },
          { label: "Pending", value: stats.pending, icon: Car, bg: "bg-blue-100", fg: "text-blue-600" },
          { label: "Sold", value: stats.sold, icon: AlertCircle, bg: "bg-red-100", fg: "text-red-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.fg}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
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
              <Input aria-label="Search inventory" placeholder="Search by year, make, model, VIN..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }} className="pl-10" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }} className="px-3 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading inventory…</span>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-left"><input type="checkbox" checked={selectedVehicles.length === vehicles.length && vehicles.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Vehicle</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Stock #</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Price</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">MSRP</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                  <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4"><input type="checkbox" checked={selectedVehicles.includes(vehicle.id)} onChange={() => toggleSelect(vehicle.id)} className="rounded" /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {vehicle.primary_image_url ? (
                          <Image src={vehicle.primary_image_url} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} width={80} height={60} className="rounded object-cover" />
                        ) : (
                          <div className="w-20 h-[60px] bg-gray-200 rounded flex items-center justify-center"><Car className="w-6 h-6 text-gray-400" /></div>
                        )}
                        <div>
                          <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                          <p className="text-sm text-gray-500">{vehicle.trim}</p>
                          <p className="text-xs text-gray-400">{vehicle.vin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{vehicle.stock_number}</td>
                    <td className="py-3 px-4 font-medium">${(vehicle.price / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-gray-500">{vehicle.msrp ? `$${(vehicle.msrp / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : "—"}</td>
                    <td className="py-3 px-4"><Badge variant={vehicle.status === "available" ? "default" : vehicle.status === "reserved" ? "secondary" : "outline"}>{vehicle.status}</Badge></td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/vehicles/${vehicle.id}`} target="_blank"><Eye className="w-4 h-4 mr-2" />View Public Page</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(vehicle)}><Edit className="w-4 h-4 mr-2" />Edit Vehicle</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-gray-500">No vehicles found</td></tr>}
              </tbody>
            </table>
          </div>
          )}
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-500">Showing {vehicles.length} of {total} vehicles (page {currentPage}/{totalPages || 1})</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - PAGE_SIZE))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" disabled={page + PAGE_SIZE >= total} onClick={() => setPage(p => p + PAGE_SIZE)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedVehicles.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm">{selectedVehicles.length} selected</span>
          <Button size="sm" variant="secondary">Update Status</Button>
          <Button size="sm" variant="secondary">Update Price</Button>
          <button onClick={() => setSelectedVehicles([])} className="text-gray-400 hover:text-white ml-2">Cancel</button>
        </div>
      )}

      {/* ─── Edit Vehicle Modal ─────────────────────────────────────────── */}
      {editVehicle && formData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setEditVehicle(null); setFormData(null) }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Edit Vehicle</h2>
              <button onClick={() => { setEditVehicle(null); setFormData(null) }} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {saveError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{saveError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Year</label><Input type="number" value={formData.year} onChange={e => setFormData(prev => prev ? { ...prev, year: e.target.value } : prev)} /></div>
                <div><label className="block text-sm font-medium mb-1">Make</label><Input value={formData.make} onChange={e => setFormData(prev => prev ? { ...prev, make: e.target.value } : prev)} /></div>
                <div><label className="block text-sm font-medium mb-1">Model</label><Input value={formData.model} onChange={e => setFormData(prev => prev ? { ...prev, model: e.target.value } : prev)} /></div>
                <div><label className="block text-sm font-medium mb-1">Trim</label><Input value={formData.trim} onChange={e => setFormData(prev => prev ? { ...prev, trim: e.target.value } : prev)} /></div>
              </div>
              {/* Price / MSRP — step="0.01" for cent precision */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (CAD)</label>
                  <Input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData(prev => prev ? { ...prev, price: e.target.value } : prev)} placeholder="39990.50" />
                  <p className="text-xs text-gray-400 mt-1">Stored as {formData.price ? dollarsToCents(formData.price).toLocaleString() : 0} cents</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">MSRP (CAD)</label>
                  <Input type="number" step="0.01" min="0" value={formData.msrp} onChange={e => setFormData(prev => prev ? { ...prev, msrp: e.target.value } : prev)} placeholder="45990.00" />
                  <p className="text-xs text-gray-400 mt-1">{formData.msrp ? `Stored as ${dollarsToCents(formData.msrp).toLocaleString()} cents` : "No MSRP"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Mileage (km)</label><Input type="number" value={formData.mileage} onChange={e => setFormData(prev => prev ? { ...prev, mileage: e.target.value } : prev)} /></div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData(prev => prev ? { ...prev, status: e.target.value } : prev)} className="w-full h-10 px-3 border rounded-lg text-sm">
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Stock #</label><Input value={formData.stock_number} onChange={e => setFormData(prev => prev ? { ...prev, stock_number: e.target.value } : prev)} /></div>
                <div><label className="block text-sm font-medium mb-1">VIN</label><Input value={formData.vin} onChange={e => setFormData(prev => prev ? { ...prev, vin: e.target.value } : prev)} maxLength={17} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Exterior Color</label><Input value={formData.exterior_color} onChange={e => setFormData(prev => prev ? { ...prev, exterior_color: e.target.value } : prev)} /></div>
                <div><label className="block text-sm font-medium mb-1">Body Style</label><Input value={formData.body_style} onChange={e => setFormData(prev => prev ? { ...prev, body_style: e.target.value } : prev)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Fuel Type</label><Input value={formData.fuel_type} onChange={e => setFormData(prev => prev ? { ...prev, fuel_type: e.target.value } : prev)} /></div>
                <div><label className="block text-sm font-medium mb-1">Transmission</label><Input value={formData.transmission} onChange={e => setFormData(prev => prev ? { ...prev, transmission: e.target.value } : prev)} /></div>
                <div><label className="block text-sm font-medium mb-1">Drivetrain</label><Input value={formData.drivetrain} onChange={e => setFormData(prev => prev ? { ...prev, drivetrain: e.target.value } : prev)} /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => { setEditVehicle(null); setFormData(null) }}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}