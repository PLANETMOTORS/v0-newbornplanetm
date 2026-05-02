/**
 * app/garage/transactions/page.tsx
 * Customer Transaction History — deposits, orders, financing payments
 */
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ChevronLeft, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionHistory } from "@/components/garage/transaction-history"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect("/auth/login?return_to=/garage/transactions")

  const PAGE_SIZE = 50

  // Fetch deposits
  const { data: deposits, error: depositsError } = await sb
    .from("deposits")
    .select("id, amount_cents, state, created_at, deal_id, deals(vin)")
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  // Fetch orders
  const { data: orders, error: ordersError } = await sb
    .from("orders")
    .select("id, total_cents, state, created_at, vehicle_id, vehicles(year, make, model)")
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  // Fetch financing payments
  const { data: financePayments, error: paymentsError } = await sb
    .from("financing_payments")
    .select("id, amount_cents, state, payment_date, financing_application_id, financing_applications(lender, deal_id)")
    .eq("customer_user_id", user.id)
    .order("payment_date", { ascending: false })
    .limit(PAGE_SIZE)

  if (depositsError || ordersError || paymentsError) {
    console.error("Transaction fetch errors:", { depositsError, ordersError, paymentsError })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/garage"><ChevronLeft className="h-4 w-4 mr-1" />Back to Garage</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 dark:bg-slate-800 rounded-xl">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
              <p className="text-sm text-muted-foreground">All deposits, orders, and financing payments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TransactionHistory
          deposits={(deposits ?? []) as Parameters<typeof TransactionHistory>[0]["deposits"]}
          orders={(orders ?? []) as Parameters<typeof TransactionHistory>[0]["orders"]}
          financePayments={(financePayments ?? []) as Parameters<typeof TransactionHistory>[0]["financePayments"]}
        />
      </div>
    </div>
  )
}
