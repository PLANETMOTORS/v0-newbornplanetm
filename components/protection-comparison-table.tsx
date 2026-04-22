"use client"

import { useState } from "react"
import { CheckCircle, X, Shield, ChevronDown, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  PROTECTION_PACKAGES,
  COMPARISON_ROWS,
  type ProtectionPackage,
} from "@/lib/constants/protection-packages"

interface ProtectionComparisonTableProps {
  onSelectPackage?: (packageId: string) => void
}

/* ── Tier gradient configs ── */
const TIER_STYLES: Record<string, { gradient: string; ring: string; iconBg: string }> = {
  basic:          { gradient: "from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800", ring: "ring-slate-200 dark:ring-slate-700", iconBg: "bg-slate-200 dark:bg-slate-700" },
  essential:      { gradient: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900", ring: "ring-blue-200 dark:ring-blue-800", iconBg: "bg-blue-100 dark:bg-blue-900" },
  certified:      { gradient: "from-primary/10 to-primary/20", ring: "ring-primary/40", iconBg: "bg-primary/20" },
  "certified-plus": { gradient: "from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900", ring: "ring-amber-300 dark:ring-amber-700", iconBg: "bg-amber-100 dark:bg-amber-900" },
}

function getPaymentMethodLabel(method: ProtectionPackage["paymentMethod"]) {
  switch (method) {
    case "cash": return "Cash Only"
    case "finance": return "Finance Only"
    case "cash_and_finance": return "Cash & Finance"
    default: {
      const _exhaustive: never = method
      return _exhaustive
    }
  }
}

function getDepositLabel(pkg: ProtectionPackage) {
  if (pkg.id === "basic") return "Full amount"
  return `$${pkg.deposit} refundable`
}

function getWarrantyLabel(warranty: ProtectionPackage["warranty"]) {
  switch (warranty) {
    case "none": return null
    case "standard": return "Standard"
    case "extended": return "Extended"
  }
}

function getDeliveryLabel(pkg: ProtectionPackage) {
  if (pkg.id === "basic") return "Pickup only"
  if (!pkg.features.freeDelivery) return "Pickup or delivery"
  return "FREE delivery"
}

function CellValue({ pkg, rowKey }: { pkg: ProtectionPackage; rowKey: string }) {
  switch (rowKey) {
    case "paymentMethod":
      return <span className="text-xs sm:text-sm font-medium">{getPaymentMethodLabel(pkg.paymentMethod)}</span>
    case "deposit":
      return <span className="text-xs sm:text-sm">{getDepositLabel(pkg)}</span>
    case "warranty": {
      const label = getWarrantyLabel(pkg.warranty)
      if (!label) return <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
      const isExtended = pkg.warranty === "extended"
      return (
        <span className={`text-xs sm:text-sm font-semibold ${isExtended ? "text-green-700 dark:text-green-400" : ""}`}>
          {label}
        </span>
      )
    }
    case "freeDelivery":
      return (
        <span className={`text-xs sm:text-sm ${pkg.features.freeDelivery ? "font-semibold text-green-700 dark:text-green-400" : ""}`}>
          {getDeliveryLabel(pkg)}
        </span>
      )
    default: {
      const featureKey = rowKey as keyof ProtectionPackage["features"]
      const value = pkg.features[featureKey]
      if (value === undefined) return null
      return value ? (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-400" />
          </div>
        </div>
      ) : (
        <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
      )
    }
  }
}

/* ── Mobile card view for each package ── */
function MobilePackageCard({ pkg, index, onSelect }: { pkg: ProtectionPackage; index: number; onSelect?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(pkg.highlighted)
  const style = TIER_STYLES[pkg.id] || TIER_STYLES.basic

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden animate-in fade-in slide-in-from-bottom-3 ${pkg.highlighted ? "ring-2 ring-primary shadow-lg shadow-primary/10" : `ring-1 ${style.ring}`}`}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-5 bg-gradient-to-br ${style.gradient} flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center`}>
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">{pkg.name}</span>
              {pkg.badge && (
                <Badge className={`text-[10px] px-1.5 py-0 ${pkg.highlighted ? "bg-primary" : "bg-primary/80"}`}>
                  {pkg.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {pkg.priceFrom > 0 ? `From $${pkg.priceFrom.toLocaleString()}` : "No cost"}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expandable content */}
      <div
        className="grid transition-all duration-300 ease-in-out overflow-hidden"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="min-h-0">
          <div className="p-5 space-y-3 border-t">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <CellValue pkg={pkg} rowKey={row.key} />
              </div>
            ))}
            <div className="pt-3">
              <Button
                className="w-full h-12 text-base font-semibold"
                variant={pkg.highlighted ? "default" : "outline"}
                size="lg"
                onClick={() => onSelect?.(pkg.id)}
              >
                {pkg.id === "basic" ? "Continue Without Protection" : "Select Package"}
                {pkg.highlighted && <Sparkles className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


/* ── Desktop comparison table ── */
function DesktopTable({ onSelect }: { onSelect?: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <table className="w-full border-collapse min-w-[800px]">
        {/* ── Tier headers ── */}
        <thead>
          <tr>
            <th className="text-left p-5 w-[240px] bg-muted/40 align-bottom border-b border-border">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Features</span>
            </th>
            {PROTECTION_PACKAGES.map((pkg, i) => {
              const style = TIER_STYLES[pkg.id] || TIER_STYLES.basic
              return (
                <th key={pkg.id} className={`text-center align-bottom relative border-b border-border ${pkg.highlighted ? "bg-primary/5" : ""}`}>
                  {pkg.badge && (
                    <div
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-2"
                      style={{ animationDelay: `${300 + i * 100}ms`, animationFillMode: "both" }}
                    >
                      <Badge className={`text-[10px] px-2.5 py-0.5 shadow-md ${pkg.highlighted ? "bg-primary" : "bg-primary/80"}`}>
                        {pkg.badge}
                      </Badge>
                    </div>
                  )}
                  <div
                    className={`p-5 pb-4 bg-gradient-to-b ${style.gradient} rounded-t-xl mx-1 mt-1 animate-in fade-in slide-in-from-bottom-2`}
                    style={{ animationDelay: `${100 + i * 80}ms`, animationFillMode: "both" }}
                  >
                    <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center mx-auto mb-2`}>
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="font-bold text-base">{pkg.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {pkg.id === "basic" ? "Cash buyers" :
                       pkg.paymentMethod === "finance" ? "Finance buyers" :
                       "Cash & finance"}
                    </div>
                    {pkg.priceFrom > 0 && (
                      <div className="mt-2">
                        <span className="text-2xl font-bold">${pkg.priceFrom.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground block">starting from</span>
                      </div>
                    )}
                    {pkg.priceFrom === 0 && (
                      <div className="mt-2">
                        <span className="text-lg font-semibold text-muted-foreground">No cost</span>
                      </div>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>

        {/* ── Feature rows ── */}
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr
              key={row.key}
              className={`group transition-colors hover:bg-muted/40 animate-in fade-in ${i % 2 === 0 ? "bg-muted/20" : "bg-background"}`}
              style={{ animationDelay: `${300 + i * 30}ms`, animationFillMode: "both" }}
            >
              <td className="p-4 pl-5 text-sm font-medium text-foreground border-r border-border/50">{row.label}</td>
              {PROTECTION_PACKAGES.map((pkg) => (
                <td key={pkg.id} className={`p-4 text-center transition-colors ${pkg.highlighted ? "bg-primary/[0.03] group-hover:bg-primary/[0.06]" : ""}`}>
                  <CellValue pkg={pkg} rowKey={row.key} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {/* ── CTA footer ── */}
        <tfoot>
          <tr className="border-t-2 border-border">
            <td className="p-5 bg-muted/40" />
            {PROTECTION_PACKAGES.map((pkg, i) => (
              <td key={pkg.id} className={`p-5 text-center ${pkg.highlighted ? "bg-primary/5" : ""}`}>
                <div
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${500 + i * 100}ms`, animationFillMode: "both" }}
                >
                  <Button
                    className={`w-full h-12 text-sm font-semibold transition-all duration-200 ${
                      pkg.highlighted
                        ? "shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02]"
                        : "hover:scale-[1.02]"
                    }`}
                    variant={pkg.highlighted ? "default" : "outline"}
                    size="lg"
                    onClick={() => onSelect?.(pkg.id)}
                  >
                    {pkg.id === "basic" ? "No Protection" : "Select Package"}
                    {pkg.highlighted && <Sparkles className="w-4 h-4 ml-1.5" />}
                  </Button>
                </div>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/* ── Main export ── */
export function ProtectionComparisonTable({ onSelectPackage }: ProtectionComparisonTableProps) {
  return (
    <>
      {/* Desktop: full comparison table */}
      <div className="hidden md:block">
        <DesktopTable onSelect={onSelectPackage} />
      </div>

      {/* Mobile: expandable cards */}
      <div className="md:hidden space-y-3">
        {PROTECTION_PACKAGES.map((pkg, i) => (
          <MobilePackageCard key={pkg.id} pkg={pkg} index={i} onSelect={onSelectPackage} />
        ))}
      </div>
    </>
  )
}
