import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface CTASectionProps {
  headline: string
  subheadline?: string
  ctaText: string
  ctaLink: string
}

export function CTASection({ headline, subheadline, ctaText, ctaLink }: Readonly<CTASectionProps>) {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4 md:text-4xl">{headline}</h2>
        {subheadline && (
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">{subheadline}</p>
        )}
        <Button asChild size="lg" variant="secondary" className="text-lg px-8">
          <Link href={ctaLink}>
            {ctaText} <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
