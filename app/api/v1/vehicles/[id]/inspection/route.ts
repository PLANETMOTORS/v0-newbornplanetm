import { NextRequest, NextResponse } from 'next/server'

type InspectionTuple = [name: string, status: string, notes: string]

function tupleToItem([name, status, notes]: InspectionTuple) {
  return { name, status, notes }
}

interface CategoryDef {
  name: string
  pointCount: number
  passed: number
  failed: number
  items: InspectionTuple[]
}

function buildCategory(def: CategoryDef) {
  return { ...def, items: def.items.map(tupleToItem) }
}

const EXTERIOR_ITEMS: InspectionTuple[] = [
  ['Front Bumper', 'pass', 'No damage'],
  ['Rear Bumper', 'pass', 'No damage'],
  ['Hood', 'pass', 'Alignment correct'],
  ['Trunk Lid', 'pass', 'Opens/closes properly'],
  ['Driver Front Door', 'pass', 'No dents'],
  ['Driver Rear Door', 'pass', 'No dents'],
  ['Passenger Front Door', 'pass', 'No dents'],
  ['Passenger Rear Door', 'pass', 'No dents'],
  ['Windshield', 'pass', 'No chips or cracks'],
  ['Rear Window', 'pass', 'Clear, defroster works'],
  ['Driver Side Mirror', 'pass', 'Power adjustment works'],
  ['Passenger Side Mirror', 'pass', 'Power adjustment works'],
  ['Headlights', 'pass', 'LED, bright and clear'],
  ['Tail Lights', 'pass', 'All functions work'],
  ['Turn Signals', 'pass', 'Front and rear work'],
  ['Paint Condition', 'pass', 'Excellent, factory finish'],
  ['Clear Coat', 'pass', 'No peeling'],
  ['Wiper Blades', 'repaired', 'Replaced with new OEM blades'],
]

const INTERIOR_ITEMS: InspectionTuple[] = [
  ['Driver Seat', 'pass', 'Leather in excellent condition'],
  ['Passenger Seat', 'pass', 'No wear'],
  ['Rear Seats', 'pass', 'Clean, no stains'],
  ['Seat Belts', 'pass', 'All retract properly'],
  ['Dashboard', 'pass', 'No cracks'],
  ['Steering Wheel', 'pass', 'Heated, no wear'],
  ['Infotainment System', 'pass', 'Responsive, all features work'],
  ['Climate Control', 'pass', 'AC cold, heat hot'],
  ['Power Windows', 'pass', 'All 4 work'],
  ['Power Locks', 'pass', 'All doors lock/unlock'],
  ['Interior Lights', 'pass', 'All illuminating'],
  ['Carpet', 'pass', 'Clean, no stains'],
  ['Headliner', 'pass', 'No sagging'],
]

const MECHANICAL_ITEMS: InspectionTuple[] = [
  ['Engine Oil Level', 'pass', 'Full, clean'],
  ['Engine Oil Leaks', 'pass', 'None detected'],
  ['Coolant Level', 'pass', 'Full'],
  ['Transmission Fluid', 'pass', 'Clean, proper level'],
  ['Brake Fluid', 'pass', 'Full'],
  ['Engine Start', 'pass', 'Starts immediately'],
  ['Engine Idle', 'pass', 'Smooth, 750 RPM'],
  ['Engine Noise', 'pass', 'No abnormal sounds'],
  ['Exhaust System', 'pass', 'No leaks'],
  ['Transmission Operation', 'pass', 'Shifts smoothly'],
  ['Suspension - Front', 'pass', 'No play'],
  ['Suspension - Rear', 'pass', 'No play'],
  ['Steering', 'pass', 'Responsive, no play'],
  ['Air Filter', 'replaced', 'Replaced with new OEM filter'],
  ['Cabin Air Filter', 'pass', 'Clean'],
  ['Drive Belt', 'pass', 'No cracks, proper tension'],
]

