import { NextRequest, NextResponse } from 'next/server'

// POST /api/v1/orders - Create order
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const {
    customerId,
    vehicleId,
    
    // Financing
    financingOfferId,
    paymentMethod, // 'financing', 'cash', 'bank_draft'
    
    // Trade-in
    tradeInOfferId,
    
    // Delivery
    deliveryType, // 'delivery', 'pickup'
    deliveryAddressId,
    hubId,
    preferredDate,
    preferredTimeSlot,
    
    // Protection
    protectionPlanId,
    
    // Payment
    downPayment,
  } = body

  // Validate required fields
  if (!customerId || !vehicleId || !paymentMethod) {
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'MISSING_FIELDS', 
          message: 'Customer ID, vehicle ID, and payment method are required' 
        } 
      },
      { status: 400 }
    )
  }

  // Mock vehicle data
  const vehicle = {
    id: vehicleId,
    price: 34999,
    year: 2023,
    make: 'Honda',
    model: 'Accord',
    trim: 'Sport',
  }

  // Mock trade-in
  const tradeIn = tradeInOfferId ? {
    id: tradeInOfferId,
    value: 15000,
    vehicle: '2019 Toyota Camry',
  } : null

  // Mock financing offer
  const financing = financingOfferId ? {
    id: financingOfferId,
    lender: 'TD Auto Finance',
    rate: 5.49,
    term: 72,
    monthlyPayment: 485,
  } : null

  // Calculate pricing (Ontario HST)
  const documentationFee = 499
  const omvicFee = 10
  const deliveryFee = deliveryType === 'delivery' ? 0 : 0 // Free delivery within 250km
  const protectionPlanPrice = protectionPlanId ? 1499 : 0
  
  const subtotal = vehicle.price + documentationFee + omvicFee + deliveryFee + protectionPlanPrice
  const taxRate = 0.13 // Ontario HST
  const taxAmount = subtotal * taxRate
  const totalBeforeCredits = subtotal + taxAmount
  
  const tradeInCredit = tradeIn?.value || 0
  const downPaymentAmount = downPayment || 0
  const totalCredits = tradeInCredit + downPaymentAmount
  
  const totalPrice = totalBeforeCredits - totalCredits
  const amountFinanced = financing ? totalPrice : 0

  // Generate order
  const orderNumber = `PM-${Date.now().toString(36).toUpperCase()}`
  
  const order = {
    id: `order-${Date.now()}`,
    orderNumber,
    customerId,
    vehicleId,
    status: 'created',
    
    // Vehicle
    vehicle: {
      id: vehicle.id,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      price: vehicle.price,
    },
    
    // Pricing
    pricing: {
      vehiclePrice: vehicle.price,
      documentationFee,
      omvicFee,
      deliveryFee,
      protectionPlanPrice,
      subtotal,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalBeforeCredits: Math.round(totalBeforeCredits * 100) / 100,
      tradeInCredit,
      downPayment: downPaymentAmount,
      totalCredits,
      totalPrice: Math.round(totalPrice * 100) / 100,
    },
    
    // Financing
    financing: financing ? {
      offerId: financing.id,
      lender: financing.lender,
      rate: financing.rate,
      term: financing.term,
      monthlyPayment: financing.monthlyPayment,
      amountFinanced: Math.round(amountFinanced * 100) / 100,
    } : null,
    
    // Trade-in
    tradeIn: tradeIn ? {
      offerId: tradeIn.id,
      value: tradeIn.value,
      vehicle: tradeIn.vehicle,
    } : null,
    
    // Delivery
    delivery: {
      type: deliveryType,
      addressId: deliveryAddressId,
      hubId: deliveryType === 'pickup' ? hubId : null,
      preferredDate,
      preferredTimeSlot,
      estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    
    // Protection
    protectionPlan: protectionPlanId ? {
      id: protectionPlanId,
      name: 'Premium Protection',
      price: protectionPlanPrice,
    } : null,
    
    // Timeline
    timeline: [
      { step: 'Order Created', status: 'complete', date: new Date().toISOString() },
      { step: 'Documents Pending', status: 'current', date: null },
      { step: 'Payment Processing', status: 'pending', date: null },
      { step: 'Vehicle Preparation', status: 'pending', date: null },
      { step: 'Delivery Scheduled', status: 'pending', date: null },
      { step: 'Delivered', status: 'pending', date: null },
    ],
    
    // Documents required
    documentsRequired: [
      { type: 'drivers_license', name: 'Driver\'s License', status: 'pending' },
      { type: 'proof_of_insurance', name: 'Proof of Insurance', status: 'pending' },
      { type: 'financing_agreement', name: 'Financing Agreement', status: financing ? 'pending' : 'not_required' },
      { type: 'purchase_agreement', name: 'Purchase Agreement', status: 'pending' },
    ],
    
    // Return policy
    returnPolicy: {
      eligible: true,
      deadline: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(), // 10 days after estimated delivery
      maxMileage: 750,
      conditions: [
        'Vehicle must be in same condition as delivered',
        'Maximum 750 km driven',
        'All original documents present',
        'No modifications made',
      ],
    },
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json({
    success: true,
    data: {
      order,
      message: `Order ${orderNumber} created successfully`,
      nextSteps: [
        'Upload required documents',
        'Complete e-signatures',
        'Confirm delivery date',
        'Make down payment',
      ],
    },
  })
}

// GET /api/v1/orders - List customer orders
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')
  const status = searchParams.get('status')

  // Mock orders
  const orders = [
    {
      id: 'order-1',
      orderNumber: 'PM-ABC123',
      status: 'delivered',
      vehicle: { year: 2023, make: 'Honda', model: 'Accord', trim: 'Sport' },
      totalPrice: 39549.86,
      createdAt: '2024-01-15T10:00:00Z',
      deliveredAt: '2024-01-22T14:00:00Z',
    },
  ]

  return NextResponse.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: 1,
        limit: 20,
        total: orders.length,
      },
    },
  })
}
