/**
 * app/garage/dossier/[vin]/page.tsx
 * Vehicle Dossier Detail — document vault, SOH history, warranty info
 */
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ChevronLeft, Battery, Shield, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ vin: string }>
}

const DOC_KIND_LABELS: Record<string, string> = {
  purchase_agreement: "Purchase Agreement",
  warranty_certificate: "Warranty Certificate",
  aviloo_report: "Aviloo Battery Report",
  inspection_report: "Inspection Report",
  carfax: "CARFAX Report",
  financing_contract: "Financing Contract",
  insurance_slip: "Insurance Slip",
  other: "Document",
}

export default async function DossierDetailPage({ params }: Readonly<PageProps>) {
  const { vin } = await params
  const sb = await createClient()

  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect(`/auth/login?return_to=/garage/dossier/${vin}`)

  const { data: dossier, error: dossierError } = await sb
    .from("vehicle_dossiers")
    .select(`
      id, vin, year, make, model, trim, color, odometer_km, purchase_date,
      current_aviloo_soh_pct, current_aviloo_tested_at, next_aviloo_due_at,
      warranty_expires_at,
      aviloo_soh_history(tested_at, soh_pct, report_url),
      dossier_documents(id, kind, title, issued_at, customer_acknowledged_at, file_url)
    `)
    .eq("vin", vin)
    .eq("owner_user_id", user.id)
    .single()

  if (dossierError) {
    console.error("Failed to fetch dossier:", dossierError.message)
    throw new Error(`Failed to load dossier: ${dossierError.message}`)
  }
  if (!dossier) notFound()

  const sohHistory = ((dossier.aviloo_soh_history as Array<{ tested_at: string; soh_pct: number; report_url?: string }>) ?? [])
    .sort((a, b) => new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime())

  const docs = ((dossier.dossier_documents as Array<{ id: string; kind: string; title: string; issued_at: string; customer_acknowledged_at: string | null; file_url?: string }>) ?? [])
    .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime())

  const warrantyExpiry = dossier.warranty_expires_at ? new Date(dossier.warranty_expires_at) : null
  const warrantyExpired = warrantyExpiry && warrantyExpiry < new Date()
  const nextDue = dossier.next_aviloo_due_at ? new Date(dossier.next_aviloo_due_at) : null
  const dueOverdue = nextDue && nextDue < new Date()

  // Auto-acknowledge unread docs and update local state for consistent UI
  const unreadIds = docs.filter(d => !d.customer_acknowledged_at).map(d => d.id)
  if (unreadIds.length > 0) {
    const now = new Date().toISOString()
    const { error: ackError } = await sb.from("dossier_documents")
      .update({ customer_acknowledged_at: now })
      .in("id", unreadIds)
    // S7735: positive condition first.
    if (ackError) {
      console.error("Failed to acknowledge documents:", ackError.message)
    } else {
      // Update local state so UI renders documents as acknowledged immediately
      docs.forEach(d => {
        if (unreadIds.includes(d.id)) {
          d.customer_acknowledged_at = now
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/garage"><ChevronLeft className="h-4 w-4 mr-1" />Back to Garage</Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {dossier.year} {dossier.make} {dossier.model}
            {dossier.trim && <span className="font-normal text-muted-foreground"> {dossier.trim}</span>}
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{dossier.vin}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Vehicle Details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Vehicle Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {dossier.color && <div><dt className="text-muted-foreground">Colour</dt><dd className="font-medium mt-0.5">{dossier.color}</dd></div>}
              {dossier.odometer_km && <div><dt className="text-muted-foreground">Odometer</dt><dd className="font-medium mt-0.5">{Number(dossier.odometer_km).toLocaleString("en-CA")} km</dd></div>}
              {dossier.purchase_date && <div><dt className="text-muted-foreground">Purchase Date</dt><dd className="font-medium mt-0.5">{new Date(dossier.purchase_date).toLocaleDateString("en-CA")}</dd></div>}
            </dl>
          </CardContent>
        </Card>

        {/* Battery Health */}
        {dossier.current_aviloo_soh_pct != null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Battery className="h-4 w-4 text-emerald-500" />Battery Health (Aviloo)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current State of Health</span>
                <span className="text-2xl font-bold text-emerald-600">{dossier.current_aviloo_soh_pct}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div className="h-3 rounded-full bg-linear-to-r from-emerald-400 to-emerald-600" style={{ width: `${dossier.current_aviloo_soh_pct}%` }} />
              </div>
              {nextDue && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4" /><span>Next SOH test due</span></div>
                  <span className={dueOverdue ? "text-red-500 font-semibold" : "text-muted-foreground"}>
                    {dueOverdue ? "⚠️ Overdue — " : ""}{nextDue.toLocaleDateString("en-CA")}
                  </span>
                </div>
              )}
              {sohHistory.length > 1 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">History</p>
                  <div className="space-y-2">
                    {sohHistory.map((h) => (
                      <div key={h.tested_at} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{new Date(h.tested_at).toLocaleDateString("en-CA")}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{h.soh_pct}%</span>
                          {h.report_url && <a href={h.report_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Report ↗</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Warranty */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" />Warranty</CardTitle></CardHeader>
          <CardContent>
            {warrantyExpiry ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{warrantyExpiry.toLocaleDateString("en-CA")}</span>
                  {warrantyExpired
                    ? <Badge variant="destructive" className="text-xs">Expired</Badge>
                    : <Badge className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No warranty information on file.</p>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Documents ({docs.length})</CardTitle></CardHeader>
          <CardContent>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents on file yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {docs.map(doc => (
                  <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {doc.customer_acknowledged_at
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : <AlertCircle className="h-4 w-4 text-amber-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{DOC_KIND_LABELS[doc.kind] ?? doc.kind} · {new Date(doc.issued_at).toLocaleDateString("en-CA")}</p>
                      </div>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-blue-600 hover:underline font-medium">Download ↗</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button asChild variant="outline">
            <Link href="/garage/transactions">View Transaction History</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
