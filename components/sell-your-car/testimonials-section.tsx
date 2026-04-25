import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Testimonial {
  name: string
  location?: string
  quote: string
  rating?: number
  vehiclePurchased?: string
}

interface TestimonialsSectionProps {
  title: string
  testimonials: Testimonial[]
}

export function TestimonialsSection({ title, testimonials }: Readonly<TestimonialsSectionProps>) {
  if (!testimonials || testimonials.length === 0) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 md:text-4xl">{title}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating || 5 }, (_, i) => `${testimonial.name}-star-${i}`).map((id) => (
                    <Star key={id} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                {/* Quote */}
                <blockquote className="flex-1 text-muted-foreground mb-4">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                
                {/* Author */}
                <div className="border-t pt-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  {testimonial.location && (
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  )}
                  {testimonial.vehiclePurchased && (
                    <p className="text-sm text-primary mt-1">Sold: {testimonial.vehiclePurchased}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
