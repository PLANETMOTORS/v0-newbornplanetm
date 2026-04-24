import { notFound } from "next/navigation"
import Link from "next/link"
import Script from "next/script"
import { CheckCircle2, X, ArrowRight, Phone, ArrowLeft, Shield } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getProductBySlug, getAllProductSlugs, PROTECTION_PRODUCTS, WARRANTY_COVERAGE_MATRIX } from "@/lib/protection-products"
import { getPublicSiteUrl } from "@/lib/site-url"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL, DEALERSHIP_LOCATION } from "@/lib/constants/dealership"

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return { title: "Not Found" }

  const siteUrl = getPublicSiteUrl()
  return {
    title: product.seo.title,
    description: product.seo.description,
    keywords: product.seo.keywords,
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: product.seo.title,
      description: product.seo.description,
      url: `${siteUrl}/protection-plans/${slug}`,
      siteName: "Planet Motors",
      locale: "en_CA",
      type: "website",
    },
    alternates: {
      canonical: `${siteUrl}/protection-plans#product-${slug}`,
    },
  }
}

export default async function ProtectionProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const siteUrl = getPublicSiteUrl()
  const Icon = product.icon

  // Get related products (exclude current)
  const relatedProducts = PROTECTION_PRODUCTS.filter((p) => p.slug !== slug).slice(0, 3)

  // JSON-LD schemas
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: product.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: product.name,
    description: product.heroDescription,
    provider: {
      "@type": "AutoDealer",
      name: "Planet Motors",
      url: siteUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: DEALERSHIP_LOCATION.streetAddress,
        addressLocality: DEALERSHIP_LOCATION.city,
        addressRegion: DEALERSHIP_LOCATION.province,
        postalCode: DEALERSHIP_LOCATION.postalCode,
        addressCountry: "CA",
      },
    },
    areaServed: { "@type": "Country", name: "Canada" },
    url: `${siteUrl}/protection-plans/${slug}`,
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Protection Plans", item: `${siteUrl}/protection-plans` },
      { "@type": "ListItem", position: 3, name: product.shortName, item: `${siteUrl}/protection-plans/${slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Script id={`faq-jsonld-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`product-jsonld-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Script id={`breadcrumb-jsonld-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main id="main-content" tabIndex={-1} className="pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/protection-plans" className="hover:text-foreground transition-colors">Protection Plans</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">{product.shortName}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">PlanetCare Protection</Badge>
                <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] text-balance">
                  {product.name}
                </h1>
                <p className="mt-3 text-xl text-primary-foreground/90 font-semibold">
                  {product.tagline}
                </p>
                <p className="mt-6 text-primary-foreground/75 text-lg leading-relaxed max-w-xl">
                  {product.heroDescription}
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href={`/contact?product=${encodeURIComponent(product.name)}`}>
                      {product.ctaText} <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                    <a href={`tel:${PHONE_TOLL_FREE_TEL}`}>
                      <Phone className="mr-2 w-4 h-4" /> Call {PHONE_TOLL_FREE}
                    </a>
                  </Button>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center">
                <div className="w-64 h-64 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Icon className="w-32 h-32 text-primary-foreground/30" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Simple Process</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Getting protected is easy. Here&apos;s how {product.shortName} works in three simple steps.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {product.howItWorks.map((step) => (
                <div key={step.step} className="relative text-center">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                    {step.step}
                  </div>
                  {step.step < product.howItWorks.length && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-border" />
                  )}
                  <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coverage Comparison Table — Carvana-style */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Coverage Details</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">What&apos;s Covered</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Transparent coverage details so you know exactly what&apos;s included.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Covered Column */}
              <Card className="border-green-200 dark:border-green-900">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-lg text-green-700 dark:text-green-400">Covered ✔</h3>
                  </div>
                  <ul className="space-y-3">
                    {product.covered.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Not Covered Column */}
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="font-semibold text-lg text-red-700 dark:text-red-400">Not Covered ✕</h3>
                  </div>
                  <ul className="space-y-3">
                    {product.notCovered.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Component Coverage Matrix — Extended Warranty only */}
        {slug === "extended-warranty" && (
          <section className="py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">Detailed Coverage</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Component-Level Coverage
                </h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                  Every major system. Every critical part. Here&apos;s exactly what&apos;s protected under your Extended Vehicle Warranty.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {WARRANTY_COVERAGE_MATRIX.map((cat) => (
                  <Card key={cat.category} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="bg-primary/5 border-b px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" role="img" aria-label={cat.category}>{cat.icon}</span>
                        <h3 className="font-semibold text-lg">{cat.category}</h3>
                        <span className="ml-auto text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
                          {cat.components.length} parts
                        </span>
                      </div>
                    </div>
                    <CardContent className="pt-4 pb-5">
                      <ul className="space-y-2">
                        {cat.components.map((part) => (
                          <li key={part} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm leading-relaxed">{part}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Summary stat bar */}
              <div className="mt-10 bg-primary/5 rounded-2xl border p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {WARRANTY_COVERAGE_MATRIX.reduce((sum, cat) => sum + cat.components.length, 0)}+
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Covered Components</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">{WARRANTY_COVERAGE_MATRIX.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">System Categories</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">$0</div>
                    <div className="text-sm text-muted-foreground mt-1">Deductible Option</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">24/7</div>
                    <div className="text-sm text-muted-foreground mt-1">Roadside Assistance</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Benefits */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Why Choose This</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Key Benefits</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {product.benefits.map((benefit) => (
                <div key={benefit.title} className="text-center group">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-muted-foreground">
                Common questions about {product.shortName} coverage.
              </p>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {product.faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${index}`}
                  className="bg-background rounded-xl border px-6 data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-base font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Related Products */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Explore More Protection
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Complete your protection with additional coverage options.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((related) => {
                const RelIcon = related.icon
                return (
                  <Card key={related.slug} className="hover:shadow-lg transition-shadow group">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <RelIcon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">{related.shortName}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{related.description}</p>
                      <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                        <Link href={`/protection-plans/${related.slug}`}>
                          Learn More <ArrowRight className="ml-2 w-3 h-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Protect Your Vehicle?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Get a personalized {product.shortName} quote today. Our team will help you choose the right coverage for your vehicle and budget.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/contact?product=${encodeURIComponent(product.name)}`}>
                  {product.ctaText} <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <a href={`tel:${PHONE_TOLL_FREE_TEL}`}>
                  <Phone className="mr-2 w-4 h-4" /> Call Now
                </a>
              </Button>
            </div>
            <div className="mt-8">
              <Button variant="link" className="text-primary-foreground/60 hover:text-primary-foreground" asChild>
                <Link href="/protection-plans">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back to All Protection Plans
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
