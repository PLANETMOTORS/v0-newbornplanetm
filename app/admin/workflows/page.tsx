"use client"

import { useState } from "react"
import {
  Mail, Bell, Clock, ToggleLeft, ToggleRight,
  MessageSquare, DollarSign, CalendarCheck, Car,
  CheckCircle2, AlertCircle, Zap
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Workflow {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  icon: typeof Mail
  color: string
  bg: string
  enabled: boolean
  recipients: string
  category: "notifications" | "customer" | "followup"
}

const WORKFLOWS: Workflow[] = [
  // Admin Notification Workflows
  {
    id: "new_inquiry_notify",
    name: "New Inquiry Notification",
    description: "Send email to admin when a new contact form inquiry is submitted",
    trigger: "Contact form submission",
    action: "Email admin team",
    icon: MessageSquare,
    color: "text-blue-600",
    bg: "bg-blue-50",
    enabled: true,
    recipients: "admin@planetmotors.ca, toni@planetmotors.ca",
    category: "notifications",
  },
  {
    id: "new_finance_app_notify",
    name: "Finance Application Alert",
    description: "Notify admin when a new finance application is submitted",
    trigger: "Finance application submission",
    action: "Email admin team",
    icon: DollarSign,
    color: "text-purple-600",
    bg: "bg-purple-50",
    enabled: true,
    recipients: "admin@planetmotors.ca, toni@planetmotors.ca",
    category: "notifications",
  },
  {
    id: "new_reservation_notify",
    name: "Reservation & Deposit Alert",
    description: "Notify admin when a vehicle is reserved with a deposit payment",
    trigger: "Vehicle reservation + Stripe payment",
    action: "Email admin team with payment details",
    icon: CalendarCheck,
    color: "text-orange-600",
    bg: "bg-orange-50",
    enabled: true,
    recipients: "admin@planetmotors.ca, toni@planetmotors.ca",
    category: "notifications",
  },
  {
    id: "trade_in_notify",
    name: "Trade-In Quote Alert",
    description: "Notify admin when a customer requests a trade-in valuation",
    trigger: "Trade-in quote request",
    action: "Email admin team with vehicle & valuation details",
    icon: Car,
    color: "text-teal-600",
    bg: "bg-teal-50",
    enabled: true,
    recipients: "admin@planetmotors.ca, toni@planetmotors.ca",
    category: "notifications",
  },
  {
    id: "chat_escalation_notify",
    name: "Anna Chat Escalation",
    description: "Urgent alert when a customer requests to speak with a human during Anna chat",
    trigger: "Customer requests human help in Anna chat",
    action: "Urgent email to admin team",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    enabled: true,
    recipients: "admin@planetmotors.ca, toni@planetmotors.ca",
    category: "notifications",
  },

  // Customer-facing Workflows
  {
    id: "reservation_confirmation",
    name: "Reservation Confirmation",
    description: "Send confirmation email to customer after successful vehicle reservation",
    trigger: "Successful deposit payment",
    action: "Email customer with reservation details + receipt",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    enabled: true,
    recipients: "Customer email",
    category: "customer",
  },
  {
    id: "finance_app_received",
    name: "Finance Application Received",
    description: "Acknowledge receipt of finance application to the customer",
    trigger: "Finance application submitted",
    action: "Email customer confirming receipt + next steps",
    icon: Mail,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    enabled: true,
    recipients: "Customer email",
    category: "customer",
  },
  {
    id: "new_inventory_alert",
    name: "New Inventory Alerts",
    description: "Notify subscribed customers when matching vehicles are added to inventory",
    trigger: "New vehicle added via HomeNet sync",
    action: "Email customers who signed up for inventory alerts",
    icon: Bell,
    color: "text-amber-600",
    bg: "bg-amber-50",
    enabled: false,
    recipients: "Subscribed customers",
    category: "customer",
  },

  // Follow-up Workflows
  {
    id: "stale_lead_reminder",
    name: "Stale Lead Follow-up",
    description: "Remind team to follow up on leads that haven't been contacted in 24 hours",
    trigger: "Lead status = 'new' for 24+ hours",
    action: "Email admin team with stale lead list",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    enabled: false,
    recipients: "admin@planetmotors.ca, toni@planetmotors.ca",
    category: "followup",
  },
  {
    id: "reservation_expiry_warning",
    name: "Reservation Expiry Warning",
    description: "Alert admin when a reservation is about to expire (24 hours before)",
    trigger: "Reservation expiry within 24 hours",
    action: "Email admin + customer",
    icon: AlertCircle,
    color: "text-orange-600",
    bg: "bg-orange-50",
    enabled: false,
    recipients: "admin@planetmotors.ca + customer",
    category: "followup",
  },
  {
    id: "days_on_lot_alert",
    name: "Days on Lot Alert",
    description: "Flag vehicles sitting for 45+ days with suggested price reduction",
    trigger: "Vehicle listed_at > 45 days ago",
    action: "Weekly email digest to admin",
    icon: Car,
    color: "text-gray-600",
    bg: "bg-gray-50",
    enabled: false,
    recipients: "admin@planetmotors.ca, toni@planetmotors.ca",
    category: "followup",
  },
]

const CATEGORIES = [
  { key: "notifications", label: "Admin Notifications", icon: Bell, description: "Alerts sent to the Planet Motors team" },
  { key: "customer", label: "Customer Communications", icon: Mail, description: "Automated emails sent to customers" },
  { key: "followup", label: "Follow-up Automation", icon: Clock, description: "Scheduled reminders and alerts" },
]

export default function AdminWorkflowsPage() {
  const [workflows, setWorkflows] = useState(WORKFLOWS)

  const toggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w))
  }

  const enabledCount = workflows.filter(w => w.enabled).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automated Workflows</h1>
          <p className="text-sm text-gray-500">Configure email notifications and automated processes</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Zap className="w-3 h-3 mr-1 text-yellow-500" />
          {enabledCount} of {workflows.length} active
        </Badge>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">How workflows work</p>
            <p className="text-xs text-blue-700 mt-1">
              Active workflows trigger automatically based on events. Admin notification emails are sent to admin@planetmotors.ca and toni@planetmotors.ca. 
              Customer emails use the customer&apos;s email from their form submission. Follow-up workflows run on scheduled checks.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Categories */}
      {CATEGORIES.map(category => {
        const categoryWorkflows = workflows.filter(w => w.category === category.key)
        const CatIcon = category.icon

        return (
          <div key={category.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <CatIcon className="w-5 h-5 text-gray-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{category.label}</h2>
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
            </div>

            <div className="grid gap-3">
              {categoryWorkflows.map(workflow => {
                const Icon = workflow.icon
                return (
                  <Card key={workflow.id} className={`${workflow.enabled ? "" : "opacity-60"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${workflow.bg}`}>
                            <Icon className={`w-5 h-5 ${workflow.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{workflow.name}</p>
                              <Badge variant={workflow.enabled ? "default" : "secondary"} className="text-[10px]">
                                {workflow.enabled ? "Active" : "Disabled"}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{workflow.description}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                              <span><strong>Trigger:</strong> {workflow.trigger}</span>
                              <span><strong>Action:</strong> {workflow.action}</span>
                              <span><strong>Recipients:</strong> {workflow.recipients}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleWorkflow(workflow.id)}
                          className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                        >
                          {workflow.enabled ? (
                            <ToggleRight className="w-8 h-8 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-300" />
                          )}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
