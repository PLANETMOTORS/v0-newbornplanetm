import { pushEvent } from './data-layer'
import { generateEventId } from './event-ids'
import { getAttributionForEvent } from './attribution'
import { getConsentForEvent } from './consent'
import type {
  FinanceProvider,
  InventoryFilterState,
  LeadType,
  PageType,
  VehicleTrackingData,
} from './types'

function baseEvent(eventName: string, eventId?: string) {
  return {
    event_id: eventId ?? generateEventId(eventName),
    ...getAttributionForEvent(),
    ...getConsentForEvent(),
  }
}

export function trackPageView(input: {
  pathname: string
  search?: string
  pageType: PageType
  title?: string
  location?: string
  referrer?: string | null
  eventId?: string
}) {
  pushEvent({
    event: 'page_view',
    ...baseEvent('page_view', input.eventId),
    page_path: input.pathname,
    page_search: input.search || null,
    page_location: input.location ?? null,
    page_title: input.title ?? null,
    page_referrer: input.referrer ?? null,
    page_type: input.pageType,
  })
}

export function trackViewVehicle(vehicle: VehicleTrackingData & { eventId?: string }) {
  pushEvent({
    event: 'view_vehicle',
    ...baseEvent('view_vehicle', vehicle.eventId),
    page_type: 'vdp',
    vehicle_id: vehicle.vin,
    vin: vehicle.vin,
    stock_number: vehicle.stock_number ?? null,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim ?? null,
    condition: vehicle.condition ?? 'used',
    price: vehicle.price ?? null,
    value: vehicle.price ?? null,
    currency: vehicle.currency ?? 'CAD',
    mileage_km: vehicle.mileage_km ?? null,
    body_style: vehicle.body_style ?? null,
    fuel_type: vehicle.fuel_type ?? null,
    drivetrain: vehicle.drivetrain ?? null,
    exterior_color: vehicle.exterior_color ?? null,
    interior_color: vehicle.interior_color ?? null,
    battery_soh_score: vehicle.battery_soh_score ?? null,
    aviloo_certified: vehicle.aviloo_certified ?? false,
    epa_range_km: vehicle.epa_range_km ?? null,
    battery_capacity_kwh: vehicle.battery_capacity_kwh ?? null,
    image_count: vehicle.image_count ?? null,
    canonical_url: vehicle.canonical_url ?? null,
    inventory_status: vehicle.inventory_status ?? null,
    location_name: vehicle.location_name ?? 'Planet Motors Richmond Hill',
  })
}

export function trackInventorySearch(input: {
  query: string
  resultCount?: number
  filters?: InventoryFilterState
  eventId?: string
}) {
  pushEvent({
    event: 'search_inventory',
    ...baseEvent('search_inventory', input.eventId),
    page_type: 'srp',
    search_query: input.query,
    result_count: input.resultCount ?? null,
    filters: input.filters ?? null,
  })
}

export function trackInventoryFilter(input: {
  filters: InventoryFilterState
  resultCount?: number
  eventId?: string
}) {
  pushEvent({
    event: 'filter_inventory',
    ...baseEvent('filter_inventory', input.eventId),
    page_type: 'srp',
    filter_query: input.filters.query ?? null,
    filter_make: input.filters.make ?? null,
    filter_model: input.filters.model ?? null,
    filter_fuel_type: input.filters.fuelType ?? null,
    filter_body_style: input.filters.bodyStyle ?? null,
    filter_price_min: input.filters.priceRange?.[0] ?? null,
    filter_price_max: input.filters.priceRange?.[1] ?? null,
    filter_payment_min: input.filters.paymentRange?.[0] ?? null,
    filter_payment_max: input.filters.paymentRange?.[1] ?? null,
    filter_year_min: input.filters.yearRange?.[0] ?? null,
    filter_year_max: input.filters.yearRange?.[1] ?? null,
    filter_sort: input.filters.sort ?? null,
    result_count: input.resultCount ?? null,
  })
}

export function trackLeadSubmit(input: {
  leadType: LeadType
  formName: string
  leadId?: string | null
  vehicleVin?: string | null
  pageType?: PageType
  value?: number
  eventId?: string
}) {
  pushEvent({
    event: 'lead_submit',
    ...baseEvent('lead_submit', input.eventId),
    lead_type: input.leadType,
    form_name: input.formName,
    lead_id: input.leadId ?? null,
    vehicle_id: input.vehicleVin ?? null,
    page_type: input.pageType ?? 'other',
    value: input.value ?? 1,
    currency: 'CAD',
  })
}

export function trackBookTestDrive(input: {
  vehicleVin: string
  leadId?: string | null
  preferredDate?: string | null
  eventId?: string
}) {
  pushEvent({
    event: 'book_test_drive',
    ...baseEvent('book_test_drive', input.eventId),
    page_type: 'vdp',
    vehicle_id: input.vehicleVin,
    lead_id: input.leadId ?? null,
    preferred_date: input.preferredDate ?? null,
    value: 1,
    currency: 'CAD',
  })
}

