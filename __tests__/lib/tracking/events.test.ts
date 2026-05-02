/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  trackPageView,
  trackViewVehicle,
  trackInventorySearch,
  trackInventoryFilter,
  trackLeadSubmit,
  trackBookTestDrive,
  trackClickToCall,
  trackGetDirections,
  trackTradeInSubmit,
  trackTradeInStart,
  trackFinanceApplicationStart,
  trackFinanceStepComplete,
  trackPersonaIdvComplete,
  trackFinanceApplicationSubmit,
  trackPaymentCalculatorUse,
  trackFormStart,
  trackServiceAppointment,
} from '@/lib/tracking/events'

type DLWindow = Window & typeof globalThis & { dataLayer: Record<string, unknown>[] }

describe('tracking events', () => {
  beforeEach(() => {
    ;(window as DLWindow).dataLayer = []
    sessionStorage.removeItem('pm_attribution_v2')
    sessionStorage.removeItem('pm_consent_v1')
  })

  function getDataLayer(): Record<string, unknown>[] {
    return (window as DLWindow).dataLayer
  }

  function findEvent(name: string) {
    return getDataLayer().find((e) => e.event === name)
  }

  it('trackPageView pushes page_view event', () => {
    trackPageView({
      pathname: '/inventory',
      search: '?make=Tesla',
      pageType: 'srp',
      title: 'Inventory',
      location: 'https://planetmotors.ca/inventory?make=Tesla',
      referrer: null,
    })
    const event = findEvent('page_view')
    expect(event).toBeDefined()
    expect(event?.page_type).toBe('srp')
    expect(event?.page_path).toBe('/inventory')
  })

  it('trackViewVehicle pushes view_vehicle event', () => {
    trackViewVehicle({
      vin: '1HGCM82633A004352',
      vehicle_id: 'abc-123',
      make: 'Tesla',
      model: 'Model 3',
      year: 2024,
      price: 43500,
      condition: 'used',
    })
    const event = findEvent('view_vehicle')
    expect(event).toBeDefined()
    expect(event?.make).toBe('Tesla')
    expect(event?.model).toBe('Model 3')
    expect(event?.price).toBe(43500)
    expect(event?.vin).toBe('1HGCM82633A004352')
  })

  it('trackInventorySearch pushes search_inventory event', () => {
    trackInventorySearch({ query: 'Tesla', resultCount: 5 })
    const event = findEvent('search_inventory')
    expect(event).toBeDefined()
    expect(event?.search_query).toBe('Tesla')
    expect(event?.result_count).toBe(5)
  })

  it('trackInventoryFilter pushes filter_inventory event', () => {
    trackInventoryFilter({
      filters: { make: 'Tesla' },
      resultCount: 3,
    })
    const event = findEvent('filter_inventory')
    expect(event).toBeDefined()
    expect(event?.filter_make).toBe('Tesla')
  })

  it('trackLeadSubmit pushes lead_submit event', () => {
    trackLeadSubmit({
      leadType: 'contact_form',
      formName: 'contact',
      pageType: 'contact',
    })
    const event = findEvent('lead_submit')
    expect(event).toBeDefined()
    expect(event?.lead_type).toBe('contact_form')
    expect(event?.form_name).toBe('contact')
  })

  it('trackBookTestDrive pushes book_test_drive event', () => {
    trackBookTestDrive({ vehicleVin: 'VIN123' })
    const event = findEvent('book_test_drive')
    expect(event).toBeDefined()
    expect(event?.vehicle_id).toBe('VIN123')
  })

  it('trackClickToCall pushes click_to_call event', () => {
    trackClickToCall({ department: 'sales', pageType: 'vdp' })
    const event = findEvent('click_to_call')
    expect(event).toBeDefined()
    expect(event?.department).toBe('sales')
  })

  it('trackGetDirections pushes get_directions event', () => {
    trackGetDirections({ pageType: 'contact' })
    const event = findEvent('get_directions')
    expect(event).toBeDefined()
    expect(event?.page_type).toBe('contact')
  })

  it('trackTradeInSubmit pushes trade_in_submit event', () => {
    trackTradeInSubmit({ make: 'Toyota', model: 'Camry', vehicleYear: 2020 })
    const event = findEvent('trade_in_submit')
    expect(event).toBeDefined()
    expect(event?.trade_vehicle_make).toBe('Toyota')
  })

  it('trackTradeInStart pushes trade_in_start event', () => {
    trackTradeInStart()
    const event = findEvent('trade_in_start')
    expect(event).toBeDefined()
    expect(event?.page_type).toBe('trade_in')
  })

  it('trackFinanceApplicationStart pushes finance_application_start event', () => {
    trackFinanceApplicationStart()
    const event = findEvent('finance_application_start')
    expect(event).toBeDefined()
    expect(event?.page_type).toBe('finance')
    expect(event?.step).toBe(1)
  })

  it('trackFinanceStepComplete pushes finance_step_complete event', () => {
    trackFinanceStepComplete({ step: 2, stepName: 'personal_info' })
    const event = findEvent('finance_step_complete')
    expect(event).toBeDefined()
    expect(event?.step_name).toBe('personal_info')
    expect(event?.step).toBe(2)
  })

  it('trackPersonaIdvComplete pushes finance_idv_complete event', () => {
    trackPersonaIdvComplete({ status: 'passed' })
    const event = findEvent('finance_idv_complete')
    expect(event).toBeDefined()
    expect(event?.idv_status).toBe('passed')
    expect(event?.idv_provider).toBe('persona')
  })

  it('trackFinanceApplicationSubmit pushes finance_application_submit event', () => {
    trackFinanceApplicationSubmit({
      applicationId: 'app-123',
      provider: 'in_house',
    })
    const event = findEvent('finance_application_submit')
    expect(event).toBeDefined()
    expect(event?.application_id).toBe('app-123')
    expect(event?.finance_provider).toBe('in_house')
  })

  it('trackPaymentCalculatorUse pushes payment_calculator_use event', () => {
    trackPaymentCalculatorUse({
      price: 43500,
      downPayment: 5000,
      termMonths: 72,
      monthlyPayment: 650,
    })
    const event = findEvent('payment_calculator_use')
    expect(event).toBeDefined()
    expect(event?.vehicle_price).toBe(43500)
    expect(event?.monthly_payment).toBe(650)
    expect(event?.down_payment).toBe(5000)
  })

  it('trackFormStart pushes form_start event', () => {
    trackFormStart({ formName: 'contact', pageType: 'contact' })
    const event = findEvent('form_start')
    expect(event).toBeDefined()
    expect(event?.form_name).toBe('contact')
  })

  it('trackServiceAppointment pushes service_appointment event', () => {
    trackServiceAppointment({ serviceType: 'oil_change' })
    const event = findEvent('service_appointment')
    expect(event).toBeDefined()
    expect(event?.service_type).toBe('oil_change')
    expect(event?.page_type).toBe('service')
  })

  it('all events include event_id', () => {
    trackPageView({ pathname: '/', pageType: 'homepage' })
    const event = findEvent('page_view')
    expect(event?.event_id).toBeDefined()
    expect(typeof event?.event_id).toBe('string')
  })

  it('all events include event_time_iso', () => {
    trackLeadSubmit({ leadType: 'contact_form', formName: 'test' })
    const event = findEvent('lead_submit')
    expect(event?.event_time_iso).toBeDefined()
  })
})
