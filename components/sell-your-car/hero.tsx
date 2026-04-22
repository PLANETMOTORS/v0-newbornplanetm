'use client'

import { Badge } from '@/components/ui/badge'
import { DollarSign, Check } from 'lucide-react'

interface SellYourCarHeroProps {
  headline: string
  subheadline: string
  highlightText?: string
}

export function SellYourCarHero({ headline, subheadline, highlightText }: SellYourCarHeroProps) {
  return (
    <div className="space-y-6">
      {highlightText && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-4 py-2 text-sm font-semibold">
          <DollarSign className="mr-1 h-4 w-4" />
          {highlightText}
        </Badge>
      )}
      
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
        {headline}
      </h1>
      
      <p className="text-lg text-muted-foreground md:text-xl max-w-xl text-pretty">
        {subheadline}
      </p>
      
      <div className="flex flex-col gap-3 pt-4">
        {[
          'Instant cash offer in minutes',
          'No hidden fees or obligations',
          'Same-day payment available',
          'Free pickup from your location',
        ].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
