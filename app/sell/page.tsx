import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LiveChatWidget } from "@/components/live-chat-widget"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, DollarSign, Clock, Shield, Car, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: Car,
    title: "Enter Vehicle Details",
    description: "Tell us about your vehicle - make, model, year, mileage, and condition.",
  },
  {
    icon: DollarSign,
    title: "Get Instant Offer",
    description: "Receive a competitive cash offer within minutes, powered by real market data.",
  },
  {
    icon: Clock,
    title: "Schedule Pickup",
    description: "Choose a convenient time for us to inspect and pick up your vehicle.",
  },
  {
    icon: Shield,
    title: "Get Paid",
    description: "Once verified, get paid the same day via e-transfer or cheque.",
  },
]

const benefits = [
  "No haggling or negotiations",
  "Free vehicle pickup across Ontario",
  "Same-day payment available",
  "No obligation - get your offer first",
  "$250 price match guarantee",
  "Handle all paperwork for you",
]

export default function SellYourCarPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-balance">
                Sell Your Car Online
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Get a competitive cash offer in minutes. No haggling, no dealership visits. We&apos;ll pick up your car and pay you the same day.
              </p>

              <div className="mt-8 space-y-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
              <h2 className="font-semibold text-xl mb-6">Get Your Free Offer</h2>
              
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Year</label>
                    <Input placeholder="2020" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Make</label>
                    <Input placeholder="Toyota" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Model</label>
                    <Input placeholder="Camry" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Trim</label>
                    <Input placeholder="SE" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mileage (km)</label>
                  <Input placeholder="45,000" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">VIN (Optional)</label>
                  <Input placeholder="Enter VIN for more accurate offer" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Name</label>
                    <Input placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input placeholder="416-555-0123" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input type="email" placeholder="john@example.com" />
                </div>

                <Button className="w-full" size="lg">
                  Get My Free Offer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By submitting, you agree to our Privacy Policy and Terms of Service
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Selling your car has never been easier. Complete the process in as little as 24 hours.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="bg-background rounded-xl p-6 border border-border h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-4xl font-serif font-bold text-muted-foreground/30">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold">
            Ready to Get Your Offer?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Join thousands of Ontario drivers who have sold their cars to Planet Motors.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary">
              Get Started Now
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              Call 1-866-787-3332
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <LiveChatWidget />
    </div>
  )
}
