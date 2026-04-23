import { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ | Planet Motors - Frequently Asked Questions",
  description: "Find answers to common questions about buying, financing, trade-ins, delivery, warranties, and returns at Planet Motors.",
  alternates: {
    canonical: '/faq',
  },
}

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FAQJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { RATE_FLOOR_DISPLAY } from "@/lib/rates"
import { PHONE_TOLL_FREE } from "@/lib/constants/dealership"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ShoppingCart, CreditCard, Truck, RotateCcw, Shield, Wrench, HelpCircle } from "lucide-react"

const faqCategories = [
  {
    name: "Buying",
    icon: ShoppingCart,
    faqs: [
      {
        question: "How do I purchase a vehicle from Planet Motors?",
        answer: "You can browse our inventory online, select your vehicle, and complete the purchase process digitally. Reserve your vehicle with a $250 refundable deposit, complete financing if needed, and we will deliver the car to your door or you can pick it up from our Richmond Hill location."
      },
      {
        question: "Can I test drive before buying?",
        answer: "Yes! You can schedule a test drive at our Richmond Hill showroom, or take advantage of our 10-day return policy - essentially a 10-day test drive. If you are not completely satisfied, return the vehicle for a full refund."
      },
      {
        question: "What is the $250 reservation deposit?",
        answer: "The $250 deposit reserves your chosen vehicle while you complete the purchase process. It is fully refundable if you decide not to proceed and is applied to your purchase price if you do."
      }
    ]
  },
  {
    name: "Returns/Warranty",
    icon: RotateCcw,
    faqs: [
      {
        question: "What is the 10-day money-back guarantee?",
        answer: "You have 10 days from delivery to return your vehicle for a full refund, no questions asked. This gives you time to ensure the vehicle meets your expectations. The vehicle must be returned in the same condition with no more than 500km added."
      },
      {
        question: "What warranty coverage is included?",
        answer: "All vehicles come with the remainder of the manufacturer warranty if applicable. We also offer extended protection plans ranging from Basic (powertrain) to Ultimate (comprehensive bumper-to-bumper) coverage."
      },
      {
        question: "How do I initiate a return?",
        answer: `Contact our customer service team at ${PHONE_TOLL_FREE} or through our website chat. We will arrange free pickup of the vehicle and process your refund within 5-7 business days.`
      }
    ]
  },
  {
    name: "Financing",
    icon: CreditCard,
    faqs: [
      {
        question: "What financing options are available?",
        answer: `We work with 20+ Canadian lenders including major banks, credit unions, and specialized auto finance companies. Rates start as low as ${RATE_FLOOR_DISPLAY} APR depending on your credit profile. Get pre-approved in minutes with no impact to your credit score.`
      },
      {
        question: "Can I get approved with bad credit?",
        answer: "Yes, we work with customers across the credit spectrum. Our lending partners offer options for various credit situations. Fill out a pre-approval application to see what options are available to you."
      },
      {
        question: "Can I use my own financing?",
        answer: "Absolutely! You are welcome to arrange your own financing through your bank or credit union. Just let us know during the purchase process and we will work with your lender."
      }
    ]
  },
  {
    name: "Delivery",
    icon: Truck,
    faqs: [
      {
        question: "Where do you deliver?",
        answer: "We deliver anywhere in Canada! Delivery within 300km of our Richmond Hill location is FREE. Beyond that, delivery costs are calculated based on distance at competitive rates starting at $0.70/km."
      },
      {
        question: "How long does delivery take?",
        answer: "Delivery times vary by location: 1-2 days within 300km, 3-5 days for 300-1000km, 5-7 days for 1000-2500km, and 7-10 days for locations beyond 2500km."
      },
      {
        question: "Can I pick up my vehicle instead?",
        answer: "Yes! You can pick up your vehicle from our Richmond Hill showroom at 30 Major Mackenzie Dr E. We will have it cleaned, fueled, and ready for you."
      }
    ]
  },
  {
    name: "Inspection",
    icon: Shield,
    faqs: [
      {
        question: "What is the 210-point inspection?",
        answer: "Every vehicle undergoes our comprehensive 210-point inspection covering exterior, interior, mechanical, electrical, safety systems, and a road test. This ensures every car meets our quality standards before being listed."
      },
      {
        question: "Can I see the inspection report?",
        answer: "Yes! Every vehicle listing includes a detailed inspection report. You can also request the full PDF report which includes photos and technician notes for each inspection point."
      },
      {
        question: "Do you recondition vehicles?",
        answer: "Yes, any issues found during inspection are addressed before the vehicle is listed. We invest in reconditioning to ensure every car is in excellent condition, including cosmetic touch-ups and mechanical repairs as needed."
      }
    ]
  },
  {
    name: "Trade-In",
    icon: Wrench,
    faqs: [
      {
        question: "How does trade-in work?",
        answer: "Get an instant trade-in offer by entering your vehicle details on our trade-in page. We offer competitive prices and will pick up your trade-in for free when we deliver your new vehicle."
      },
      {
        question: "Can I sell without buying?",
        answer: "Yes! We buy vehicles even if you are not purchasing from us. Get a quote online and if you accept, we will arrange free pickup and payment."
      },
      {
        question: "When do I get paid for my trade-in?",
        answer: "Payment for your trade-in is processed within 24-48 hours of vehicle pickup. We can pay via e-Transfer, cheque, or apply the value directly to your new vehicle purchase."
      }
    ]
  }
]

// Flatten all FAQ items for JSON-LD
const allFaqs = faqCategories.flatMap(category => category.faqs)

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <FAQJsonLd faqs={allFaqs} />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }]} />
      <Header />

      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] text-primary-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Find answers to common questions about buying, financing, and delivery.
            </p>
            <div className="max-w-md mx-auto flex gap-2">
              <Input
                placeholder="Search FAQs..."
                className="bg-background"
              />
              <Button variant="secondary" aria-label="Search FAQs">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Category Quick Links */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4">
              {faqCategories.map((category) => (
                <a
                  key={category.name}
                  href={`#${category.name.toLowerCase()}`}
                  className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                >
                  <category.icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto space-y-12">
              {faqCategories.map((category) => (
                <Card key={category.name} id={category.name.toLowerCase()}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <category.icon className="h-5 w-5 text-primary" />
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Our team is here to help. Reach out and we will get back to you as soon as possible.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button>
                Chat With Us
              </Button>
              <Button variant="outline">
                Call {PHONE_TOLL_FREE}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
