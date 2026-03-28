import { NextRequest, NextResponse } from 'next/server'

// Mock vehicle data - replace with database query
const getVehicleById = (id: string) => {
  const vehicles: Record<string, any> = {
    'v-001': {
      id: 'v-001',
      vin: '1HGBH41JXMN109186',
      year: 2023,
      make: 'Honda',
      model: 'Accord',
      trim: 'Sport',
      price: 34999,
      msrp: 38500,
      savings: 3501,
      mileage: 15420,
      exteriorColor: 'Crystal Black Pearl',
      interiorColor: 'Black',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      drivetrain: 'FWD',
      engine: '1.5L Turbo I4 192hp',
      horsepower: 192,
      torque: 192,
      mpgCity: 29,
      mpgHighway: 37,
      bodyStyle: 'Sedan',
      doors: 4,
      seats: 5,
      status: 'available',
      condition: 'Excellent',
      
      // Inspection
      inspectionStatus: 'passed',
      inspectionScore: 98,
      inspectionDate: '2024-01-12',
      inspectionItems: {
        exterior: { passed: 34, failed: 1, total: 35 },
        interior: { passed: 30, failed: 0, total: 30 },
        mechanical: { passed: 44, failed: 1, total: 45 },
        electrical: { passed: 30, failed: 0, total: 30 },
        safety: { passed: 40, failed: 0, total: 40 },
        tiresBrakes: { passed: 28, failed: 2, total: 30 },
      },
      
      // History
      carfaxUrl: 'https://carfax.ca/report/1HGBH41JXMN109186',
      accidents: 0,
      owners: 1,
      serviceRecords: 8,
      
      // Location
      hubId: 'richmond-hill',
      hubName: 'Richmond Hill Hub',
      hubAddress: '30 Major Mackenzie E, Richmond Hill, ON L4C 1G7',
      
      // Media
      photos: [
        { url: '/vehicles/accord-1.jpg', type: 'exterior', angle: 'front-left' },
        { url: '/vehicles/accord-2.jpg', type: 'exterior', angle: 'rear-right' },
        { url: '/vehicles/accord-3.jpg', type: 'interior', angle: 'dashboard' },
        { url: '/vehicles/accord-4.jpg', type: 'interior', angle: 'rear-seats' },
      ],
      has360View: true,
      view360Url: '/vehicles/accord-360/',
      
      // Features
      features: {
        safety: ['Collision Mitigation', 'Lane Keep Assist', 'Adaptive Cruise', 'Blind Spot Info'],
        comfort: ['Heated Seats', 'Dual-Zone Climate', 'Power Moonroof', 'Remote Start'],
        technology: ['Apple CarPlay', 'Android Auto', 'Wireless Charging', 'Premium Audio'],
        convenience: ['Smart Entry', 'Push Button Start', 'Power Tailgate', 'Rain-Sensing Wipers'],
      },
      
      // Pricing breakdown
      pricing: {
        vehiclePrice: 34999,
        documentationFee: 499,
        omvicFee: 10,
        estimatedTax: 4616.18,
        totalBeforeTradeIn: 40124.18,
      },
      
      // Financing preview
      financingPreview: {
        monthlyPayment: 485,
        term: 84,
        rate: 5.99,
        downPayment: 3500,
      },
      
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    'v-002': {
      id: 'v-002',
      vin: '5YJSA1E26MF123456',
      year: 2022,
      make: 'Tesla',
      model: 'Model 3',
      trim: 'Long Range',
      price: 49999,
      msrp: 59990,
      savings: 9991,
      mileage: 22150,
      exteriorColor: 'Pearl White',
      interiorColor: 'Black',
      fuelType: 'Electric',
      transmission: 'Single Speed',
      drivetrain: 'AWD',
      engine: 'Dual Motor Electric',
      horsepower: 346,
      torque: 389,
      bodyStyle: 'Sedan',
      doors: 4,
      seats: 5,
      status: 'available',
      condition: 'Excellent',
      
      // EV-specific
      evBatteryHealth: 94,
      evBatteryCapacity: 82,
      evRange: 545,
      evChargeTime: {
        level1: '48 hours',
        level2: '8 hours',
        dcFast: '30 minutes to 80%',
      },
      
      // Inspection
      inspectionStatus: 'passed',
      inspectionScore: 99,
      inspectionDate: '2024-01-10',
      inspectionItems: {
        exterior: { passed: 35, failed: 0, total: 35 },
        interior: { passed: 30, failed: 0, total: 30 },
        mechanical: { passed: 45, failed: 0, total: 45 },
        electrical: { passed: 29, failed: 1, total: 30 },
        safety: { passed: 40, failed: 0, total: 40 },
        tiresBrakes: { passed: 30, failed: 0, total: 30 },
      },
      
      // History
      carfaxUrl: 'https://carfax.ca/report/5YJSA1E26MF123456',
      accidents: 0,
      owners: 1,
      serviceRecords: 4,
      
      // Location
      hubId: 'richmond-hill',
      hubName: 'Richmond Hill Hub',
      hubAddress: '30 Major Mackenzie E, Richmond Hill, ON L4C 1G7',
      
      // Media
      photos: [
        { url: '/vehicles/model3-1.jpg', type: 'exterior', angle: 'front-left' },
        { url: '/vehicles/model3-2.jpg', type: 'exterior', angle: 'rear-right' },
        { url: '/vehicles/model3-3.jpg', type: 'interior', angle: 'dashboard' },
      ],
      has360View: true,
      view360Url: '/vehicles/model3-360/',
      
      // Features
      features: {
        safety: ['Autopilot', 'Full Self-Driving Ready', 'Collision Avoidance', '8 Cameras'],
        comfort: ['Glass Roof', 'Heated Seats All Rows', 'HEPA Filtration', 'Climate Pre-conditioning'],
        technology: ['15" Touchscreen', 'Premium Audio', 'OTA Updates', 'Sentry Mode'],
        convenience: ['Phone Key', 'Supercharger Access', 'Dog Mode', 'Camp Mode'],
      },
      
      // Pricing breakdown
      pricing: {
        vehiclePrice: 49999,
        documentationFee: 499,
        omvicFee: 10,
        estimatedTax: 6566.04,
        totalBeforeTradeIn: 57074.04,
      },
      
      // Financing preview
      financingPreview: {
        monthlyPayment: 695,
        term: 84,
        rate: 5.49,
        downPayment: 5000,
      },
      
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
  }
  
  return vehicles[id] || null
}

// GET /api/v1/vehicles/:id - Get vehicle details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const vehicle = getVehicleById(id)
  
  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } },
      { status: 404 }
    )
  }

  // Track view (would normally update database)
  const viewCount = 47

  return NextResponse.json({
    success: true,
    data: {
      vehicle,
      meta: {
        viewCount,
        viewingNow: 3,
        lastViewed: new Date().toISOString(),
        similarCount: 12,
      },
    },
  })
}

// PATCH /api/v1/vehicles/:id/status - Update vehicle status (internal)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  
  const { status } = body
  
  const validStatuses = ['available', 'reserved', 'pending', 'sold', 'maintenance']
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status value' } },
      { status: 400 }
    )
  }

  // Would normally update database
  return NextResponse.json({
    success: true,
    data: {
      id,
      status,
      updatedAt: new Date().toISOString(),
    },
  })
}
