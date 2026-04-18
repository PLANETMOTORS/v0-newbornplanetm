/**
 * Supabase Database Types
 * Manually derived from SQL migration scripts in scripts/.
 * Regenerate with:  pnpm db:types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface VehicleRow {
  id: string; stock_number: string; vin: string
  year: number; make: string; model: string; trim: string | null
  body_style: string | null; exterior_color: string | null; interior_color: string | null
  price: number; msrp: number | null; savings: number | null; mileage: number
  drivetrain: string | null; transmission: string | null; engine: string | null
  fuel_type: string | null; fuel_economy_city: number | null; fuel_economy_highway: number | null
  is_ev: boolean; battery_capacity_kwh: number | null; range_miles: number | null
  ev_battery_health_percent: number | null
  status: 'available' | 'reserved' | 'sold' | 'pending'
  is_certified: boolean; is_new_arrival: boolean; featured: boolean
  inspection_score: number | null; inspection_date: string | null
  primary_image_url: string | null; image_urls: string[] | null
  has_360_spin: boolean; video_url: string | null; location: string
  created_at: string; updated_at: string
}

export interface ReservationRow {
  id: string; vehicle_id: string; user_id: string | null
  customer_email: string; customer_phone: string | null; customer_name: string | null
  stripe_payment_intent_id: string | null; stripe_checkout_session_id: string | null
  deposit_amount: number
  deposit_status: 'pending' | 'paid' | 'refunded' | 'failed'
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'completed'
  expires_at: string; created_at: string; updated_at: string; notes: string | null
}

export interface OrderRow {
  id: string; order_number: string; customer_id: string; vehicle_id: string
  status: 'created' | 'confirmed' | 'processing' | 'ready_for_delivery' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded'
  payment_method: 'financing' | 'cash' | 'bank_draft'
  financing_offer_id: string | null; trade_in_offer_id: string | null
  delivery_type: 'pickup' | 'delivery'
  delivery_address_id: string | null; hub_id: string | null
  preferred_date: string | null; preferred_time_slot: string | null
  protection_plan_id: string | null
  vehicle_price_cents: number; documentation_fee_cents: number; omvic_fee_cents: number
  delivery_fee_cents: number; protection_plan_fee_cents: number
  tax_rate_percent: number; tax_amount_cents: number; total_before_credits_cents: number
  trade_in_credit_cents: number; down_payment_cents: number; total_credits_cents: number
  total_price_cents: number; amount_financed_cents: number
  timeline: Json; documents_required: Json; return_policy: Json | null
  created_at: string; updated_at: string
}

export interface ProfileRow {
  id: string; email: string | null; first_name: string | null; last_name: string | null
  phone: string | null; saved_vehicles: string[] | null
  search_alerts: Json; notification_preferences: Json
  created_at: string; updated_at: string
}

export interface TradeInQuoteRow {
  id: string; quote_id: string; user_id: string | null
  vehicle_year: number; vehicle_make: string; vehicle_model: string; vehicle_trim: string | null
  mileage: number | null; condition: string | null; postal_code: string | null; vin: string | null
  customer_name: string | null; customer_email: string | null; customer_phone: string | null
  offer_amount: number; offer_low: number | null; offer_high: number | null
  status: string; valid_until: string | null; applied_to_vehicle_id: string | null
  created_at: string; updated_at: string; accepted_at: string | null; source: string
}

export interface FinanceApplicationV2Row {
  id: string; application_number: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'declined' | 'funded' | 'cancelled'
  agreement_type: 'finance' | 'cash' | 'lease'
  vehicle_id: string | null; user_id: string | null; customer_id: string | null
  requested_amount: number | null; down_payment: number | null; max_down_payment: number | null
  loan_term_months: number
  payment_frequency: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly'
  interest_rate: number | null; admin_fee: number; sales_tax_rate: number
  has_trade_in: boolean; trade_in_vehicle_id: string | null
  trade_in_value: number | null; trade_in_lien_amount: number | null
  total_amount_financed: number | null; estimated_payment: number | null
  total_interest: number | null; total_to_repay: number | null
  additional_notes: string | null; internal_notes: string | null
  created_at: string; updated_at: string; submitted_at: string | null; decision_at: string | null
}

export interface FinanceApplicantRow {
  id: string; application_id: string
  applicant_type: 'primary' | 'co-applicant' | 'co-signer' | 'guarantor'
  is_active: boolean; relation_to_primary: string | null
  salutation: string | null; first_name: string; middle_name: string | null
  last_name: string; suffix: string | null
  sin_encrypted: string | null; date_of_birth: string | null
  gender: string | null; marital_status: string | null
  phone: string | null; mobile_phone: string | null; email: string | null
  no_email: boolean; language_preference: 'en' | 'fr'
  credit_rating: string | null; credit_score: number | null
  created_at: string; updated_at: string
}

export interface FinanceApplicationHistoryRow {
  id: string; application_id: string
  from_status: string | null; to_status: string
  changed_by: string | null; notes: string | null; changed_at: string
}

export interface FinanceDocumentRow {
  id: string; application_id: string; applicant_id: string | null
  document_type: string; document_name: string | null
  file_url: string; file_size: number | null; file_type: string | null
  is_verified: boolean; verified_by: string | null; verified_at: string | null
  verification_notes: string | null; uploaded_at: string; expires_at: string | null
}

export interface FinanceTradeInRow {
  id: string; application_id: string
  vin: string | null; year: number | null; make: string | null; model: string | null
  trim: string | null; color: string | null; mileage: number | null; condition: string | null
  estimated_value: number | null; offered_value: number | null
  has_lien: boolean; lien_holder: string | null; lien_amount: number | null
  net_trade_value: number | null; created_at: string; updated_at: string
}

export interface ApplicantAddressRow {
  id: string; applicant_id: string
  address_type: 'current' | 'previous' | 'mailing'
  address_line: string | null; suite_number: string | null
  street_number: string | null; street_name: string | null
  street_type: string | null; street_direction: string | null
  city: string | null; province: string; postal_code: string | null; country: string
  duration_years: number; duration_months: number; created_at: string; updated_at: string
}

export interface ApplicantHousingRow {
  id: string; applicant_id: string; home_status: string | null
  market_value: number | null; mortgage_amount: number | null
  mortgage_holder: string | null; monthly_payment: number | null
  outstanding_mortgage: number | null; created_at: string; updated_at: string
}

export interface ApplicantEmploymentRow {
  id: string; applicant_id: string
  employment_type: 'current' | 'previous'; employment_category: string | null
  employment_status: string | null; employer_name: string | null
  occupation: string | null; job_title: string | null
  employer_address_type: string | null; employer_suite_number: string | null
  employer_street_number: string | null; employer_street_name: string | null
  employer_street_type: string | null; employer_street_direction: string | null
  employer_city: string | null; employer_province: string | null
  employer_postal_code: string | null; employer_phone: string | null
  employer_phone_ext: string | null
  duration_years: number; duration_months: number; created_at: string; updated_at: string
}

export interface ApplicantIncomeRow {
  id: string; applicant_id: string; gross_income: number
  income_frequency: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly' | 'annually'
  other_income_type: string | null; other_income_amount: number | null
  other_income_frequency: string | null; other_income_description: string | null
  annual_total: number | null; created_at: string; updated_at: string
}

export interface CustomerAddressRow {
  id: string; user_id: string; type: 'home' | 'work' | 'other'
  label: string | null; first_name: string | null; last_name: string | null
  street: string; unit: string | null; city: string; province: string
  postal_code: string; country: string; phone: string | null
  is_default: boolean; delivery_instructions: string | null
  created_at: string; updated_at: string
}

export interface StripeWebhookEventRow {
  id: string; stripe_event_id: string; event_type: string
  status: 'processed' | 'failed'; processed_at: string
  error_message: string | null; created_at: string
}

export interface LiveVideoTourBookingRow {
  id: string; vehicle_id: string; vehicle_name: string
  customer_name: string; customer_email: string; customer_phone: string
  preferred_time: string; timezone: string; provider: string
  join_url: string | null; status: string; assigned_rep_id: string | null
  notes: string | null; created_at: string; updated_at: string
}

export interface NotificationRow {
  id: string; user_id: string; type: string; title: string; message: string
  vehicle_id: string | null; order_id: string | null
  read: boolean; action_url: string | null; created_at: string
}

export interface LeadRow {
  id: string; source: 'contact_form' | 'chat' | 'phone' | 'finance_app' | 'trade_in' | 'reservation' | 'test_drive' | 'walk_in' | 'referral' | 'other'
  status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'converted' | 'lost' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  customer_name: string | null; customer_email: string | null; customer_phone: string | null
  customer_id: string | null; vehicle_id: string | null; vehicle_info: string | null
  subject: string | null; message: string | null; notes: string | null
  assigned_to: string | null; contacted_at: string | null; converted_at: string | null
  conversion_type: string | null
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null
  source_id: string | null; source_table: string | null
  created_at: string; updated_at: string
}

export interface ChatConversationRow {
  id: string; session_id: string
  customer_id: string | null; customer_name: string | null; customer_email: string | null
  status: 'active' | 'ended' | 'escalated' | 'converted'
  vehicle_context: Record<string, unknown> | null
  lead_id: string | null; message_count: number
  escalated_at: string | null; ended_at: string | null
  created_at: string; updated_at: string
}

export interface ChatMessageRow {
  id: string; conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string; metadata: Record<string, unknown> | null
  created_at: string
}

export interface AIAgentConfigRow {
  id: string; agent_type: 'anna' | 'negotiator' | 'valuator'
  display_name: string | null; is_active: boolean
  system_prompt: string | null; welcome_message: string | null
  quick_actions: { label: string; prompt: string }[] | null
  config: Record<string, unknown>; updated_by: string | null
  created_at: string; updated_at: string
}

/* ── Database interface (Supabase client generic parameter) ── */

