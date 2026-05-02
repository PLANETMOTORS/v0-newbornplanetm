export type PageType =
  | 'homepage'
  | 'srp'
  | 'vdp'
  | 'finance'
  | 'trade_in'
  | 'service'
  | 'contact'
  | 'about'
  | 'blog'
  | 'legal'
  | 'other'

export type VehicleCondition = 'used' | 'new' | 'certified'

export type VehicleTrackingData = {
  vin: string
  stock_number?: string | null
  year: number
  make: string
  model: string
  trim?: string | null
  condition?: VehicleCondition
  price?: number | null
  currency?: 'CAD'
  mileage_km?: number | null
  body_style?: string | null
  fuel_type?: string | null
  drivetrain?: string | null
  exterior_color?: string | null
  interior_color?: string | null
  battery_soh_score?: number | null
  aviloo_certified?: boolean | null
  epa_range_km?: number | null
  battery_capacity_kwh?: number | null
  image_count?: number | null
  canonical_url?: string | null
  inventory_status?: 'available' | 'pending' | 'sold' | 'archived' | string
  location_name?: string | null
}

export type InventoryFilterState = {
  query?: string
  make?: string
  model?: string
  fuelType?: string
  bodyStyle?: string
  priceRange?: [number, number]
  paymentRange?: [number, number]
  yearRange?: [number, number]
  sort?: string
}

export type LeadType =
  | 'test_drive'
  | 'general'
  | 'trade_in'
  | 'contact'
  | 'service'
  | 'finance'
  | 'price_alert'

export type FinanceProvider = 'routeone' | 'dealertrack' | 'internal' | 'unknown'

export type TrackingPayload = {
  event: string
  event_id?: string
  page_type?: PageType
  value?: number | null
  currency?: 'CAD' | string
  [key: string]: unknown
}

export type AttributionPayload = {
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  gclid?: string | null
  gbraid?: string | null
  wbraid?: string | null
  fbclid?: string | null
  ttclid?: string | null
  msclkid?: string | null
  landing_page?: string | null
  landing_page_path?: string | null
  referrer?: string | null
  captured_at?: string | null
}
