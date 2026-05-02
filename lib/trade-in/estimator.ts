/**
 * Pure trade-in value estimator.
 *
 * Lifted out of `app/api/trade-in/quote/route.ts` so the algorithm can be
 * exercised in isolation by unit tests with no Supabase, no fetch, and no
 * timers. The handler imports `estimateTradeInValue` and treats it as a
 * black-box function from input to estimate.
 *
 * Stays deliberately framework-free: no Next, no Zod, no logger.
 */

export const VEHICLE_CONDITIONS = [
  "excellent",
  "good",
  "fair",
  "poor",
] as const

export type VehicleCondition = (typeof VEHICLE_CONDITIONS)[number]

/** Make-keyed CAD base values (used as the seed for depreciation). */
const BASE_VALUES_CAD: Readonly<Record<string, number>> = Object.freeze({
  tesla: 45000,
  bmw: 35000,
  mercedes: 38000,
  audi: 32000,
  porsche: 55000,
  toyota: 28000,
  honda: 26000,
  ford: 24000,
  chevrolet: 22000,
  nissan: 20000,
  hyundai: 18000,
  kia: 17000,
  volkswagen: 22000,
  mazda: 20000,
  subaru: 24000,
  lexus: 35000,
  acura: 28000,
  infiniti: 26000,
})

const DEFAULT_BASE_VALUE_CAD = 20000

const CONDITION_MULTIPLIER: Readonly<Record<VehicleCondition, number>> = Object.freeze({
  excellent: 1.1,
  good: 1,
  fair: 0.85,
  poor: 0.65,
})

const FLOOR_LOW = 500
const FLOOR_HIGH = 1000
const FLOOR_AVG = 750

const ANNUAL_KM = 20000
const HIGH_MILEAGE_DEDUCTION_PER_10K = 500
const LOW_MILEAGE_BONUS_PER_10K = 300

const DEPRECIATION_YEAR_1_TO_3 = 0.85
const DEPRECIATION_YEAR_4_PLUS = 0.9

const RANGE_LOW_MULTIPLIER = 0.9
const RANGE_HIGH_MULTIPLIER = 1.1

export interface EstimatorInput {
  readonly year: number
  readonly make: string
  readonly mileage: number
  readonly condition: VehicleCondition
  /** Reference year for depreciation. Caller injects to keep the function pure. */
  readonly referenceYear: number
}

export interface EstimateRange {
  readonly lowEstimate: number
  readonly highEstimate: number
  readonly averageEstimate: number
}

function lookupBaseValue(make: string): number {
  const key = make.trim().toLowerCase()
  return BASE_VALUES_CAD[key] ?? DEFAULT_BASE_VALUE_CAD
}

function applyDepreciation(base: number, age: number): number {
  let value = base
  for (let i = 0; i < age; i++) {
    value *= i < 3 ? DEPRECIATION_YEAR_1_TO_3 : DEPRECIATION_YEAR_4_PLUS
  }
  return value
}

function applyMileageAdjustment(value: number, mileage: number, age: number): number {
  const expected = age * ANNUAL_KM
  const diff = mileage - expected
  if (diff > 0) {
    return value - (diff / 10000) * HIGH_MILEAGE_DEDUCTION_PER_10K
  }
  return value + (Math.abs(diff) / 10000) * LOW_MILEAGE_BONUS_PER_10K
}

/**
 * Compute a CAD trade-in estimate range. Pure function: same input → same output.
 *
 * Accepts a `referenceYear` injection so tests can pin "current year" without
 * monkey-patching `Date`. The handler passes `new Date().getUTCFullYear()`.
 */
export function estimateTradeInValue(input: EstimatorInput): EstimateRange {
  const age = Math.max(0, input.referenceYear - input.year)

  const base = lookupBaseValue(input.make)
  const afterDepreciation = applyDepreciation(base, age)
  const afterMileage = applyMileageAdjustment(afterDepreciation, input.mileage, age)
  const afterCondition = afterMileage * CONDITION_MULTIPLIER[input.condition]

  const low = Math.round(afterCondition * RANGE_LOW_MULTIPLIER)
  const high = Math.round(afterCondition * RANGE_HIGH_MULTIPLIER)
  const avg = Math.round(afterCondition)

  return {
    lowEstimate: Math.max(low, FLOOR_LOW),
    highEstimate: Math.max(high, FLOOR_HIGH),
    averageEstimate: Math.max(avg, FLOOR_AVG),
  }
}
