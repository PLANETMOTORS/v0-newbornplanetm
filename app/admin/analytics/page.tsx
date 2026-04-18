"use client"

import { useState, useEffect } from "react"
import {
  DollarSign, Users, Car, FileText, TrendingUp,
  RefreshCw, ShoppingCart, ArrowUpRight, CreditCard,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface AnalyticsData {
  overview: {
    totalRevenue: number
    recentRevenue: number
    totalOrders: number
    recentOrders: number
    totalCustomers: number
    newCustomers30d: number
    newCustomers7d: number
    totalVehicles: number
    activeVehicles: number
    soldVehicles: number
    reservedVehicles: number
    totalReservations: number
  }
  finance: {
    total: number
    pending: number
    approved: number
    totalValue: number
  }
  tradeIns: {
    total: number
    pending: number
    accepted: number
    totalValue: number
  }
  breakdowns: {
    ordersByStatus: Record<string, number>
    ordersByPayment: Record<string, number>
    ordersPerDay: Record<string, number>
    topMakes: { make: string; count: number }[]
  }
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatDollars(dollars: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars)
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/admin/analytics")
      if (!res.ok) {
        setError("Failed to load analytics data")
        return
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error("Error fetching analytics:", err)
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500 text-lg">Loading analytics...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <BarChart3 className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">{error || "No data available"}</p>
        <Button variant="outline" onClick={fetchAnalytics} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const { overview, finance, tradeIns, breakdowns } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Business overview and key metrics</p>
        </div>
        <Button variant="outline" onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              {overview.recentRevenue > 0 && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  30d
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
              {overview.recentRevenue > 0 && (
                <p className="text-xs text-green-600 mt-1">{formatCurrency(overview.recentRevenue)} last 30 days</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              {overview.recentOrders > 0 && (
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <ArrowUpRight className="w-4 h-4" />
                  +{overview.recentOrders}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{overview.totalOrders}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
              {overview.recentOrders > 0 && (
                <p className="text-xs text-blue-600 mt-1">{overview.recentOrders} in last 30 days</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              {overview.newCustomers7d > 0 && (
                <div className="flex items-center gap-1 text-sm text-purple-600">
                  <ArrowUpRight className="w-4 h-4" />
                  +{overview.newCustomers7d}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{overview.totalCustomers}</p>
              <p className="text-sm text-gray-500">Total Customers</p>
              {overview.newCustomers30d > 0 && (
                <p className="text-xs text-purple-600 mt-1">{overview.newCustomers30d} new in 30 days</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-orange-600" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{overview.totalVehicles}</p>
              <p className="text-sm text-gray-500">Total Vehicles</p>
              <p className="text-xs text-gray-500 mt-1">
                {overview.activeVehicles} active • {overview.soldVehicles} sold • {overview.reservedVehicles} reserved
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory & Vehicle Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Status</CardTitle>
            <CardDescription>Vehicle availability breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Active / Available</span>
                </div>
                <span className="font-bold">{overview.activeVehicles}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Reserved / Pending</span>
                </div>
                <span className="font-bold">{overview.reservedVehicles}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <span>Sold</span>
                </div>
                <span className="font-bold">{overview.soldVehicles}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3 mt-3">
                <span className="font-medium">Total Reservations</span>
                <span className="font-bold">{overview.totalReservations}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Makes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Vehicle Makes</CardTitle>
            <CardDescription>Inventory distribution by manufacturer</CardDescription>
          </CardHeader>
          <CardContent>
            {breakdowns.topMakes.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No vehicle data</p>
            ) : (
              <div className="space-y-3">
                {breakdowns.topMakes.map((item) => {
                  const maxCount = breakdowns.topMakes[0]?.count || 1
                  const width = Math.max(8, (item.count / maxCount) * 100)
                  return (
                    <div key={item.make} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-gray-600 truncate">{item.make}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-xs text-white font-medium">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Finance & Trade-Ins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finance Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Finance Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{finance.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{finance.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{finance.approved}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{formatDollars(finance.totalValue)}</p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade-Ins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trade-In Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{tradeIns.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{tradeIns.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{tradeIns.accepted}</p>
                <p className="text-sm text-gray-500">Accepted</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{formatDollars(tradeIns.totalValue)}</p>
                <p className="text-sm text-gray-500">Accepted Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(breakdowns.ordersByStatus).length === 0 ? (
              <p className="text-gray-400 text-center py-8">No order data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(breakdowns.ordersByStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{status.replace(/_/g, " ")}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(breakdowns.ordersByPayment).length === 0 ? (
              <p className="text-gray-400 text-center py-8">No payment data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(breakdowns.ordersByPayment)
                  .sort((a, b) => b[1] - a[1])
                  .map(([method, count]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{method.replace(/_/g, " ")}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
