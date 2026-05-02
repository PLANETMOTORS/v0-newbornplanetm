 
"use client"

import { Fragment, useState } from "react"
import { CheckCircle, X, Shield, ChevronDown, Sparkles, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  PROTECTION_PACKAGES,
  COMPARISON_ROWS,
  type ProtectionPackage,
} from "@/lib/constants/protection-packages"

interface ProtectionComparisonTableProps {
  onSelectPackage?: (packageId: string) => void
}

/* ── Tier visual configs ── */
const TIER_STYLES: Record<string, {
  headerBg: string; ring: string; iconBg: string; iconColor: string
  badgeBg: string; badgeText: string; colBg: string; colHoverBg: string
}> = {
  basic: {
    headerBg: "bg-slate-50 dark:bg-slate-900",
    ring: "ring-slate-200 dark:ring-slate-700",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-500 dark:text-slate-400",
    badgeBg: "", badgeText: "",
    colBg: "", colHoverBg: "",
  },
  essential: {
    headerBg: "bg-blue-50/80 dark:bg-blue-950/50",
    ring: "ring-blue-200 dark:ring-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "", badgeText: "",
    colBg: "bg-blue-50/30 dark:bg-blue-950/20",
    colHoverBg: "group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/30",
  },
  certified: {
    headerBg: "bg-primary/5",
    ring: "ring-primary/30",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    badgeBg: "bg-primary",
    badgeText: "text-white",
    colBg: "bg-primary/[0.03]",
    colHoverBg: "group-hover:bg-primary/[0.06]",
  },
  "certified-plus": {
    headerBg: "bg-amber-50/80 dark:bg-amber-950/30",
    ring: "ring-amber-300/60 dark:ring-amber-700",
    iconBg: "bg-amber-100 dark:bg-amber-900",
    iconColor: "text-amber-600 dark:text-amber-500",
    badgeBg: "bg-linear-to-r from-amber-500 to-amber-600",
    badgeText: "text-white",
    colBg: "bg-amber-50/20 dark:bg-amber-950/10",
    colHoverBg: "group-hover:bg-amber-50/40 dark:group-hover:bg-amber-950/20",
  },
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

function CellValue({ pkg, rowKey }: Readonly<{ pkg: ProtectionPackage; rowKey: string }>) {
  switch (rowKey) {
    case "paymentMethod":
      return <span className="text-xs sm:text-sm font-semibold">{getPaymentMethodLabel(pkg.paymentMethod)}</span>
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
function MobilePackageCard({ pkg, index, onSelect }: Readonly<{ pkg: ProtectionPackage; index: number; onSelect?: (id: string) => void }>) {
  const [expanded, setExpanded] = useState(pkg.highlighted)
  const style = TIER_STYLES[pkg.id] || TIER_STYLES.basic

  return (
    <div
      className={`rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 border ${
        pkg.highlighted
          ? "border-primary/30 ring-2 ring-primary/20 shadow-lg shadow-primary/10"
          : "border-border shadow-sm"
      }`}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      {/* Badge above header */}
      {pkg.badge && (
        <div className={`flex justify-center py-1.5 ${
          pkg.highlighted ? "bg-primary" : "bg-linear-to-r from-amber-500 to-amber-600"
        }`}>
          <span className="text-[11px] font-semibold text-white flex items-center gap-1">
            {pkg.highlighted && <Star className="w-3 h-3 fill-current" />}
            {pkg.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-5 ${style.headerBg} flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center`}>
            <Shield className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          <div className="text-left">
            <span className="font-bold text-base block">{pkg.name}</span>
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
          <div className="p-5 space-y-3 border-t border-border/50">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <CellValue pkg={pkg} rowKey={row.key} />
              </div>
            ))}
            <div className="pt-3">
              <Button
                className={`w-full h-12 text-base font-semibold ${
                  pkg.highlighted ? "shadow-md shadow-primary/20" : ""
                }`}
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


/* ── Desktop comparison table — card-column layout ── */
function DesktopTable({ onSelect }: Readonly<{ onSelect?: (id: string) => void }>) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Use CSS grid so badge overflow is never clipped */}
      <div className="grid grid-cols-[220px_repeat(4,1fr)] gap-0 min-w-210">

        {/* ── Column headers ── */}
        {/* Label column header */}
        <div className="flex items-end pb-6 pr-4">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Features</span>
        </div>

        {/* Package column headers */}
        {PROTECTION_PACKAGES.map((pkg, i) => {
          const style = TIER_STYLES[pkg.id] || TIER_STYLES.basic
          return (
            <div
              key={pkg.id}
              className={`relative text-center px-2 pb-0 animate-in fade-in slide-in-from-bottom-2`}
              style={{ animationDelay: `${100 + i * 80}ms`, animationFillMode: "both" }}
            >
              {/* Badge — sits above the card, never clipped */}
              {pkg.badge && (
                <div className="flex justify-center mb-2">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm ${
                    pkg.highlighted
                      ? "bg-primary text-primary-foreground shadow-primary/25"
                      : "bg-linear-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/25"
                  }`}>
                    {pkg.highlighted && <Star className="w-3 h-3 fill-current" />}
                    {pkg.badge}
                  </span>
                </div>
              )}
              {/* Spacer when no badge so cards align */}
              {!pkg.badge && <div className="h-7.5" />}

              {/* Card header */}
              <div className={`rounded-2xl ${style.headerBg} border ${
                pkg.highlighted ? "border-primary/30 shadow-lg shadow-primary/10 ring-1 ring-primary/20" : "border-border"
              } p-5 pb-4`}>
                <div className={`w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center mx-auto mb-3`}>
                  <Shield className={`w-5 h-5 ${style.iconColor}`} />
                </div>
                <div className="font-bold text-[15px] leading-tight">{pkg.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {(() => {
                    if (pkg.id === "basic") return "Cash buyers"
                    if (pkg.paymentMethod === "finance") return "Finance buyers"
                    return "Cash & finance"
                  })()}
                </div>
                {pkg.priceFrom > 0 ? (
                  <div className="mt-3">
                    <span className="text-2xl font-bold tracking-tight">${pkg.priceFrom.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">starting from</span>
                  </div>
                ) : (
                  <div className="mt-3">
                    <span className="text-xl font-semibold text-muted-foreground">No cost</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* ── Feature rows ── */}
        {COMPARISON_ROWS.map((row, ri) => (
          <Fragment key={row.key}>
            {/* Label cell */}
            <div
              className={`flex items-center text-sm font-medium text-foreground px-1 py-3.5 border-b border-border/40 ${ri === 0 ? "mt-4 border-t border-border/40" : ""}`}
            >
              {row.label}
            </div>

            {/* Value cells */}
            {PROTECTION_PACKAGES.map((pkg) => {
              const style = TIER_STYLES[pkg.id] || TIER_STYLES.basic
              return (
                <div
                  key={`${row.key}-${pkg.id}`}
                  className={`group flex items-center justify-center text-center py-3.5 px-2 border-b border-border/40 transition-colors ${style.colBg} ${style.colHoverBg} ${ri === 0 ? "mt-4 border-t border-border/40" : ""} ${
                    pkg.highlighted ? "bg-primary/2" : ""
                  }`}
                >
                  <CellValue pkg={pkg} rowKey={row.key} />
                </div>
              )
            })}
          </Fragment>
        ))}

        {/* ── CTA footer row ── */}
        <div className="pt-5" />
        {PROTECTION_PACKAGES.map((pkg, i) => {
          const style = TIER_STYLES[pkg.id] || TIER_STYLES.basic
          return (
            <div
              key={`cta-${pkg.id}`}
              className={`pt-5 px-2 animate-in fade-in slide-in-from-bottom-2 ${style.colBg}`}
              style={{ animationDelay: `${500 + i * 100}ms`, animationFillMode: "both" }}
            >
              <Button
                className={`w-full h-11 text-sm font-semibold transition-all duration-200 ${
                  pkg.highlighted
                    ? "shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.01]"
                    : "hover:scale-[1.01]"
                }`}
                variant={pkg.highlighted ? "default" : "outline"}
                size="lg"
                onClick={() => onSelect?.(pkg.id)}
              >
                {pkg.id === "basic" ? "No Protection" : "Select Package"}
                {pkg.highlighted && <Sparkles className="w-4 h-4 ml-1.5" />}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main export ── */
export function ProtectionComparisonTable({ onSelectPackage }: Readonly<ProtectionComparisonTableProps>) {
  return (
    <>
      {/* Desktop: full comparison grid — overflow-x-auto with visible y for badges */}
      <div className="hidden md:block overflow-x-auto overflow-y-visible">
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