export function trackClickToCall(input: {
  department: 'sales' | 'finance' | 'service' | 'general' | string
  pageType: PageType
  phoneLabel?: string
  eventId?: string
}) {
  pushEvent({
    event: 'click_to_call',
    ...baseEvent('click_to_call', input.eventId),
    department: input.department,
    phone_label: input.phoneLabel ?? null,
    page_type: input.pageType,
    value: 1,
    currency: 'CAD',
  })
}

export function trackGetDirections(input?: {
  locationName?: string
  pageType?: PageType
  eventId?: string
}) {
  pushEvent({
    event: 'get_directions',
    ...baseEvent('get_directions', input?.eventId),
    location_name: input?.locationName ?? 'Planet Motors Richmond Hill',
    page_type: input?.pageType ?? 'contact',
    value: 1,
    currency: 'CAD',
  })
}

export function trackTradeInSubmit(input: {
  leadId?: string | null
  vehicleYear?: number | null
  make?: string | null
  model?: string | null
  eventId?: string
}) {
  pushEvent({
    event: 'trade_in_submit',
    ...baseEvent('trade_in_submit', input.eventId),
    page_type: 'trade_in',
    lead_id: input.leadId ?? null,
    trade_vehicle_year: input.vehicleYear ?? null,
    trade_vehicle_make: input.make ?? null,
    trade_vehicle_model: input.model ?? null,
    value: 1,
    currency: 'CAD',
  })
}

export function trackFinanceApplicationStart(input?: {
  vehicleVin?: string | null
  eventId?: string
}) {
  pushEvent({
    event: 'finance_application_start',
    ...baseEvent('finance_application_start', input?.eventId),
    page_type: 'finance',
    vehicle_id: input?.vehicleVin ?? null,
    step: 1,
  })
}

export function trackFinanceStepComplete(input: {
  step: number
  stepName: string
  applicationId?: string | null
  vehicleVin?: string | null
  eventId?: string
}) {
  pushEvent({
    event: 'finance_step_complete',
    ...baseEvent(`finance_step_${input.step}_complete`, input.eventId),
    page_type: 'finance',
    step: input.step,
    step_name: input.stepName,
    application_id: input.applicationId ?? null,
    vehicle_id: input.vehicleVin ?? null,
  })
}

export function trackPersonaIdvComplete(input: {
  status: 'passed' | 'failed' | 'needs_review'
  applicationId?: string | null
  eventId?: string
}) {
  pushEvent({
    event: 'finance_idv_complete',
    ...baseEvent('finance_idv_complete', input.eventId),
    page_type: 'finance',
    idv_status: input.status,
    idv_provider: 'persona',
    application_id: input.applicationId ?? null,
  })
}

export function trackFinanceApplicationSubmit(input: {
  applicationId: string
  provider: FinanceProvider
  vehicleVin?: string | null
  eventId?: string
}) {
  pushEvent({
    event: 'finance_application_submit',
    ...baseEvent('finance_application_submit', input.eventId),
    page_type: 'finance',
    application_id: input.applicationId,
    finance_provider: input.provider,
    vehicle_id: input.vehicleVin ?? null,
    value: 1,
    currency: 'CAD',
  })
}

export function trackPaymentCalculatorUse(input: {
  vehicleVin?: string | null
  price?: number | null
  downPayment?: number | null
  termMonths?: number | null
  monthlyPayment?: number | null
  eventId?: string
}) {
  pushEvent({
    event: 'payment_calculator_use',
    ...baseEvent('payment_calculator_use', input.eventId),
    page_type: 'vdp',
    vehicle_id: input.vehicleVin ?? null,
    vehicle_price: input.price ?? null,
    down_payment: input.downPayment ?? null,
    term_months: input.termMonths ?? null,
    monthly_payment: input.monthlyPayment ?? null,
    currency: 'CAD',
  })
}

export function trackFormStart(input: {
  formName: string
  leadType?: LeadType
  vehicleVin?: string | null
  pageType?: PageType
  eventId?: string
}) {
  pushEvent({
    event: 'form_start',
    ...baseEvent('form_start', input.eventId),
    form_name: input.formName,
    lead_type: input.leadType ?? null,
    vehicle_id: input.vehicleVin ?? null,
    page_type: input.pageType ?? 'other',
  })
}

export function trackTradeInStart(input?: {
  vehicleVin?: string | null
  eventId?: string
}) {
  pushEvent({
    event: 'trade_in_start',
    ...baseEvent('trade_in_start', input?.eventId),
    page_type: 'trade_in',
    vehicle_id: input?.vehicleVin ?? null,
  })
}

export function trackServiceAppointment(input: {
  leadId?: string | null
  serviceType?: string | null
  appointmentDate?: string | null
  eventId?: string
}) {
  pushEvent({
    event: 'service_appointment',
    ...baseEvent('service_appointment', input.eventId),
    page_type: 'service',
    lead_id: input.leadId ?? null,
    service_type: input.serviceType ?? null,
    appointment_date: input.appointmentDate ?? null,
    value: 1,
    currency: 'CAD',
  })
}