export interface Database {
  public: {
    Tables: {
      vehicles: { Row: VehicleRow; Insert: Partial<VehicleRow> & Pick<VehicleRow, 'stock_number' | 'vin' | 'year' | 'make' | 'model' | 'price' | 'mileage'>; Update: Partial<VehicleRow> }
      reservations: { Row: ReservationRow; Insert: Partial<ReservationRow> & Pick<ReservationRow, 'vehicle_id' | 'customer_email'>; Update: Partial<ReservationRow> }
      orders: { Row: OrderRow; Insert: Partial<OrderRow> & Pick<OrderRow, 'order_number' | 'customer_id' | 'vehicle_id' | 'payment_method' | 'vehicle_price_cents' | 'tax_amount_cents' | 'total_before_credits_cents' | 'total_price_cents'>; Update: Partial<OrderRow> }
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id'>; Update: Partial<ProfileRow> }
      trade_in_quotes: { Row: TradeInQuoteRow; Insert: Partial<TradeInQuoteRow> & Pick<TradeInQuoteRow, 'quote_id' | 'vehicle_year' | 'vehicle_make' | 'vehicle_model' | 'offer_amount'>; Update: Partial<TradeInQuoteRow> }
      finance_applications_v2: { Row: FinanceApplicationV2Row; Insert: Partial<FinanceApplicationV2Row>; Update: Partial<FinanceApplicationV2Row> }
      finance_applicants: { Row: FinanceApplicantRow; Insert: Partial<FinanceApplicantRow> & Pick<FinanceApplicantRow, 'application_id' | 'first_name' | 'last_name'>; Update: Partial<FinanceApplicantRow> }
      finance_application_history: { Row: FinanceApplicationHistoryRow; Insert: Partial<FinanceApplicationHistoryRow> & Pick<FinanceApplicationHistoryRow, 'application_id' | 'to_status'>; Update: Partial<FinanceApplicationHistoryRow> }
      finance_documents: { Row: FinanceDocumentRow; Insert: Partial<FinanceDocumentRow> & Pick<FinanceDocumentRow, 'application_id' | 'document_type' | 'file_url'>; Update: Partial<FinanceDocumentRow> }
      finance_trade_ins: { Row: FinanceTradeInRow; Insert: Partial<FinanceTradeInRow> & Pick<FinanceTradeInRow, 'application_id'>; Update: Partial<FinanceTradeInRow> }
      applicant_addresses: { Row: ApplicantAddressRow; Insert: Partial<ApplicantAddressRow> & Pick<ApplicantAddressRow, 'applicant_id'>; Update: Partial<ApplicantAddressRow> }
      applicant_housing: { Row: ApplicantHousingRow; Insert: Partial<ApplicantHousingRow> & Pick<ApplicantHousingRow, 'applicant_id'>; Update: Partial<ApplicantHousingRow> }
      applicant_employment: { Row: ApplicantEmploymentRow; Insert: Partial<ApplicantEmploymentRow> & Pick<ApplicantEmploymentRow, 'applicant_id'>; Update: Partial<ApplicantEmploymentRow> }
      applicant_income: { Row: ApplicantIncomeRow; Insert: Partial<ApplicantIncomeRow> & Pick<ApplicantIncomeRow, 'applicant_id' | 'gross_income'>; Update: Partial<ApplicantIncomeRow> }
      customer_addresses: { Row: CustomerAddressRow; Insert: Partial<CustomerAddressRow> & Pick<CustomerAddressRow, 'user_id' | 'street' | 'city' | 'province' | 'postal_code'>; Update: Partial<CustomerAddressRow> }
      stripe_webhook_events: { Row: StripeWebhookEventRow; Insert: Partial<StripeWebhookEventRow> & Pick<StripeWebhookEventRow, 'stripe_event_id' | 'event_type' | 'status'>; Update: Partial<StripeWebhookEventRow> }
      live_video_tour_bookings: { Row: LiveVideoTourBookingRow; Insert: Partial<LiveVideoTourBookingRow> & Pick<LiveVideoTourBookingRow, 'vehicle_id' | 'vehicle_name' | 'customer_name' | 'customer_email' | 'customer_phone' | 'preferred_time'>; Update: Partial<LiveVideoTourBookingRow> }
      notifications: { Row: NotificationRow; Insert: Partial<NotificationRow> & Pick<NotificationRow, 'user_id' | 'type' | 'title' | 'message'>; Update: Partial<NotificationRow> }
      leads: { Row: LeadRow; Insert: Partial<LeadRow>; Update: Partial<LeadRow> }
      chat_conversations: { Row: ChatConversationRow; Insert: Partial<ChatConversationRow> & Pick<ChatConversationRow, 'session_id'>; Update: Partial<ChatConversationRow> }
      chat_messages: { Row: ChatMessageRow; Insert: Partial<ChatMessageRow> & Pick<ChatMessageRow, 'conversation_id' | 'role' | 'content'>; Update: Partial<ChatMessageRow> }
      ai_agent_config: { Row: AIAgentConfigRow; Insert: Partial<AIAgentConfigRow> & Pick<AIAgentConfigRow, 'agent_type'>; Update: Partial<AIAgentConfigRow> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

/** Convenience: extract Row type for a table */
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
/** Convenience: extract Insert type for a table */
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
/** Convenience: extract Update type for a table */
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']