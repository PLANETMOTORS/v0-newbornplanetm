import Link from "next/link"
import { CheckCircle, Shield, Clock, Phone, Car, Wrench, Zap, Award } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Protection Plans | Planet Motors",
  description: "Comprehensive vehicle protection plans to safeguard your investment. Choose from Basic, Premium, or Ultimate coverage options.",
}

const plans = [
  {
    id: "basic",
    name: "Basic Coverage",
    price: 29,
    period: "/month",
    description: "Essential protection for peace of mind",
    icon: Shield,
    features: [
      { name: "Powertrain coverage", description: "Engine, transmission, and drive axle protection" },
      { name: "24/7 roadside assistance", description: "Towing, jump starts, tire changes, lockout service" },
      { name: "Trip interruption coverage", description: "Up to $100/day for lodging and meals" },
      { name: "Rental car reimbursement", description: "Up to $35/day while your vehicle is being repaired" },
    ],
    highlighted: false,
    terms: "12-month minimum commitment. Coverage begins after 30-day waiting period.",
  },
  {
    id: "premium",
    name: "Premium Coverage",
    price: 59,
    period: "/month",
    description: "Comprehensive protection for your vehicle",
    icon: Award,
    features: [
      { name: "Everything in Basic", description: "All Basic coverage features included" },
      { name: "Electrical system coverage", description: "All major electrical components protected" },
      { name: "Air conditioning coverage", description: "Complete A/C system protection" },
      { name: "Suspension coverage", description: "Shocks, struts, and steering components" },
      { name: "Brake system coverage", description: "Master cylinder, calipers, and ABS" },
    ],
    highlighted: true,
    terms: "12-month minimum commitment. $100 deductible per repair visit.",
  },
  {
    id: "ultimate",
    name: "Ultimate Coverage",
    price: 99,
    period: "/month",
    description: "Complete bumper-to-bumper protection",
    icon: Zap,
    features: [
      { name: "Everything in Premium", description: "All Premium coverage features included" },
      { name: "Full mechanical coverage", description: "Nearly all mechanical components covered" },
      { name: "Electronics & technology", description: "Navigation, sensors, cameras, and displays" },
      { name: "Interior components", description: "Power seats, windows, locks, and mirrors" },
      { name: "Appearance protection", description: "Dent repair, windshield chips, and paint touch-ups" },
      { name: "Zero deductible option", description: "Pay nothing at the time of repair" },
    ],
    highlighted: false,
    terms: "12-month minimum commitment. Transferable coverage adds resale value.",
  },
]

const benefits = [
  {
    icon: Wrench,
    title: "Nationwide Network",
    description: "Access to over 30,000 certified repair facilities across the country.",
  },
  {
    icon: Clock,
    title: "Quick Claims",
    description: "Most claims approved within 24 hours. Direct payment to repair facility.",
  },
  {
    icon: Phone,
    title: "24/7 Support",
    description: "Our dedicated support team is available around the clock to assist you.",
  },
  {
    icon: Car,
    title: "Transferable",
    description: "Coverage can be transferred to new owners, increasing your vehicle's resale value.",
  },
]

const faqs = [
  {
    question: "When does my coverage begin?",
    answer: "Coverage begins 30 days after enrollment for new plans. This waiting period ensures we can properly process your vehicle information and set up your account.",
  },
  {
    question: "Can I cancel my plan?",
    answer: "Yes, you can cancel your plan at any time after the initial 12-month commitment period. If you cancel within the first 30 days (before coverage begins), you'll receive a full refund.",
  },
  {
    question: "What vehicles are eligible?",
    answer: "Most vehicles under 10 years old with less than 100,000 miles are eligible for coverage. Some luxury and performance vehicles may require additional inspection.",
  },
  {
    question: "How do I file a claim?",
    answer: "Simply call our 24/7 claims line or use our mobile app. We'll authorize the repair directly with the repair facility, so you won't have to pay out of pocket (except for any applicable deductible).",
  },
  {
    question: "Is routine maintenance covered?",
    answer: "Our protection plans cover mechanical breakdowns, not routine maintenance items like oil changes, brake pads, or tire rotations. However, our Ultimate plan includes appearance protection services.",
  },
]

export default function ProtectionPlansPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        {/* Hero section */}
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold max-w-3xl mx-auto text-balance">
              Protect your investment with comprehensive coverage
            </h1>
            <p className="mt-6 text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              Our vehicle protection plans give you peace of mind on the road. Choose the coverage level that fits your needs and budget.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  id={plan.id}
                  className={`rounded-xl p-8 border scroll-mt-32 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.highlighted ? "bg-primary-foreground/20" : "bg-primary/10"
                    }`}>
                      <plan.icon className={`w-5 h-5 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                    </div>
                    <h2 className="font-semibold text-xl">{plan.name}</h2>
                  </div>
                  
                  <p className={`text-sm mb-6 ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                  
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="font-serif text-5xl font-semibold">${plan.price}</span>
                    <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-3">
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          plan.highlighted ? "text-primary-foreground" : "text-primary"
                        }`} />
                        <div>
                          <div className="font-medium text-sm">{feature.name}</div>
                          <div className={`text-xs mt-0.5 ${
                            plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            {feature.description}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "secondary" : "default"}
                    size="lg"
                  >
                    Get {plan.name}
                  </Button>

                  <p className={`text-xs mt-4 ${
                    plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"
                  }`}>
                    {plan.terms}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">
                Why choose our protection plans
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Every plan includes these premium benefits at no additional cost.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">
                Frequently asked questions
              </h2>
            </div>

            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Have more questions? Our team is here to help.
              </p>
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-muted">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold max-w-2xl mx-auto text-balance">
              Ready to protect your vehicle?
            </h2>
            <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
              Get started today and enjoy peace of mind knowing your investment is protected.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg">
                Get Started
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  Talk to an Expert
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
