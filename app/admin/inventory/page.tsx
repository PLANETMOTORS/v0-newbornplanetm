"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, 
  Download, Upload, ChevronLeft, ChevronRight, CheckCircle,
  Clock, AlertCircle, Car
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

// Mock inventory data
const inventoryData = [
  {
    id: "2024-tesla-model-y",
    year: 2024,
    make: "Tesla",
    model: "Model Y",
    trim: "Long Range AWD",
    price: 64990,
    status: "active",
    views: 1247,
    inquiries: 23,
    daysOnLot: 12,
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=100&h=75&fit=crop",
    vin: "5YJXCAE28LF123456",
    stockNumber: "PM-2024-001"
  },
  {
    id: "2024-tesla-model-3",
    year: 2024,
    make: "Tesla",
    model: "Model 3",
    trim: "Performance AWD",
    price: 58990,
    status: "active",
    views: 986,
    inquiries: 18,
    daysOnLot: 8,
    image: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=100&h=75&fit=crop",
    vin: "5YJ3E1EA2LF123457",
    stockNumber: "PM-2024-002"
  },
  {
    id: "2024-bmw-m4",
    year: 2024,
    make: "BMW",
    model: "M4",
    trim: "Competition xDrive",
    price: 89900,
    status: "reserved",
    views: 854,
    inquiries: 15,
    daysOnLot: 21,
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=100&h=75&fit=crop",
    vin: "WBS43AZ08NCK12345",
    stockNumber: "PM-2024-003"
  },
  {
    id: "2024-porsche-taycan",
    year: 2024,
    make: "Porsche",
    model: "Taycan",
    trim: "4S Performance",
    price: 134500,
    status: "active",
    views: 723,
    inquiries: 12,
    daysOnLot: 5,
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=100&h=75&fit=crop",
    vin: "WP0AA2Y19LSA12345",
    stockNumber: "PM-2024-004"
  },
  {
    id: "2023-mercedes-eqs",
    year: 2023,
    make: "Mercedes-Benz",
    model: "EQS",
    trim: "580 4MATIC",
    price: 156900,
    status: "pending",
    views: 456,
    inquiries: 8,
    daysOnLot: 3,
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=100&h=75&fit=crop",
    vin: "W1K6G7GB3NA123456",
    stockNumber: "PM-2024-005"
  },
]

/**
 * Admin inventory management page component that displays, filters, and selects vehicle records.
 *
 * Renders a searchable and filterable inventory table with selection checkboxes, bulk action controls,
 * summary stats, import/export/add buttons, and static pagination. The visible rows are filtered by
 * a text query (matches year, make, model, and trim) and by status.
 *
 * @returns A React element representing the admin inventory management user interface.
 */
export default function AdminInventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])


  const filteredInventory = inventoryData.filter(vehicle => {
    const matchesSearch = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const toggleSelectAll = () => {
    if (selectedVehicles.length === filteredInventory.length) {
      setSelectedVehicles([])
    } else {
      setSelectedVehicles(filteredInventory.map(v => v.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedVehicles(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500">{inventoryData.length} vehicles in stock</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/admin/inventory/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">198</p>
                <p className="text-sm text-gray-500">Active</p>
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
                <p className="text-2xl font-bold">32</p>
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
                <p className="text-2xl font-bold">17</p>
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
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-gray-500">30+ Days</p>
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
                aria-label="Search inventory by year, make, model, or VIN"
                placeholder="Search by year, make, model, VIN..."
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
              <option value="active">Active</option>
              <option value="reserved">Reserved</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.length === filteredInventory.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Vehicle</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Stock #</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Price</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-500">Views</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-500">Days</th>
                  <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((vehicle) => (
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
                        <Image
                          src={vehicle.image}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          width={80}
                          height={60}
                          className="rounded object-cover"
                        />
                        <div>
                          <p className="font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-sm text-gray-500">{vehicle.trim}</p>
                          <p className="text-xs text-gray-400">{vehicle.vin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{vehicle.stockNumber}</td>
                    <td className="py-3 px-4 font-medium">${vehicle.price.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        vehicle.status === "active" ? "default" :
                        vehicle.status === "reserved" ? "secondary" : "outline"
                      }>
                        {vehicle.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">{vehicle.views.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={vehicle.daysOnLot > 30 ? "text-red-600 font-medium" : ""}>
                        {vehicle.daysOnLot}
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
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Vehicle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
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
              Showing {filteredInventory.length} of {inventoryData.length} vehicles
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</span>
              <span className="px-3 py-1 hover:bg-gray-100 rounded text-sm cursor-pointer">2</span>
              <span className="px-3 py-1 hover:bg-gray-100 rounded text-sm cursor-pointer">3</span>
              <Button variant="outline" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
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
          <Button size="sm" variant="destructive">Delete</Button>
          <button 
            onClick={() => setSelectedVehicles([])}
            className="text-gray-400 hover:text-white ml-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
