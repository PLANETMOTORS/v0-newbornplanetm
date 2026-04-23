"use client"
/**
 * components/garage/transaction-history.tsx
 * Renders deposits, orders, and financing payments in a unified timeline.
 */
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ShoppingCart, Banknote, ChevronDown, ChevronUp } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

interface Deposit {
  id: string
  amount_cents: number
  state: string
  created_at: string
  deal_id?: string | null
  deals?: { vin?: string | null } | null
}

interface Order {
  id: string
  total_cents: number
  state: string
  created_at: string
  vehicle_id?: string | null
  vehicles?: { year?: number | null; make?: string | null; model?: string | null } | null
}

interface FinancePayment {
  id: string
  amount_cents: number
  state: string
  payment_date: string
  financing_application_id?: string | null
  financing_applications?: { lender?: string | null; deal_id?: string | null } | null
}

interface TransactionHistoryProps {
  deposits: Deposit[]
  orders: Order[]
  financePayments: FinancePayment[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATE_COLORS: Record<string, string> = {
  succeeded:   "bg-emerald-100 text-emerald-800",
  paid:        "bg-emerald-100 text-emerald-800",
  completed:   "bg-emerald-100 text-emerald-800",
  pending:     "bg-yellow-100 text-yellow-800",
  processing:  "bg-yellow-100 text-yellow-800",
  failed:      "bg-red-100 text-red-800",
  refunded:    "bg-gray-100 text-gray-700",
  cancelled:   "bg-gray-100 text-gray-700",
}

function stateColor(state: string) {
  return STATE_COLORS[state.toLowerCase()] ?? "bg-gray-100 text-gray-700"
}

function formatCAD(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
}

// ── Unified timeline entry ─────────────────────────────────────────────────

type TxEntry =
  | { kind: "deposit"; date: string; data: Deposit }
  | { kind: "order"; date: string; data: Order }
  | { kind: "finance"; date: string; data: FinancePayment }

// ── Component ──────────────────────────────────────────────────────────────

export function TransactionHistory({ deposits, orders, financePayments }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<"all" | "deposit" | "order" | "finance">("all")
  const [expanded, setExpanded] = useState<string | null>(null)

  const entries: TxEntry[] = [
    ...deposits.map(d => ({ kind: "deposit" as const, date: d.created_at, data: d })),
    ...orders.map(o => ({ kind: "order" as const, date: o.created_at, data: o })),
    ...financePayments.map(f => ({ kind: "finance" as const, date: f.payment_date, data: f })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filtered = filter === "all" ? entries : entries.filter(e => e.kind === filter)

  const totalPaid = entries
    .filter(e => ["succeeded", "paid", "completed"].includes(
      (e.kind === "finance" ? e.data.state : e.data.state).toLowerCase()
    ))
    .reduce((sum, e) => {
      const cents = e.kind === "deposit" ? e.data.amount_cents
        : e.kind === "order" ? e.data.total_cents
        : e.data.amount_cents
      return sum + cents
    }, 0)

  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex p-5 bg-muted rounded-full mb-4">
          <CreditCard className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">No transactions yet</h2>
        <p className="text-sm text-muted-foreground">Your payment history will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-xl font-bold mt-1">{formatCAD(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Deposits</p>
            <p className="text-xl font-bold mt-1">{deposits.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="text-xl font-bold mt-1">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Finance Pmts</p>
            <p className="text-xl font-bold mt-1">{financePayments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "deposit", "order", "finance"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "All" : f === "deposit" ? "Deposits" : f === "order" ? "Orders" : "Financing"}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.map(entry => {
          const id = entry.data.id
          const isOpen = expanded === id

          let icon = <CreditCard className="h-4 w-4" />
          let title = ""
          let subtitle = ""
          let amount = 0
          let state = ""

          if (entry.kind === "deposit") {
            icon = <Banknote className="h-4 w-4 text-emerald-600" />
            title = "Deposit"
            subtitle = entry.data.deals?.vin ? `VIN: ${entry.data.deals.vin}` : `Deal #${entry.data.deal_id?.slice(0, 8) ?? "—"}`
            amount = entry.data.amount_cents
            state = entry.data.state
          } else if (entry.kind === "order") {
            icon = <ShoppingCart className="h-4 w-4 text-blue-600" />
            const v = entry.data.vehicles
            title = v ? [v.year, v.make, v.model].filter(Boolean).join(" ") || "Order" : "Order"
            subtitle = `Order #${entry.data.id.slice(0, 8)}`
            amount = entry.data.total_cents
            state = entry.data.state
          } else {
            icon = <CreditCard className="h-4 w-4 text-purple-600" />
            title = `Finance Payment${entry.data.financing_applications?.lender ? ` — ${entry.data.financing_applications.lender}` : ""}`
            subtitle = `Application #${entry.data.financing_application_id?.slice(0, 8) ?? "—"}`
            amount = entry.data.amount_cents
            state = entry.data.state
          }

          return (
            <Card key={id} className="border-border/60">
              <CardContent className="p-0">
                <button
                  className="w-full text-left p-4 flex items-center gap-4"
                  onClick={() => setExpanded(isOpen ? null : id)}
                >
                  <div className="shrink-0 p-2 bg-muted rounded-lg">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatCAD(amount)}</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${stateColor(state)}`}>
                      {state.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="shrink-0 text-muted-foreground ml-1">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/40 mt-0">
                    <dl className="grid grid-cols-2 gap-3 text-sm mt-3">
                      <div>
                        <dt className="text-muted-foreground text-xs">Date</dt>
                        <dd className="font-medium mt-0.5">{formatDate(entry.date)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Amount</dt>
                        <dd className="font-medium mt-0.5">{formatCAD(amount)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Status</dt>
                        <dd className="mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stateColor(state)}`}>
                            {state.replace(/_/g, " ")}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Reference</dt>
                        <dd className="font-mono text-xs mt-0.5 text-muted-foreground">{id.slice(0, 16)}…</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
