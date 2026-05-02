import { DollarSign, Clock, Shield, Car, Zap, ThumbsUp, type LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Clock,
  Shield,
  Car,
  Zap,
  ThumbsUp,
}

interface Benefit {
  icon?: string
  title: string
  description: string
}

interface BenefitsSectionProps {
  title: string
  benefits: Benefit[]
}

export function BenefitsSection({ title, benefits }: Readonly<BenefitsSectionProps>) {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 md:text-4xl">{title}</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => {
            const IconComponent = iconMap[benefit.icon || 'ThumbsUp'] || ThumbsUp
            return (
              <div key={benefit.title} className="flex flex-col items-center text-center p-6 rounded-xl bg-background shadow-sm border">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <IconComponent className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
