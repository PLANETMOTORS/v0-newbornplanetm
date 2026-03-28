export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  images?: string[]
}

// Planet Motors product catalog
export const PRODUCTS: Product[] = [
  {
    id: 'vehicle-reservation',
    name: 'Vehicle Reservation Deposit',
    description: 'Refundable $250 deposit to reserve your vehicle for 48 hours. Applied to final purchase price.',
    priceInCents: 25000, // $250.00
  },
  {
    id: 'financing-application-fee',
    name: 'Financing Application Fee',
    description: 'Non-refundable fee for credit application processing and lender matching.',
    priceInCents: 4900, // $49.00
  },
  {
    id: 'delivery-express',
    name: 'Express Delivery',
    description: 'Priority nationwide delivery within 3-5 business days.',
    priceInCents: 49900, // $499.00
  },
  {
    id: 'delivery-standard',
    name: 'Standard Delivery',
    description: 'Free standard delivery within 7-14 business days.',
    priceInCents: 0, // Free
  },
  // Protection Plans
  {
    id: 'planetcare-essential',
    name: 'PlanetCare Essential Shield',
    description: 'Basic coverage including tire & rim protection and rust coating.',
    priceInCents: 195000, // $1,950.00
  },
  {
    id: 'planetcare-smart',
    name: 'PlanetCare Smart Secure',
    description: 'Mid-tier coverage with extended warranty, GAP, and theft protection.',
    priceInCents: 300000, // $3,000.00
  },
  {
    id: 'planetcare-lifeproof',
    name: 'PlanetCare Life Proof',
    description: 'Complete coverage including all protections and paint protection film.',
    priceInCents: 485000, // $4,850.00
  },
]

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}

export function getProductPrice(id: string): number {
  const product = getProductById(id)
  return product?.priceInCents ?? 0
}
