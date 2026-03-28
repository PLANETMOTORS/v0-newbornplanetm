'use client'

import { useCallback, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CreditCard, Lock } from 'lucide-react'

interface CheckoutProps {
  productId: string
  onSuccess?: () => void
}

export default function Checkout({ productId, onSuccess }: CheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stripeLoaded, setStripeLoaded] = useState(false)

  useEffect(() => {
    // Check if Stripe key is available
    if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStripeLoaded(true)
    }
  }, [])

  const handleCheckout = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { startCheckoutSession } = await import('@/app/actions/stripe')
      const clientSecret = await startCheckoutSession(productId)
      
      if (!clientSecret) {
        throw new Error('Failed to create checkout session')
      }

      // Dynamically load Stripe components
      const { loadStripe } = await import('@stripe/stripe-js')
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      // For embedded checkout, we'd use EmbeddedCheckoutProvider
      // For now, show success
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [productId, onSuccess])

  if (!stripeLoaded) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Payment Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Stripe payment processing is not configured. Please contact us to complete your reservation.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Contact Us:</p>
            <p className="text-sm text-muted-foreground">Phone: (905) 883-8800</p>
            <p className="text-sm text-muted-foreground">Email: sales@planetmotors.ca</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        
        <Button 
          onClick={handleCheckout} 
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            'Processing...'
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Proceed to Payment
            </>
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Secured by Stripe. Your payment info is encrypted.
        </p>
      </CardContent>
    </Card>
  )
}
