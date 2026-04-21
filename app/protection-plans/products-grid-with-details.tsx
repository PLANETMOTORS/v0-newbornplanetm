"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Shield, FileText, Car, LockKeyhole, PaintBucket,
  Sparkles, Droplets, CircleDot, Wrench,
  CheckCircle2, X, ChevronDown, Phone,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PROTECTION_PRODUCTS, type ProtectionProduct } from "@/lib/protection-products"

const ICON_MAP: Record<string, typeof Shield> = {
  "gap-coverage": Shield,
  "extended-warranty": FileText,
  "incident-pro": Car,
  "anti-theft": LockKeyhole,
  "paint-protection": PaintBucket,
  "replacement-warranty": Sparkles,
  "rust-protection": Droplets,
  "tire-rim-protection": CircleDot,
  "window-tint": Wrench,
}

/* ── Inline Detail Panel ── */
function ProductDetailPanel({ product, onClose }: { product: ProtectionProduct; onClose: () => void }) {
  return (
    <Card className="border-primary/20 shadow-xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header bar */}
        <div className="bg-primary/5 border-b border-primary/10 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <product.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.tagline}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Close details">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 lg:p-8 space-y-10">
          {/* Description */}
          <p className="text-muted-foreground leading-relaxed max-w-3xl">{product.heroDescription}</p>

          {/* How it works */}
          <div>
            <h4 className="font-bold text-lg mb-5">How It Works</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              {product.howItWorks.map((step) => (
                <div key={step.step} className="bg-muted/50 rounded-lg p-4 relative">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mb-3">
                    {step.step}
                  </div>
                  <h5 className="font-semibold text-sm mb-1">{step.title}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Covered / Not Covered */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" /> What&apos;s Covered
              </h4>
              <ul className="space-y-2">
                {product.covered.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" /> Not Covered
              </h4>
              <ul className="space-y-2">
                {product.notCovered.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="font-bold text-lg mb-5">Key Benefits</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              {product.benefits.map((b) => (
                <div key={b.title} className="bg-muted/50 rounded-lg p-4">
                  <h5 className="font-semibold text-sm mb-1">{b.title}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product FAQs */}
          <div>
            <h4 className="font-bold text-lg mb-5">Frequently Asked Questions</h4>
            <div className="space-y-3">
              {product.faqs.map((faq) => (
                <div key={faq.question} className="bg-muted/30 rounded-lg p-4 border border-border/40">
                  <h5 className="font-semibold text-sm mb-1">{faq.question}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border/40">
            <Button size="lg" asChild>
              <a href="tel:1-866-797-3332">
                <Phone className="w-4 h-4 mr-2" />
                {product.ctaText}
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#compare">Compare Packages</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductsGridWithDetails() {
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  // Listen for hash changes
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.replace("#product-", "")
      if (hash && PROTECTION_PRODUCTS.some((p) => p.slug === hash)) {
        setOpenSlug(hash)
      }
    }
    handleHash()
    window.addEventListener("hashchange", handleHash)
    return () => window.removeEventListener("hashchange", handleHash)
  }, [])

  // Scroll detail panel into view when opened
  useEffect(() => {
    if (openSlug && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }, [openSlug])

  const handleToggle = useCallback((slug: string) => {
    setOpenSlug((prev) => (prev === slug ? null : slug))
  }, [])

  const openProduct = openSlug
    ? PROTECTION_PRODUCTS.find((p) => p.slug === openSlug)
    : null

  return (
    <section className="py-16 lg:py-24 bg-muted/30" id="product-details">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-xs">À La Carte</Badge>
          <h2 className="font-serif text-3xl md:text-4xl font-bold">
            Individual Protection Products
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Customize your coverage with standalone products — click any product for full details.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROTECTION_PRODUCTS.map((product) => {
            const Icon = ICON_MAP[product.slug] || product.icon
            const isActive = openSlug === product.slug
            return (
              <button
                key={product.slug}
                onClick={() => handleToggle(product.slug)}
                className={`text-left w-full rounded-xl border transition-all duration-300 p-5 group ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20"
                    : "border-border/60 bg-background hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 group-hover:bg-primary/15"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{product.description}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      isActive ? "text-primary" : "text-primary"
                    }`}>
                      {isActive ? "Hide details" : "Learn More"}
                      <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isActive ? "rotate-180" : ""}`} />
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Inline Detail Panel — expands below the grid */}
        {openProduct && (
          <div
            ref={detailRef}
            className="mt-8 scroll-mt-24 animate-in slide-in-from-top-4 fade-in duration-300"
          >
            <ProductDetailPanel
              product={openProduct}
              onClose={() => setOpenSlug(null)}
            />
          </div>
        )}
      </div>
    </section>
  )
}
