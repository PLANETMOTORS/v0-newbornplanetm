"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Car, Users, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Eye, Heart, MessageSquare, Clock, CheckCircle, AlertCircle,
  Calendar, ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Mock data - will be replaced with Supabase queries
const stats = [
  { 
    name: "Total Inventory", 
    value: "247", 
    change: "+12", 
    changeType: "increase",
    icon: Car,
    href: "/admin/inventory"
  },
  { 
    name: "Active Leads", 
    value: "89", 
    change: "+23", 
    changeType: "increase",
    icon: MessageSquare,
    href: "/admin/leads"
  },
  { 
    name: "Monthly Revenue", 
    value: "$1.2M", 
    change: "+18%", 
    changeType: "increase",
    icon: DollarSign,
    href: "/admin/analytics"
  },
  { 
    name: "Conversion Rate", 
    value: "4.8%", 
    change: "-0.3%", 
    changeType: "decrease",
    icon: TrendingUp,
    href: "/admin/analytics"
  },
]

const recentLeads = [
  { 
    id: 1, 
    name: "John Smith", 
    email: "john@example.com",
    type: "Finance Application",
    vehicle: "2024 Tesla Model Y",
    time: "5 min ago",
    status: "new"
  },
  { 
    id: 2, 
    name: "Sarah Johnson", 
    email: "sarah@example.com",
    type: "Trade-In Request",
    vehicle: "2022 BMW X5",
    time: "23 min ago",
    status: "contacted"
  },
  { 
    id: 3, 
    name: "Mike Brown", 
    email: "mike@example.com",
    type: "Test Drive",
    vehicle: "2024 Porsche Taycan",
    time: "1 hour ago",
    status: "new"
  },
  { 
    id: 4, 
    name: "Emily Davis", 
    email: "emily@example.com",
    type: "Reservation",
    vehicle: "2023 Mercedes EQS",
    time: "2 hours ago",
    status: "pending"
  },
]

const recentActivity = [
  { action: "New vehicle added", details: "2024 Tesla Model 3 Performance", time: "10 min ago" },
  { action: "Lead converted", details: "Sarah Johnson - 2024 BMW M4", time: "45 min ago" },
  { action: "Price updated", details: "2023 Audi e-tron GT: $178,900 → $172,500", time: "1 hour ago" },
  { action: "New finance application", details: "Mike Brown - Pre-approval request", time: "2 hours ago" },
  { action: "Vehicle sold", details: "2024 Honda CR-V Touring", time: "3 hours ago" },
]

const topVehicles = [
  { name: "2024 Tesla Model Y", views: 1247, favorites: 89, inquiries: 23 },
  { name: "2024 BMW M4 Competition", views: 986, favorites: 67, inquiries: 18 },
  { name: "2023 Porsche Taycan 4S", views: 854, favorites: 54, inquiries: 15 },
  { name: "2024 Ford F-150 Lightning", views: 723, favorites: 45, inquiries: 12 },
]

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState("7d")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.changeType === "increase" ? "text-green-600" : "text-red-600"
                  }`}>
                    {stat.changeType === "increase" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest customer inquiries and applications</CardDescription>
            </div>
            <Link href="/admin/leads">
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {lead.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.type} - {lead.vehicle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      lead.status === "new" ? "default" :
                      lead.status === "contacted" ? "secondary" : "outline"
                    }>
                      {lead.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{lead.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Vehicles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Performing Vehicles</CardTitle>
            <CardDescription>Most viewed and inquired vehicles this week</CardDescription>
          </div>
          <Link href="/admin/inventory">
            <Button variant="outline" size="sm">
              Manage Inventory
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Vehicle</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="w-4 h-4" /> Views
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="w-4 h-4" /> Favorites
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="w-4 h-4" /> Inquiries
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topVehicles.map((vehicle, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{vehicle.name}</td>
                    <td className="py-3 px-4 text-center">{vehicle.views.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">{vehicle.favorites}</td>
                    <td className="py-3 px-4 text-center">{vehicle.inquiries}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/inventory/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-blue-300">
            <CardContent className="p-6 text-center">
              <Car className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="font-medium">Add New Vehicle</p>
              <p className="text-sm text-gray-500">List a new vehicle for sale</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/leads">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-green-300">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="font-medium">View Leads</p>
              <p className="text-sm text-gray-500">89 leads awaiting response</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/finance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-yellow-300">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <p className="font-medium">Finance Apps</p>
              <p className="text-sm text-gray-500">12 pending applications</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/settings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-purple-300">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="font-medium">Business Hours</p>
              <p className="text-sm text-gray-500">Update store hours</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
