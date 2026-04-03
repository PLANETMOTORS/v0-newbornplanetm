'use client'

import { useCallback, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Shield, CreditCard, X } from 'lucide-react'
import { startVehicleCheckout } from '@/app/actions/stripe'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface ProtectionPlan {
  id: string
  name: string
  price: number
  deposit: number
  features: string[]
  recommended?: boolean
}

const PROTECTION_PLANS: ProtectionPlan[] = [
  {
    id: 'essential',
    name: 'PlanetCare Essential Shield',
    price: 1950,
    deposit: 250,
    features: ['Standard Warranty', '$50K GAP Coverage', 'Trade-in Credit'],
  },
  {
    id: 'smart',
    name: 'PlanetCare Smart Secure',
    price: 3000,
    deposit: 250,
    features: ['Extended Warranty', '$60K GAP Coverage', 'Tire & Rim Protection', '~$1M Life Coverage'],
    recommended: true,
  },
  {
    id: 'lifeproof',
    name: 'PlanetCare Life Proof',
    price: 4850,
    deposit: 250,
    features: ['Extended Warranty', '$60K GAP Coverage', 'Tire & Rim', 'Anti-Theft', '~$1M Life Coverage'],
  },
]

interface VehicleCheckoutProps {
  vehicleId: string
  vehicleName: string
  vehiclePrice: number // in dollars
  onClose?: () => void
}

export function VehicleCheckout({ vehicleId, vehicleName, vehiclePrice, onClose }: VehicleCheckoutProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [depositOnly, setDepositOnly] = useState(true)
  const [showCheckout, setShowCheckout] = useState(false)

  const totalDeposit = 250 + (selectedPlan ? 250 : 0)
  const totalFull = vehiclePrice + (selectedPlan ? PROTECTION_PLANS.find(p => p.id === selectedPlan)?.price || 0 : 0)

  const fetchClientSecret = useCallback(() => {
    return startVehicleCheckout({
      vehicleId,
      vehicleName,
      vehiclePriceCents: Math.round(vehiclePrice * 100),
      protectionPlanId: selectedPlan || undefined,
      depositOnly,
    })
  }, [vehicleId, vehicleName, vehiclePrice, selectedPlan, depositOnly])

  if (showCheckout) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Complete Payment</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowCheckout(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <p className="font-medium">{vehicleName}</p>
          <p className="text-sm text-muted-foreground">
            {depositOnly ? `Deposit: $${totalDeposit.toLocaleString()}` : `Total: $${totalFull.toLocaleString()}`}
          </p>
          {selectedPlan && (
            <Badge variant="secondary" className="mt-2">
              + {PROTECTION_PLANS.find(p => p.id === selectedPlan)?.name}
            </Badge>
          )}
        </div>
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret: fetchClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Complete Your Purchase</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Vehicle Summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{vehicleName}</p>
              <p className="text-sm text-muted-foreground">Vehicle Price</p>
            </div>
            <p className="text-xl font-bold">${vehiclePrice.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Protection Plans */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Add Protection (Optional)
        </h4>
        <div className="space-y-3">
          {PROTECTION_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {selectedPlan === plan.id && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.features.slice(0, 2).join(' • ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${plan.price.toLocaleString()}</p>
                    {plan.recommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Options */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          Payment Option
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Card
            className={`cursor-pointer transition-all ${depositOnly ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setDepositOnly(true)}
          >
            <CardContent className="py-4 text-center">
              <p className="font-semibold">${totalDeposit.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Refundable Deposit</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${!depositOnly ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setDepositOnly(false)}
          >
            <CardContent className="py-4 text-center">
              <p className="font-semibold">${totalFull.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pay in Full</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Vehicle</span>
            <span>${vehiclePrice.toLocaleString()}</span>
          </div>
          {selectedPlan && (
            <div className="flex justify-between text-sm">
              <span>{PROTECTION_PLANS.find(p => p.id === selectedPlan)?.name}</span>
              <span>${PROTECTION_PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>{depositOnly ? 'Deposit Due Today' : 'Total'}</span>
            <span>${depositOnly ? totalDeposit.toLocaleString() : totalFull.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-12" size="lg" onClick={() => setShowCheckout(true)}>
        <CreditCard className="w-4 h-4 mr-2" />
        {depositOnly ? `Pay $${totalDeposit} Deposit` : `Pay $${totalFull.toLocaleString()}`}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Secure payment powered by Stripe. Your deposit is fully refundable.
      </p>
    </div>
  )
}
