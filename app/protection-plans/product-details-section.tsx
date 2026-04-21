"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, X, ChevronDown, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PROTECTION_PRODUCTS, type ProtectionProduct } from "@/lib/protection-products"

export function ProductDetailsSection() {
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  // Listen for hash changes to open the right product
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

  // Scroll into view when a product opens
  useEffect(() => {
    if (openSlug) {
      const el = document.getElementById(`product-${openSlug}`)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
      }
    }
  }, [openSlug])

  return (
    <section className="py-16 lg:py-24 bg-muted/30" id="product-details">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-xs">Product Details</Badge>
          <h2 className="font-serif text-3xl md:text-4xl font-bold">
            Explore Each Protection Product
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Click any product to see full details — what&apos;s covered, how it works, and frequently asked questions.
          </p>
        </div>

        <div className="space-y-4">
          {PROTECTION_PRODUCTS.map((product) => (
            <ProductAccordion
              key={product.slug}
              product={product}
              isOpen={openSlug === product.slug}
              onToggle={() => setOpenSlug(openSlug === product.slug ? null : product.slug)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductAccordion({
  product,
  isOpen,
  onToggle,
}: {
  product: ProtectionProduct
  isOpen: boolean
  onToggle: () => void
}) {
  const Icon = product.icon

  return (
    <div id={`product-${product.slug}`} className="scroll-mt-24">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 bg-background rounded-xl border border-border hover:border-primary/30 transition-all duration-300 text-left group"
        aria-expanded={isOpen}
      >
        <div className="w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center flex-shrink-0 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base">{product.name}</h3>
          <p className="text-sm text-muted-foreground">{product.tagline}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="mt-2 bg-background rounded-xl border border-border p-6 md:p-8 animate-in slide-in-from-top-2 duration-300">
          {/* Hero description */}
          <p className="text-muted-foreground leading-relaxed mb-8 text-base max-w-3xl">
            {product.heroDescription}
          </p>

          {/* How It Works */}
          <div className="mb-10">
            <h4 className="font-bold text-lg mb-5">How It Works</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              {product.howItWorks.map((step) => (
                <Card key={step.step} className="border-border/60">
                  <CardContent className="p-5">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-3">
                      {step.step}
                    </div>
                    <h5 className="font-semibold text-sm mb-1">{step.title}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Covered / Not Covered */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <h4 className="font-bold text-base mb-4 flex items-center gap-2">
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
              <h4 className="font-bold text-base mb-4 flex items-center gap-2">
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
          <div className="mb-10">
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
          <div className="mb-8">
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
      )}
    </div>
  )
}
