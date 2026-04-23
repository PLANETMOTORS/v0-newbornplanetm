import { NextRequest, NextResponse } from 'next/server'

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
          { name: 'Front Bumper', status: 'pass', notes: 'No damage' },
          { name: 'Rear Bumper', status: 'pass', notes: 'No damage' },
          { name: 'Hood', status: 'pass', notes: 'Alignment correct' },
          { name: 'Trunk Lid', status: 'pass', notes: 'Opens/closes properly' },
          { name: 'Driver Front Door', status: 'pass', notes: 'No dents' },
          { name: 'Driver Rear Door', status: 'pass', notes: 'No dents' },
          { name: 'Passenger Front Door', status: 'pass', notes: 'No dents' },
          { name: 'Passenger Rear Door', status: 'pass', notes: 'No dents' },
          { name: 'Windshield', status: 'pass', notes: 'No chips or cracks' },
          { name: 'Rear Window', status: 'pass', notes: 'Clear, defroster works' },
          { name: 'Driver Side Mirror', status: 'pass', notes: 'Power adjustment works' },
          { name: 'Passenger Side Mirror', status: 'pass', notes: 'Power adjustment works' },
          { name: 'Headlights', status: 'pass', notes: 'LED, bright and clear' },
          { name: 'Tail Lights', status: 'pass', notes: 'All functions work' },
          { name: 'Turn Signals', status: 'pass', notes: 'Front and rear work' },
          { name: 'Paint Condition', status: 'pass', notes: 'Excellent, factory finish' },
          { name: 'Clear Coat', status: 'pass', notes: 'No peeling' },
          { name: 'Wiper Blades', status: 'repaired', notes: 'Replaced with new OEM blades' },
        ],
      },
      {
        name: 'Interior',
        pointCount: 30,
        passed: 30,
        failed: 0,
        items: [
          { name: 'Driver Seat', status: 'pass', notes: 'Leather in excellent condition' },
          { name: 'Passenger Seat', status: 'pass', notes: 'No wear' },
          { name: 'Rear Seats', status: 'pass', notes: 'Clean, no stains' },
          { name: 'Seat Belts', status: 'pass', notes: 'All retract properly' },
          { name: 'Dashboard', status: 'pass', notes: 'No cracks' },
          { name: 'Steering Wheel', status: 'pass', notes: 'Heated, no wear' },
          { name: 'Infotainment System', status: 'pass', notes: 'Responsive, all features work' },
          { name: 'Climate Control', status: 'pass', notes: 'AC cold, heat hot' },
          { name: 'Power Windows', status: 'pass', notes: 'All 4 work' },
          { name: 'Power Locks', status: 'pass', notes: 'All doors lock/unlock' },
          { name: 'Interior Lights', status: 'pass', notes: 'All illuminating' },
          { name: 'Carpet', status: 'pass', notes: 'Clean, no stains' },
          { name: 'Headliner', status: 'pass', notes: 'No sagging' },
        ],
      },
      {
        name: 'Mechanical',
        pointCount: 45,
        passed: 44,
        failed: 1,
        items: [
          { name: 'Engine Oil Level', status: 'pass', notes: 'Full, clean' },
          { name: 'Engine Oil Leaks', status: 'pass', notes: 'None detected' },
          { name: 'Coolant Level', status: 'pass', notes: 'Full' },
          { name: 'Transmission Fluid', status: 'pass', notes: 'Clean, proper level' },
          { name: 'Brake Fluid', status: 'pass', notes: 'Full' },
          { name: 'Engine Start', status: 'pass', notes: 'Starts immediately' },
          { name: 'Engine Idle', status: 'pass', notes: 'Smooth, 750 RPM' },
          { name: 'Engine Noise', status: 'pass', notes: 'No abnormal sounds' },
          { name: 'Exhaust System', status: 'pass', notes: 'No leaks' },
          { name: 'Transmission Operation', status: 'pass', notes: 'Shifts smoothly' },
          { name: 'Suspension - Front', status: 'pass', notes: 'No play' },
          { name: 'Suspension - Rear', status: 'pass', notes: 'No play' },
          { name: 'Steering', status: 'pass', notes: 'Responsive, no play' },
          { name: 'Air Filter', status: 'replaced', notes: 'Replaced with new OEM filter' },
          { name: 'Cabin Air Filter', status: 'pass', notes: 'Clean' },
          { name: 'Drive Belt', status: 'pass', notes: 'No cracks, proper tension' },
        ],
      },
      {
        name: 'Electrical',
        pointCount: 30,
        passed: 30,
        failed: 0,
        items: [
          { name: 'Battery', status: 'pass', notes: '98% health, 2 years old' },
          { name: 'Alternator', status: 'pass', notes: '14.2V output' },
          { name: 'Starter', status: 'pass', notes: 'Engages properly' },
          { name: 'OBD-II Scan', status: 'pass', notes: 'No codes stored' },
          { name: 'Fuse Box', status: 'pass', notes: 'All fuses good' },
          { name: 'Headlight Switch', status: 'pass', notes: 'All positions work' },
          { name: 'Power Seat Motors', status: 'pass', notes: 'All adjustments work' },
          { name: 'Heated Seats', status: 'pass', notes: 'Both sides heat' },
          { name: 'Sunroof Motor', status: 'pass', notes: 'Opens/closes/tilts' },
          { name: 'Blower Motor', status: 'pass', notes: 'All speeds work' },
          { name: 'AC Compressor', status: 'pass', notes: 'Engages, blows cold' },
          { name: 'TPMS Sensors', status: 'pass', notes: 'All 4 reading' },
          { name: 'Backup Camera', status: 'pass', notes: 'Clear image' },
        ],
      },
      {
        name: 'Safety',
        pointCount: 40,
        passed: 40,
        failed: 0,
        items: [
          { name: 'Driver Airbag', status: 'pass', notes: 'No warning light' },
          { name: 'Passenger Airbag', status: 'pass', notes: 'No warning light' },
          { name: 'Side Airbags', status: 'pass', notes: 'No warning light' },
          { name: 'Curtain Airbags', status: 'pass', notes: 'No warning light' },
          { name: 'Seat Belt Pretensioners', status: 'pass', notes: 'All functional' },
          { name: 'Child Seat Anchors', status: 'pass', notes: 'LATCH system intact' },
          { name: 'Hood Latch', status: 'pass', notes: 'Primary and safety work' },
          { name: 'Trunk Latch', status: 'pass', notes: 'Emergency release works' },
          { name: 'Brake Pedal', status: 'pass', notes: 'Firm, ABS functional' },
          { name: 'Emergency Brake', status: 'pass', notes: 'Holds on incline' },
          { name: 'ABS Warning Light', status: 'pass', notes: 'Not illuminated' },
          { name: 'Airbag Warning Light', status: 'pass', notes: 'Not illuminated' },
          { name: 'Check Engine Light', status: 'pass', notes: 'Not illuminated' },
          { name: 'Forward Collision Warning', status: 'pass', notes: 'Calibrated' },
          { name: 'Lane Departure Warning', status: 'pass', notes: 'Functional' },
          { name: 'Blind Spot Monitoring', status: 'pass', notes: 'Both sides detect' },
          { name: 'Rear Cross Traffic Alert', status: 'pass', notes: 'Functional' },
          { name: 'Spare Tire', status: 'pass', notes: 'Inflated, jack present' },
        ],
      },
      {
        name: 'Tires & Brakes',
        pointCount: 30,
        passed: 28,
        failed: 2,
        items: [
          { name: 'Front Left Tire', status: 'pass', notes: '7/32" tread, Michelin' },
          { name: 'Front Right Tire', status: 'pass', notes: '7/32" tread, Michelin' },
          { name: 'Rear Left Tire', status: 'pass', notes: '6/32" tread, Michelin' },
          { name: 'Rear Right Tire', status: 'pass', notes: '6/32" tread, Michelin' },
          { name: 'Tire Pressure - FL', status: 'pass', notes: '35 PSI' },
          { name: 'Tire Pressure - FR', status: 'pass', notes: '35 PSI' },
          { name: 'Tire Pressure - RL', status: 'pass', notes: '35 PSI' },
          { name: 'Tire Pressure - RR', status: 'pass', notes: '35 PSI' },
          { name: 'Wheel - FL', status: 'pass', notes: 'No curb rash' },
          { name: 'Wheel - FR', status: 'repaired', notes: 'Minor curb rash refinished' },
          { name: 'Wheel - RL', status: 'pass', notes: 'No damage' },
          { name: 'Wheel - RR', status: 'pass', notes: 'No damage' },
          { name: 'Front Brake Pads', status: 'pass', notes: '8mm remaining' },
          { name: 'Rear Brake Pads', status: 'pass', notes: '7mm remaining' },
          { name: 'Front Rotors', status: 'pass', notes: 'Within spec' },
          { name: 'Rear Rotors', status: 'pass', notes: 'Within spec' },
          { name: 'Brake Lines', status: 'pass', notes: 'No leaks' },
          { name: 'ABS Sensors', status: 'pass', notes: 'All 4 reading' },
          { name: 'Wheel Alignment', status: 'adjusted', notes: 'Aligned to spec' },
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
