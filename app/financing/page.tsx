import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LiveChatWidget } from "@/components/live-chat-widget"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, ArrowRight, Shield, Clock, BadgeCheck, User } from "lucide-react"
import Link from "next/link"

const lenders = [
  { name: "TD Auto", rate: "4.99%", term: "84 mo", logo: "TD" },
  { name: "RBC", rate: "5.49%", term: "84 mo", logo: "RBC" },
  { name: "Scotiabank", rate: "5.29%", term: "84 mo", logo: "SCO" },
  { name: "BMO", rate: "5.99%", term: "72 mo", logo: "BMO" },
  { name: "CIBC", rate: "5.49%", term: "84 mo", logo: "CIBC" },
  { name: "Desjardins", rate: "4.79%", term: "96 mo", logo: "DES" },
]

const benefits = [
  "No impact on your credit score for pre-approval",
  "Compare rates from 6 major Canadian lenders",
  "Get approved in as little as 30 minutes",
  "Flexible terms from 24 to 96 months",
  "No hidden fees or surprises",
  "Work with all credit situations",
]

const steps = [
  {
    number: "1",
    title: "Submit Application",
    description: "Fill out our simple online form with your basic information.",
  },
  {
    number: "2",
    title: "Credit Check",
    description: "Soft credit pull - no impact on your credit score.",
  },
  {
    number: "3",
    title: "Compare Offers",
    description: "Review rates from multiple lenders side by side.",
  },
  {
    number: "4",
    title: "Choose & Shop",
    description: "Select your best offer and start shopping with confidence.",
  },
]

export default function FinancingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                <BadgeCheck className="w-4 h-4" />
                <span>Rates from 4.79% APR</span>
              </div>
              
              <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-balance">
                Get Pre-Approved for Auto Financing
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Compare rates from 6 major Canadian lenders and get approved in minutes. No impact on your credit score.
              </p>

              <div className="mt-8 space-y-3">
                {benefits.slice(0, 4).map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">256-bit encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">30 min approval</span>
                </div>
              </div>
            </div>

            {/* Pre-approval Form */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
              <h2 className="font-semibold text-xl mb-2">Start Your Pre-Approval</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Takes less than 5 minutes. No commitment required.
              </p>
              
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <Input placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <Input placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input type="email" placeholder="john@example.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input placeholder="416-555-0123" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Estimated Vehicle Price</label>
                  <Input placeholder="$25,000" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Down Payment</label>
                  <Input placeholder="$2,500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Employment Status</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                    <option value="">Select status</option>
                    <option value="employed">Employed Full-Time</option>
                    <option value="part-time">Employed Part-Time</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="retired">Retired</option>
                    <option value="student">Student</option>
                  </select>
                </div>

                <Button className="w-full" size="lg">
                  Get Pre-Approved
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Checking your rate won&apos;t affect your credit score
                </p>

                <div className="pt-4 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-primary font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <Link href="/auth/signup" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Create an account
                    </Link>{" "}
                    to save your applications
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Lenders */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              Multi-Lender Financing
            </h2>
            <p className="mt-4 text-muted-foreground">
              We work with Canada&apos;s top financial institutions to get you the best rates.
            </p>
          </div>

          {/* Lender Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {lenders.map((lender) => (
              <div key={lender.name} className="bg-background rounded-xl p-6 border border-border text-center hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-primary text-sm">{lender.logo}</span>
                </div>
                <h3 className="font-semibold">{lender.name}</h3>
                <p className="text-2xl font-bold text-primary mt-2">{lender.rate}</p>
                <p className="text-xs text-muted-foreground">{lender.term}</p>
              </div>
            ))}
          </div>

          {/* Financing Flow Diagram */}
          <div className="mt-16 bg-background rounded-2xl border border-border p-8">
            <h3 className="font-semibold text-xl mb-8 text-center">Multi-Lender Financing Flow</h3>
            
            <div className="relative">
              {/* Flow diagram */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="font-medium">CUSTOMER</p>
                  <p className="text-sm text-muted-foreground">Submits financing application</p>
                </div>
                
                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                <div className="w-0.5 h-8 bg-muted-foreground/30 md:hidden" />
                
                <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/30">
                  <p className="font-medium text-primary">FINANCING SERVICE</p>
                  <p className="text-sm text-muted-foreground">Equifax API</p>
                  <p className="text-xs text-muted-foreground mt-1">1. Soft credit pull (no score impact)</p>
                </div>
                
                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                <div className="w-0.5 h-8 bg-muted-foreground/30 md:hidden" />
                
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="font-medium">CREDIT BUREAU</p>
                  <p className="text-sm text-muted-foreground">Equifax + TransUnion</p>
                  <p className="text-xs text-muted-foreground mt-1">2. Credit score + report</p>
                </div>
              </div>

              {/* Parallel lender requests */}
              <div className="mt-8 border-t border-border pt-8">
                <p className="text-center text-sm text-muted-foreground mb-6">PARALLEL LENDER REQUESTS</p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-4">Lender</th>
                        <th className="text-center py-2 px-4">TD Auto</th>
                        <th className="text-center py-2 px-4">RBC</th>
                        <th className="text-center py-2 px-4">Scotiabank</th>
                        <th className="text-center py-2 px-4">BMO</th>
                        <th className="text-center py-2 px-4">CIBC</th>
                        <th className="text-center py-2 px-4">Desjardins</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-2 px-4 font-medium">RATES</td>
                        <td className="text-center py-2 px-4">4.99%</td>
                        <td className="text-center py-2 px-4">5.49%</td>
                        <td className="text-center py-2 px-4">5.29%</td>
                        <td className="text-center py-2 px-4">5.99%</td>
                        <td className="text-center py-2 px-4">5.49%</td>
                        <td className="text-center py-2 px-4 text-primary font-medium">4.79%</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 font-medium">TERMS</td>
                        <td className="text-center py-2 px-4">84 mo</td>
                        <td className="text-center py-2 px-4">84 mo</td>
                        <td className="text-center py-2 px-4">72 mo</td>
                        <td className="text-center py-2 px-4">84 mo</td>
                        <td className="text-center py-2 px-4">96 mo</td>
                        <td className="text-center py-2 px-4 text-primary font-medium">96 mo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">3. Aggregate and rank offers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="bg-card rounded-xl p-6 border border-border">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <LiveChatWidget />
    </div>
  )
}
