import { NextRequest, NextResponse } from 'next/server'

/** Shorthand for a single inspection item — eliminates repeated inline object shape. */
function item(name: string, status: string, notes: string) {
  return { name, status, notes }
}

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
      {
        name: 'Exterior',
        pointCount: 35,
        passed: 34,
        failed: 1,
        items: [
          item('Front Bumper', 'pass', 'No damage'),
          item('Rear Bumper', 'pass', 'No damage'),
          item('Hood', 'pass', 'Alignment correct'),
          item('Trunk Lid', 'pass', 'Opens/closes properly'),
          item('Driver Front Door', 'pass', 'No dents'),
          item('Driver Rear Door', 'pass', 'No dents'),
          item('Passenger Front Door', 'pass', 'No dents'),
          item('Passenger Rear Door', 'pass', 'No dents'),
          item('Windshield', 'pass', 'No chips or cracks'),
          item('Rear Window', 'pass', 'Clear, defroster works'),
          item('Driver Side Mirror', 'pass', 'Power adjustment works'),
          item('Passenger Side Mirror', 'pass', 'Power adjustment works'),
          item('Headlights', 'pass', 'LED, bright and clear'),
          item('Tail Lights', 'pass', 'All functions work'),
          item('Turn Signals', 'pass', 'Front and rear work'),
          item('Paint Condition', 'pass', 'Excellent, factory finish'),
          item('Clear Coat', 'pass', 'No peeling'),
          item('Wiper Blades', 'repaired', 'Replaced with new OEM blades'),
        ],
      },
      {
        name: 'Interior',
        pointCount: 30,
        passed: 30,
        failed: 0,
        items: [
          item('Driver Seat', 'pass', 'Leather in excellent condition'),
          item('Passenger Seat', 'pass', 'No wear'),
          item('Rear Seats', 'pass', 'Clean, no stains'),
          item('Seat Belts', 'pass', 'All retract properly'),
          item('Dashboard', 'pass', 'No cracks'),
          item('Steering Wheel', 'pass', 'Heated, no wear'),
          item('Infotainment System', 'pass', 'Responsive, all features work'),
          item('Climate Control', 'pass', 'AC cold, heat hot'),
          item('Power Windows', 'pass', 'All 4 work'),
          item('Power Locks', 'pass', 'All doors lock/unlock'),
          item('Interior Lights', 'pass', 'All illuminating'),
          item('Carpet', 'pass', 'Clean, no stains'),
          item('Headliner', 'pass', 'No sagging'),
        ],
      },
      {
        name: 'Mechanical',
        pointCount: 45,
        passed: 44,
        failed: 1,
        items: [
          item('Engine Oil Level', 'pass', 'Full, clean'),
          item('Engine Oil Leaks', 'pass', 'None detected'),
          item('Coolant Level', 'pass', 'Full'),
          item('Transmission Fluid', 'pass', 'Clean, proper level'),
          item('Brake Fluid', 'pass', 'Full'),
          item('Engine Start', 'pass', 'Starts immediately'),
          item('Engine Idle', 'pass', 'Smooth, 750 RPM'),
          item('Engine Noise', 'pass', 'No abnormal sounds'),
          item('Exhaust System', 'pass', 'No leaks'),
          item('Transmission Operation', 'pass', 'Shifts smoothly'),
          item('Suspension - Front', 'pass', 'No play'),
          item('Suspension - Rear', 'pass', 'No play'),
          item('Steering', 'pass', 'Responsive, no play'),
          item('Air Filter', 'replaced', 'Replaced with new OEM filter'),
          item('Cabin Air Filter', 'pass', 'Clean'),
          item('Drive Belt', 'pass', 'No cracks, proper tension'),
        ],
      },
      {
        name: 'Electrical',
        pointCount: 30,
        passed: 30,
        failed: 0,
        items: [
          item('Battery', 'pass', '98% health, 2 years old'),
          item('Alternator', 'pass', '14.2V output'),
          item('Starter', 'pass', 'Engages properly'),
          item('OBD-II Scan', 'pass', 'No codes stored'),
          item('Fuse Box', 'pass', 'All fuses good'),
          item('Headlight Switch', 'pass', 'All positions work'),
          item('Power Seat Motors', 'pass', 'All adjustments work'),
          item('Heated Seats', 'pass', 'Both sides heat'),
          item('Sunroof Motor', 'pass', 'Opens/closes/tilts'),
          item('Blower Motor', 'pass', 'All speeds work'),
          item('AC Compressor', 'pass', 'Engages, blows cold'),
          item('TPMS Sensors', 'pass', 'All 4 reading'),
          item('Backup Camera', 'pass', 'Clear image'),
        ],
      },
      {
        name: 'Safety',
        pointCount: 40,
        passed: 40,
        failed: 0,
        items: [
          item('Driver Airbag', 'pass', 'No warning light'),
          item('Passenger Airbag', 'pass', 'No warning light'),
          item('Side Airbags', 'pass', 'No warning light'),
          item('Curtain Airbags', 'pass', 'No warning light'),
          item('Seat Belt Pretensioners', 'pass', 'All functional'),
          item('Child Seat Anchors', 'pass', 'LATCH system intact'),
          item('Hood Latch', 'pass', 'Primary and safety work'),
          item('Trunk Latch', 'pass', 'Emergency release works'),
          item('Brake Pedal', 'pass', 'Firm, ABS functional'),
          item('Emergency Brake', 'pass', 'Holds on incline'),
          item('ABS Warning Light', 'pass', 'Not illuminated'),
          item('Airbag Warning Light', 'pass', 'Not illuminated'),
          item('Check Engine Light', 'pass', 'Not illuminated'),
          item('Forward Collision Warning', 'pass', 'Calibrated'),
          item('Lane Departure Warning', 'pass', 'Functional'),
          item('Blind Spot Monitoring', 'pass', 'Both sides detect'),
          item('Rear Cross Traffic Alert', 'pass', 'Functional'),
          item('Spare Tire', 'pass', 'Inflated, jack present'),
        ],
      },
      {
        name: 'Tires & Brakes',
        pointCount: 30,
        passed: 28,
        failed: 2,
        items: [
          item('Front Left Tire', 'pass', '7/32" tread, Michelin'),
          item('Front Right Tire', 'pass', '7/32" tread, Michelin'),
          item('Rear Left Tire', 'pass', '6/32" tread, Michelin'),
          item('Rear Right Tire', 'pass', '6/32" tread, Michelin'),
          item('Tire Pressure - FL', 'pass', '35 PSI'),
          item('Tire Pressure - FR', 'pass', '35 PSI'),
          item('Tire Pressure - RL', 'pass', '35 PSI'),
          item('Tire Pressure - RR', 'pass', '35 PSI'),
          item('Wheel - FL', 'pass', 'No curb rash'),
          item('Wheel - FR', 'repaired', 'Minor curb rash refinished'),
          item('Wheel - RL', 'pass', 'No damage'),
          item('Wheel - RR', 'pass', 'No damage'),
          item('Front Brake Pads', 'pass', '8mm remaining'),
          item('Rear Brake Pads', 'pass', '7mm remaining'),
          item('Front Rotors', 'pass', 'Within spec'),
          item('Rear Rotors', 'pass', 'Within spec'),
          item('Brake Lines', 'pass', 'No leaks'),
          item('ABS Sensors', 'pass', 'All 4 reading'),
          item('Wheel Alignment', 'adjusted', 'Aligned to spec'),
        ],
      },
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
