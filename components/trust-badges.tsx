import { Shield, RotateCcw, Truck, ClipboardCheck, Award, Headphones } from "lucide-react"

const badges = [
  {
    icon: ClipboardCheck,
    title: "210-Point Inspection",
    description: "Every vehicle thoroughly inspected"
  },
  {
    icon: RotateCcw,
    title: "10-Day Returns",
    description: "Full refund, no questions asked"
  },
  {
    icon: Truck,
    title: "Free Ontario Delivery",
    description: "Nationwide shipping available"
  },
  {
    icon: Shield,
    title: "Warranty Included",
    description: "30-day minimum coverage"
  },
  {
    icon: Award,
    title: "Carfax Verified",
    description: "Free vehicle history report"
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Help when you need it"
  }
]

export function TrustBadges() {
  return (
    <section className="py-12 border-y bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badges.map((badge) => (
            <div key={badge.title} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <badge.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Compact version for headers/footers
export function TrustBadgesCompact() {
  return (
    <div className="flex flex-wrap justify-center gap-6 text-sm">
      {badges.slice(0, 4).map((badge) => (
        <div key={badge.title} className="flex items-center gap-2">
          <badge.icon className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">{badge.title}</span>
        </div>
      ))}
    </div>
  )
}