// Mock 210-point inspection data
const getInspection = (vehicleId: string) => {
  return {
    id: `insp-${vehicleId}`,
    vehicleId,
    inspectorName: 'Michael Chen, ASE Certified',
    inspectionDate: '2024-01-12',
    totalPoints: 210,
    passedPoints: 206,
    passRate: 98.1,
    overallStatus: 'passed',
    
    categories: [
      buildCategory({ name: 'Exterior', pointCount: 35, passed: 34, failed: 1, items: EXTERIOR_ITEMS }),
      buildCategory({ name: 'Interior', pointCount: 30, passed: 30, failed: 0, items: INTERIOR_ITEMS }),
      buildCategory({ name: 'Mechanical', pointCount: 45, passed: 44, failed: 1, items: MECHANICAL_ITEMS }),
      buildCategory({ name: 'Electrical', pointCount: 30, passed: 30, failed: 0, items: [
        ['Battery', 'pass', '98% health, 2 years old'],
        ['Alternator', 'pass', '14.2V output'],
        ['Starter', 'pass', 'Engages properly'],
        ['OBD-II Scan', 'pass', 'No codes stored'],
        ['Fuse Box', 'pass', 'All fuses good'],
        ['Headlight Switch', 'pass', 'All positions work'],
        ['Power Seat Motors', 'pass', 'All adjustments work'],
        ['Heated Seats', 'pass', 'Both sides heat'],
        ['Sunroof Motor', 'pass', 'Opens/closes/tilts'],
        ['Blower Motor', 'pass', 'All speeds work'],
        ['AC Compressor', 'pass', 'Engages, blows cold'],
        ['TPMS Sensors', 'pass', 'All 4 reading'],
        ['Backup Camera', 'pass', 'Clear image'],
      ]}),
      buildCategory({ name: 'Safety', pointCount: 40, passed: 40, failed: 0, items: [
        ['Driver Airbag', 'pass', 'No warning light'],
        ['Passenger Airbag', 'pass', 'No warning light'],
        ['Side Airbags', 'pass', 'No warning light'],
        ['Curtain Airbags', 'pass', 'No warning light'],
        ['Seat Belt Pretensioners', 'pass', 'All functional'],
        ['Child Seat Anchors', 'pass', 'LATCH system intact'],
        ['Hood Latch', 'pass', 'Primary and safety work'],
        ['Trunk Latch', 'pass', 'Emergency release works'],
        ['Brake Pedal', 'pass', 'Firm, ABS functional'],
        ['Emergency Brake', 'pass', 'Holds on incline'],
        ['ABS Warning Light', 'pass', 'Not illuminated'],
        ['Airbag Warning Light', 'pass', 'Not illuminated'],
        ['Check Engine Light', 'pass', 'Not illuminated'],
        ['Forward Collision Warning', 'pass', 'Calibrated'],
        ['Lane Departure Warning', 'pass', 'Functional'],
        ['Blind Spot Monitoring', 'pass', 'Both sides detect'],
        ['Rear Cross Traffic Alert', 'pass', 'Functional'],
        ['Spare Tire', 'pass', 'Inflated, jack present'],
      ]}),
      buildCategory({ name: 'Tires & Brakes', pointCount: 30, passed: 28, failed: 2, items: [
        ['Front Left Tire', 'pass', '7/32" tread, Michelin'],
        ['Front Right Tire', 'pass', '7/32" tread, Michelin'],
        ['Rear Left Tire', 'pass', '6/32" tread, Michelin'],
        ['Rear Right Tire', 'pass', '6/32" tread, Michelin'],
        ['Tire Pressure - FL', 'pass', '35 PSI'],
        ['Tire Pressure - FR', 'pass', '35 PSI'],
        ['Tire Pressure - RL', 'pass', '35 PSI'],
        ['Tire Pressure - RR', 'pass', '35 PSI'],
        ['Wheel - FL', 'pass', 'No curb rash'],
        ['Wheel - FR', 'repaired', 'Minor curb rash refinished'],
        ['Wheel - RL', 'pass', 'No damage'],
        ['Wheel - RR', 'pass', 'No damage'],
        ['Front Brake Pads', 'pass', '8mm remaining'],
        ['Rear Brake Pads', 'pass', '7mm remaining'],
        ['Front Rotors', 'pass', 'Within spec'],
        ['Rear Rotors', 'pass', 'Within spec'],
        ['Brake Lines', 'pass', 'No leaks'],
        ['ABS Sensors', 'pass', 'All 4 reading'],
        ['Wheel Alignment', 'adjusted', 'Aligned to spec'],
      ]}),
    ],
    
    repairsPerformed: [
      { item: 'Wiper Blades', description: 'Replaced with new OEM blades', cost: 45 },
      { item: 'Air Filter', description: 'Replaced with new OEM filter', cost: 35 },
      { item: 'Front Right Wheel', description: 'Minor curb rash refinished', cost: 125 },
      { item: 'Wheel Alignment', description: 'Four-wheel alignment performed', cost: 99 },
    ],
    
    totalRepairCost: 304,
    
    certifiedBy: 'Michael Chen',
    certificationNumber: 'ASE-T1-T8',
    notes: 'Vehicle is in excellent condition. All safety systems fully functional. Minor cosmetic repairs performed. Ready for sale.',
  }
}

// GET /api/v1/vehicles/:id/inspection - Get 210-point inspection report
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const inspection = getInspection(id)
  
  if (!inspection) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Inspection not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      inspection,
      summary: {
        totalPoints: inspection.totalPoints,
        passedPoints: inspection.passedPoints,
        passRate: inspection.passRate,
        overallStatus: inspection.overallStatus,
        repairsPerformed: inspection.repairsPerformed.length,
        totalRepairCost: inspection.totalRepairCost,
      },
    },
  })
}
