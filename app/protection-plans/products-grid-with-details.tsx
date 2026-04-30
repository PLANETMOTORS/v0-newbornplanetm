"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Shield, FileText, Car, LockKeyhole, PaintBucket,
  Sparkles, Droplets, CircleDot, Wrench,
  CheckCircle2, XCircle, ChevronDown, Phone, Star, Zap,
  ArrowRight, X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { PROTECTION_PRODUCTS, type ProtectionProduct } from "@/lib/protection-products"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

/* ── Icon + colour map per product ── */
const PRODUCT_META: Record<string, { icon: typeof Shield; gradient: string; accent: string }> = {
  "gap-coverage":          { icon: Shield,      gradient: "from-blue-600 to-indigo-700",    accent: "bg-blue-50 text-blue-700 border-blue-200" },
  "extended-warranty":     { icon: FileText,    gradient: "from-emerald-600 to-teal-700",   accent: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "incident-pro":          { icon: Car,         gradient: "from-orange-500 to-red-600",     accent: "bg-orange-50 text-orange-700 border-orange-200" },
  "anti-theft":            { icon: LockKeyhole, gradient: "from-violet-600 to-purple-700",  accent: "bg-violet-50 text-violet-700 border-violet-200" },
  "paint-protection":      { icon: PaintBucket, gradient: "from-cyan-500 to-blue-600",      accent: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  "replacement-warranty":  { icon: Sparkles,    gradient: "from-amber-500 to-orange-600",   accent: "bg-amber-50 text-amber-700 border-amber-200" },
  "rust-protection":       { icon: Droplets,    gradient: "from-sky-500 to-blue-600",       accent: "bg-sky-50 text-sky-700 border-sky-200" },
  "tire-rim-protection":   { icon: CircleDot,   gradient: "from-rose-500 to-pink-600",      accent: "bg-rose-50 text-rose-700 border-rose-200" },
  "window-tint":           { icon: Wrench,      gradient: "from-slate-600 to-gray-700",     accent: "bg-slate-50 text-slate-700 border-slate-200" },
}

/* ── Inline Detail Panel — Senior-Level Design ── */
function ProductDetailPanel({ product, onClose }: Readonly<{ product: ProtectionProduct; onClose: () => void }>) {
  const meta = PRODUCT_META[product.slug] || { icon: Shield, gradient: "from-primary to-primary/80", accent: "bg-primary/5 text-primary border-primary/20" }
  const Icon = meta.icon

  return (
    <article
      className="rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden"
      aria-label={`${product.name} — full details`}
    >
      {/* ▸ Gradient hero header */}
      <div className={`relative bg-linear-to-r ${meta.gradient} px-6 py-8 sm:px-8 sm:py-10`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{product.name}</h3>
              <p className="text-white/80 text-sm mt-1">{product.tagline}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors ring-1 ring-white/20 shrink-0"
            aria-label="Close details"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10 space-y-10">
        {/* ▸ Overview */}
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
          {product.heroDescription}
        </p>

        {/* ▸ How It Works — numbered timeline */}
        <section>
          <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> How It Works
          </h4>
          <div className="grid sm:grid-cols-3 gap-5">
            {product.howItWorks.map((step) => (
              <div key={step.step} className="relative bg-muted/40 rounded-xl p-5 border border-border/40 hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-full bg-linear-to-br ${meta.gradient} text-white text-sm font-bold flex items-center justify-center mb-4 shadow-sm`}>
                  {step.step}
                </div>
                <h5 className="font-semibold text-sm mb-1.5">{step.title}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ▸ Coverage — side-by-side */}
        <section className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <div className="rounded-xl border border-green-200/60 bg-green-50/30 p-5 sm:p-6">
            <h4 className="font-bold text-base mb-4 flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5 text-green-600" /> What&apos;s Covered
            </h4>
            <ul className="space-y-2.5">
              {product.covered.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-200/60 bg-red-50/20 p-5 sm:p-6">
            <h4 className="font-bold text-base mb-4 flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5 text-red-500" /> Not Covered
            </h4>
            <ul className="space-y-2.5">
              {product.notCovered.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Separator />

        {/* ▸ Key Benefits — feature cards */}
        <section>
          <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> Key Benefits
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {product.benefits.map((b) => (
              <div key={b.title} className="group rounded-xl border border-border/50 bg-card p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200">
                <h5 className="font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors">{b.title}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ▸ Product FAQs — proper Radix Accordion */}
        <section>
          <h4 className="text-xl font-bold mb-6">Frequently Asked Questions</h4>
          <Accordion type="single" collapsible className="space-y-3">
            {product.faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="bg-muted/30 rounded-xl border border-border/40 px-5 data-[state=open]:shadow-sm data-[state=open]:border-primary/20"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 text-sm font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ▸ CTA bar */}
        <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-border/40">
          <Button size="lg" className="h-12 px-6 text-sm font-semibold shadow-md" asChild>
            <a href={`tel:${PHONE_TOLL_FREE_TEL}`}>
              <Phone className="w-4 h-4 mr-2" />
              {product.ctaText}
            </a>
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold" asChild>
            <a href="#compare">
              Compare Packages <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <span className="hidden sm:inline-flex text-xs text-muted-foreground ml-auto">
            Or call <strong className="ml-1">{PHONE_TOLL_FREE}</strong>
          </span>
        </div>
      </div>
    </article>
  )
}

export function ProductsGridWithDetails() {
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  // Listen for hash changes
  useEffect(() => {
    function handleHash() {
      const hash = globalThis.location.hash.replaceAll("#product-", "")
      if (hash && PROTECTION_PRODUCTS.some((p) => p.slug === hash)) {
        setOpenSlug(hash)
      }
    }
    handleHash()
    globalThis.addEventListener("hashchange", handleHash)
    return () => globalThis.removeEventListener("hashchange", handleHash)
  }, [])

  // Scroll detail panel into view when opened
  useEffect(() => {
    if (openSlug && detailRef.current) {
      const timer = setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [openSlug])

  const handleToggle = useCallback((slug: string) => {
    setOpenSlug((prev) => (prev === slug ? null : slug))
  }, [])

  return (
    <section className="py-16 lg:py-24 bg-muted/30" id="product-details">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-xs tracking-wider uppercase">À La Carte Protection</Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Individual Protection Products
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Customize your coverage with standalone products — click any product for full details, coverage breakdowns, and FAQs.
          </p>
        </div>

        {/* Product Cards Grid */}
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0" aria-label="Protection products">
          {PROTECTION_PRODUCTS.map((product) => {
            const meta = PRODUCT_META[product.slug]
            const Icon = meta?.icon || product.icon
            const isActive = openSlug === product.slug
            return (
              <li key={product.slug}>
              <button
                type="button"
                id={`product-${product.slug}`}
                onClick={() => handleToggle(product.slug)}
                aria-expanded={isActive}
                aria-controls={isActive ? `detail-${product.slug}` : undefined}
                className={`text-left w-full rounded-2xl border-2 transition-all duration-300 p-5 group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-transparent bg-background shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${
                    isActive
                      ? `bg-linear-to-br ${meta?.gradient || "from-primary to-primary/80"} text-white shadow-md`
                      : "bg-muted group-hover:bg-primary/10"
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? "" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1 leading-tight">{product.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{product.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      {isActive ? "Hide details" : "View full details"}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? "rotate-180" : ""}`} />
                    </span>
                  </div>
                </div>
              </button>
              </li>
            )
          })}
        </ul>

        {/* Inline Detail Panels — all 9 rendered for SEO, only active one visible */}
        {PROTECTION_PRODUCTS.map((product) => {
          const isActive = openSlug === product.slug
          return (
            <section
              key={product.slug}
              id={`detail-${product.slug}`}
              ref={isActive ? detailRef : undefined}
              className={`mt-10 scroll-mt-24 ${isActive ? "animate-in slide-in-from-top-4 fade-in duration-300" : "hidden"}`}
              aria-label={`${product.name} details`}
              aria-hidden={!isActive}
            >
              <ProductDetailPanel
                product={product}
                onClose={() => setOpenSlug(null)}
              />
            </section>
          )
        })}
      </div>
    </section>
  )
}
