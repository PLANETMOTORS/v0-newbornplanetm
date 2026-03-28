import { Search, CreditCard, CalendarCheck, Truck } from "lucide-react"

const steps = [
  {
    icon: Search,
    step: 1,
    title: "Browse & Select",
    description: "Explore 9,500+ certified vehicles. Filter by make, model, price, and features."
  },
  {
    icon: CreditCard,
    step: 2,
    title: "Get Pre-Approved",
    description: "Apply in 2 minutes. No impact to your credit score. Rates from 4.79% APR."
  },
  {
    icon: CalendarCheck,
    step: 3,
    title: "Schedule Test Drive",
    description: "Visit our showroom, get a home test drive, or take a virtual tour."
  },
  {
    icon: Truck,
    step: 4,
    title: "We Deliver",
    description: "Free Ontario delivery. Nationwide shipping available. 10-day return policy."
  }
]

export function HowItWorks() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Buy your next car entirely online with confidence. Our simple 4-step process 
            makes car buying easy.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((item, index) => (
            <div key={item.step} className="relative text-center">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              
              {/* Step Circle */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
                <item.icon className="w-7 h-7" />
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
