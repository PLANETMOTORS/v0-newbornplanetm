import { Shield, RotateCcw, Truck, ClipboardCheck, Award, Headphones, CheckCircle, LockKeyhole } from "lucide-react"

const badges = [
  {
    icon: ClipboardCheck,
    title: "210-Point Inspection",
    description: "Industry-leading standard",
    highlight: true
  },
  {
    icon: RotateCcw,
    title: "10-Day Returns",
    description: "Full refund, no questions asked",
    highlight: false
  },
  {
    icon: Truck,
    title: "Free Ontario Delivery",
    description: "Or nationwide shipping available",
    highlight: false
  },
  {
    icon: Shield,
    title: "Warranty Included",
    description: "30-day minimum coverage",
    highlight: false
  },
  {
    icon: Award,
    title: "Carfax Verified",
    description: "Free vehicle history report",
    highlight: false
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Real humans, not chatbots",
    highlight: false
  }
]

export function TrustBadges() {
  return (
    <section className="py-16 border-y bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-primary mb-2">Why Customers Trust Us</p>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold">The Planet Motors Promise</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-4">
          {badges.map((badge) => (
            <div 
              key={badge.title} 
              className={`
                group flex flex-col items-center text-center p-4 rounded-2xl transition-all duration-300
                hover:bg-card hover:shadow-lg hover:-translate-y-1
                ${badge.highlight ? "bg-primary/5 border border-primary/20" : ""}
              `}
            >
              <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110
                ${badge.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10"}
              `}>
                <badge.icon className={`w-7 h-7 ${badge.highlight ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
              {badge.highlight && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  <span>Industry Best</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom trust line */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <LockKeyhole className="w-4 h-4 text-green-600" />
            256-bit SSL Encryption
          </span>
          <span className="hidden md:inline">|</span>
          <span>OMVIC Licensed Dealer</span>
          <span className="hidden md:inline">|</span>
          <span>BBB A+ Rating</span>
          <span className="hidden md:inline">|</span>
          <span>4.8 Star Rating (500+ Reviews)</span>
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
