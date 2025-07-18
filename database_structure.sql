-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.airport_transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  hotel_id uuid,
  transport_type text NOT NULL CHECK (transport_type = ANY (ARRAY['hotel_chauffeur'::text, 'private_car'::text])),
  max_capacity integer NOT NULL,
  used integer DEFAULT 0,
  supplier text,
  quote_currency text DEFAULT 'GBP'::text,
  supplier_quote_per_car_local numeric,
  supplier_quote_per_car_gbp numeric,
  paid_to_supplier boolean DEFAULT false,
  outstanding boolean DEFAULT true,
  markup numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  price_per_car_gbp_markup numeric DEFAULT (supplier_quote_per_car_gbp + ((supplier_quote_per_car_gbp * COALESCE(markup, (0)::numeric)) / (100)::numeric)),
  active boolean DEFAULT true,
  CONSTRAINT airport_transfers_pkey PRIMARY KEY (id),
  CONSTRAINT airport_transfers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT airport_transfers_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.gpgt_hotels(id)
);
CREATE TABLE public.booking_components (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  component_type text NOT NULL CHECK (component_type = ANY (ARRAY['ticket'::text, 'hotel_room'::text, 'circuit_transfer'::text, 'airport_transfer'::text, 'flight'::text, 'lounge_pass'::text])),
  component_id uuid,
  component_name text,
  quantity integer,
  unit_price numeric,
  total_price numeric,
  component_data jsonb,
  component_snapshot jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT booking_components_pkey PRIMARY KEY (id),
  CONSTRAINT booking_components_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.booking_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  payment_type text NOT NULL CHECK (payment_type = ANY (ARRAY['deposit'::text, 'second_payment'::text, 'final_payment'::text, 'additional'::text])),
  payment_number integer NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'GBP'::text,
  due_date date,
  paid boolean DEFAULT false,
  paid_at timestamp with time zone,
  payment_reference text,
  payment_method text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT booking_payments_pkey PRIMARY KEY (id),
  CONSTRAINT booking_payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.booking_travelers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  traveler_type text NOT NULL CHECK (traveler_type = ANY (ARRAY['lead'::text, 'guest'::text])),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  passport_number text,
  nationality text,
  dietary_restrictions text,
  accessibility_needs text,
  special_requests text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT booking_travelers_pkey PRIMARY KEY (id),
  CONSTRAINT booking_travelers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_reference text NOT NULL UNIQUE,
  quote_id uuid,
  parent_quote_id uuid,
  quote_version integer,
  event_id uuid,
  client_id uuid,
  consultant_id uuid,
  user_id uuid,
  team_id uuid,
  status text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'provisional'::text, 'pending_payment'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'refunded'::text])),
  total_price numeric NOT NULL,
  currency text DEFAULT 'GBP'::text,
  payment_schedule_snapshot jsonb,
  package_snapshot jsonb,
  provisional_expires_at timestamp with time zone,
  provisional_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  lead_traveler_id uuid,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT bookings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT bookings_parent_quote_id_fkey FOREIGN KEY (parent_quote_id) REFERENCES public.quotes(id),
  CONSTRAINT bookings_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id),
  CONSTRAINT bookings_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.team_members(id),
  CONSTRAINT bookings_lead_traveler_id_fkey FOREIGN KEY (lead_traveler_id) REFERENCES public.booking_travelers(id),
  CONSTRAINT bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.bookings_flights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  source_flight_id uuid,
  api_source text,
  ticketing_deadline date,
  booking_pnr text,
  flight_status text CHECK (flight_status = ANY (ARRAY['Booked - Ticketed - Paid'::text, 'Booked - Ticketed - Not Paid'::text, 'Booked - Not Ticketed'::text])),
  flight_details jsonb NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  currency text DEFAULT 'GBP'::text,
  refundable boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT bookings_flights_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_flights_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT bookings_flights_source_flight_id_fkey FOREIGN KEY (source_flight_id) REFERENCES public.flights(id)
);
CREATE TABLE public.bookings_lounge_passes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  lounge_pass_id uuid,
  booking_reference text,
  quantity integer,
  unit_price numeric,
  total_price numeric,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT bookings_lounge_passes_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_lounge_passes_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT bookings_lounge_passes_lounge_pass_id_fkey FOREIGN KEY (lounge_pass_id) REFERENCES public.lounge_passes(id)
);
CREATE TABLE public.circuit_transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  hotel_id uuid,
  transfer_type text NOT NULL CHECK (transfer_type = ANY (ARRAY['coach'::text, 'mpv'::text])),
  used integer DEFAULT 0,
  coach_capacity integer NOT NULL,
  days integer NOT NULL,
  quote_hours integer,
  expected_hours integer,
  supplier text,
  coach_cost_per_day_local numeric,
  coach_cost_per_hour_local numeric,
  coach_extra_cost_per_hour_local numeric,
  coach_vat numeric,
  parking_ticket_per_coach_per_day numeric,
  supplier_currency text DEFAULT 'EUR'::text,
  guide_included boolean DEFAULT true,
  guide_cost_per_day numeric,
  guide_cost_per_hour_local numeric,
  guide_extra_cost_per_hour_local numeric,
  guide_vat numeric,
  markup_percent numeric DEFAULT 0.00,
  coaches_required integer DEFAULT ceil(((used)::numeric / (coach_capacity)::numeric)),
  coach_cost_local numeric,
  guide_cost_local numeric,
  utilisation_percent numeric DEFAULT 100,
  utilisation_cost_per_seat_local numeric,
  coach_cost_gbp numeric,
  guide_cost_gbp numeric,
  utilisation_cost_per_seat_gbp numeric,
  sell_price_per_seat_gbp numeric,
  active boolean DEFAULT true,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT circuit_transfers_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.gpgt_hotels(id),
  CONSTRAINT circuit_transfers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.client_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  user_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type = ANY (ARRAY['email'::text, 'phone'::text, 'meeting'::text, 'quote_sent'::text, 'quote_accepted'::text, 'quote_declined'::text, 'follow_up'::text, 'note'::text])),
  subject text,
  content text,
  outcome text,
  next_action text,
  scheduled_follow_up timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.client_travel_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  quote_id uuid,
  destination text NOT NULL,
  start_date date,
  end_date date,
  trip_type text,
  total_spent numeric,
  currency text DEFAULT 'USD'::text,
  status text DEFAULT 'completed'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  company text,
  job_title text,
  date_of_birth date,
  passport_number text,
  nationality text,
  preferred_language text DEFAULT 'English'::text,
  address jsonb,
  preferences jsonb,
  notes text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'prospect'::text, 'vip'::text])),
  source text,
  tags ARRAY DEFAULT '{}'::text[],
  budget_preference jsonb,
  payment_preference text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_contact_at timestamp with time zone,
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.event_consultants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  consultant_id uuid NOT NULL,
  assigned_by uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  notes text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_consultants_pkey PRIMARY KEY (id),
  CONSTRAINT event_consultants_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_consultants_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.team_members(id),
  CONSTRAINT event_consultants_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sport_id uuid,
  name text NOT NULL,
  location text,
  start_date date,
  end_date date,
  venue_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  event_image jsonb,
  primary_consultant_id uuid,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_primary_consultant_id_fkey FOREIGN KEY (primary_consultant_id) REFERENCES public.team_members(id),
  CONSTRAINT events_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id),
  CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.flights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  outbound_flight_number text NOT NULL,
  outbound_departure_airport_code text NOT NULL,
  outbound_departure_airport_name text NOT NULL,
  outbound_arrival_airport_code text NOT NULL,
  outbound_arrival_airport_name text NOT NULL,
  outbound_departure_datetime timestamp without time zone NOT NULL,
  outbound_arrival_datetime timestamp without time zone NOT NULL,
  inbound_flight_number text,
  inbound_departure_airport_code text,
  inbound_departure_airport_name text,
  inbound_arrival_airport_code text,
  inbound_arrival_airport_name text,
  inbound_departure_datetime timestamp without time zone,
  inbound_arrival_datetime timestamp without time zone,
  airline text,
  cabin text,
  total_price_gbp numeric NOT NULL,
  currency text DEFAULT 'GBP'::text,
  refundable boolean DEFAULT false,
  baggage_allowance text,
  notes text,
  supplier text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  active boolean DEFAULT true,
  CONSTRAINT flights_pkey PRIMARY KEY (id),
  CONSTRAINT flights_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.gpgt_hotels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  star_rating integer,
  address text,
  city text,
  country text,
  latitude numeric,
  longitude numeric,
  description text,
  images jsonb,
  amenities jsonb,
  check_in_time time without time zone,
  check_out_time time without time zone,
  contact_email text,
  phone text,
  room_types jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT gpgt_hotels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hotel_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_type_id text NOT NULL,
  event_id uuid,
  check_in date NOT NULL,
  check_out date NOT NULL,
  quantity_total integer NOT NULL,
  quantity_reserved integer DEFAULT 0,
  supplier_price_per_night numeric,
  supplier_currency text DEFAULT 'EUR'::text,
  markup_percent numeric DEFAULT 0.00,
  vat_percentage numeric,
  resort_fee numeric,
  resort_fee_type text DEFAULT 'per_night'::text,
  city_tax numeric,
  city_tax_type text DEFAULT 'per_person_per_night'::text,
  breakfast_included boolean DEFAULT true,
  extra_night_markup_percent numeric,
  contracted boolean DEFAULT false,
  attrition_deadline date,
  release_allowed_percent numeric,
  penalty_terms text,
  supplier text,
  supplier_ref text,
  contract_file_path text,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  max_people integer,
  breakfast_price_per_person_per_night numeric,
  total_supplier_price_per_night numeric,
  total_price_per_night_gbp numeric,
  total_price_per_stay_gbp numeric,
  total_price_per_night_gbp_with_markup numeric DEFAULT (total_price_per_night_gbp + ((total_price_per_night_gbp * markup_percent) / (100)::numeric)),
  total_price_per_stay_gbp_with_markup numeric DEFAULT (total_price_per_stay_gbp + ((total_price_per_stay_gbp * markup_percent) / (100)::numeric)),
  extra_night_price_gbp numeric DEFAULT (total_price_per_night_gbp * ((1)::numeric + (extra_night_markup_percent / (100)::numeric))),
  is_provisional boolean NOT NULL DEFAULT false,
  quantity_available integer DEFAULT 
CASE
    WHEN is_provisional THEN 0
    ELSE (quantity_total - quantity_reserved)
END,
  bed_type text NOT NULL DEFAULT 'Double Room'::text CHECK (bed_type = ANY (ARRAY['Double Room'::text, 'Twin Room'::text, 'Triple Room'::text])),
  commission_percent numeric DEFAULT 0.00 CHECK (commission_percent >= 0::numeric),
  flexibility text NOT NULL DEFAULT 'Flex'::text CHECK (flexibility = ANY (ARRAY['Flex'::text, 'Non Flex'::text])),
  CONSTRAINT hotel_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT hotel_rooms_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT hotel_rooms_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.gpgt_hotels(id)
);
CREATE TABLE public.hubspot_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  hubspot_portal_id text NOT NULL,
  hubspot_account_name text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  sync_frequency text DEFAULT 'daily'::text CHECK (sync_frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL
);
CREATE TABLE public.hubspot_contact_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  client_id uuid NOT NULL,
  hubspot_contact_id text NOT NULL,
  last_synced_at timestamp with time zone DEFAULT now(),
  sync_status text DEFAULT 'synced'::text CHECK (sync_status = ANY (ARRAY['pending'::text, 'synced'::text, 'failed'::text, 'conflict'::text])),
  sync_error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.hubspot_deal_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  quote_id uuid NOT NULL,
  hubspot_deal_id text NOT NULL,
  last_synced_at timestamp with time zone DEFAULT now(),
  sync_status text DEFAULT 'synced'::text CHECK (sync_status = ANY (ARRAY['pending'::text, 'synced'::text, 'failed'::text, 'conflict'::text])),
  sync_error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.hubspot_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  sync_type text NOT NULL CHECK (sync_type = ANY (ARRAY['contacts'::text, 'deals'::text, 'companies'::text, 'full_sync'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['started'::text, 'completed'::text, 'failed'::text, 'partial'::text])),
  records_processed integer DEFAULT 0,
  records_synced integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.hubspot_sync_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  sync_contacts boolean DEFAULT true,
  sync_deals boolean DEFAULT true,
  sync_companies boolean DEFAULT false,
  sync_interactions boolean DEFAULT true,
  sync_travel_history boolean DEFAULT true,
  auto_create_contacts boolean DEFAULT true,
  auto_create_deals boolean DEFAULT true,
  sync_direction text DEFAULT 'bidirectional'::text CHECK (sync_direction = ANY (ARRAY['to_hubspot'::text, 'from_hubspot'::text, 'bidirectional'::text])),
  contact_mapping jsonb DEFAULT '{}'::jsonb,
  deal_mapping jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.lounge_passes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  variant text NOT NULL CHECK (variant = ANY (ARRAY['Airport Lounge Pass included (Departure only)'::text, 'Airport Lounge Pass included (Departure & Return)'::text])),
  cost numeric NOT NULL,
  markup numeric NOT NULL,
  sell_price numeric DEFAULT (cost + markup),
  currency text DEFAULT 'GBP'::text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT lounge_passes_pkey PRIMARY KEY (id),
  CONSTRAINT lounge_passes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.media_library (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text,
  tags ARRAY DEFAULT '{}'::text[],
  category text NOT NULL DEFAULT 'general'::text,
  location text,
  image_url text NOT NULL,
  thumbnail_url text,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  ai_generated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  team_id uuid,
  CONSTRAINT media_library_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.package_components (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tier_id uuid NOT NULL,
  event_id uuid NOT NULL,
  component_type text NOT NULL CHECK (component_type = ANY (ARRAY['ticket'::text, 'hotel_room'::text, 'circuit_transfer'::text, 'airport_transfer'::text, 'flight'::text])),
  component_id uuid NOT NULL,
  default_quantity integer DEFAULT 1,
  price_override numeric,
  notes text,
  CONSTRAINT package_components_pkey PRIMARY KEY (id),
  CONSTRAINT package_components_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.package_tiers(id),
  CONSTRAINT package_components_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.package_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  package_id uuid,
  name text NOT NULL,
  description text,
  price_override numeric,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  short_label text,
  display_order integer,
  CONSTRAINT package_tiers_pkey PRIMARY KEY (id),
  CONSTRAINT package_tiers_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id)
);
CREATE TABLE public.packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  base_type text CHECK (base_type = ANY (ARRAY['Grandstand'::text, 'VIP'::text])),
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  package_image jsonb,
  CONSTRAINT packages_pkey PRIMARY KEY (id),
  CONSTRAINT packages_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  team_id uuid,
  consultant_id uuid,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  client_address jsonb,
  event_id uuid,
  event_name character varying,
  event_location character varying,
  event_start_date date,
  event_end_date date,
  package_id uuid,
  package_name character varying,
  package_base_type character varying,
  tier_id uuid,
  tier_name character varying,
  tier_description text,
  tier_price_override numeric,
  travelers jsonb NOT NULL,
  travelers_adults integer DEFAULT 1,
  travelers_children integer DEFAULT 0,
  travelers_total integer DEFAULT 1,
  total_price numeric,
  currency text DEFAULT 'GBP'::text CHECK (currency = ANY (ARRAY['GBP'::text, 'USD'::text, 'EUR'::text, 'CAD'::text, 'AUD'::text, 'CHF'::text, 'JPY'::text, 'SGD'::text, 'HKD'::text, 'NZD'::text])),
  base_cost numeric,
  payment_deposit numeric DEFAULT 0,
  payment_second_payment numeric DEFAULT 0,
  payment_final_payment numeric DEFAULT 0,
  payment_deposit_date date,
  payment_second_payment_date date,
  payment_final_payment_date date,
  quote_number character varying UNIQUE,
  quote_reference character varying,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'accepted'::text, 'declined'::text, 'expired'::text, 'confirmed'::text, 'cancelled'::text])),
  version integer DEFAULT 1,
  is_revision boolean DEFAULT false,
  parent_quote_id uuid,
  selected_components jsonb,
  selected_package jsonb,
  selected_tier jsonb,
  price_breakdown jsonb,
  internal_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  sent_at timestamp with time zone,
  accepted_at timestamp with time zone,
  declined_at timestamp with time zone,
  expired_at timestamp with time zone,
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT quotes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT quotes_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT quotes_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.package_tiers(id),
  CONSTRAINT quotes_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id),
  CONSTRAINT quotes_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.team_members(id),
  CONSTRAINT quotes_parent_quote_id_fkey FOREIGN KEY (parent_quote_id) REFERENCES public.quotes(id)
);
CREATE TABLE public.quotes_backup (
  id uuid,
  user_id uuid,
  client_name text,
  destination text,
  start_date date,
  end_date date,
  travelers jsonb,
  preferences jsonb,
  inventory_options jsonb,
  agent_margin numeric,
  generated_itinerary jsonb,
  total_price numeric,
  currency text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  trip_details jsonb,
  include_inventory jsonb,
  filters jsonb,
  agent_context jsonb,
  base_cost numeric,
  margin numeric,
  budget jsonb,
  client_email text,
  client_phone text,
  client_address jsonb,
  selected_event jsonb,
  selected_ticket jsonb,
  client_id uuid,
  selected_flights jsonb,
  selected_hotels jsonb,
  team_id uuid,
  selected_components jsonb,
  selected_package jsonb,
  selected_tier jsonb,
  price_breakdown jsonb,
  summary jsonb,
  quote_number character varying,
  expires_at timestamp with time zone,
  consultant_id uuid,
  client_first_name character varying,
  client_last_name character varying,
  travelers_adults integer,
  travelers_children integer,
  travelers_total integer,
  event_id uuid,
  event_name character varying,
  event_location character varying,
  event_start_date date,
  event_end_date date,
  package_id uuid,
  package_name character varying,
  package_base_type character varying,
  tier_id uuid,
  tier_name character varying,
  tier_description text,
  tier_price_override numeric,
  payment_deposit numeric,
  payment_second_payment numeric,
  payment_final_payment numeric,
  payment_deposit_date date,
  payment_second_payment_date date,
  payment_final_payment_date date,
  internal_notes text,
  quote_reference character varying,
  sent_at timestamp with time zone,
  accepted_at timestamp with time zone,
  declined_at timestamp with time zone,
  expired_at timestamp with time zone,
  version integer,
  parent_quote_id uuid,
  is_revision boolean
);
CREATE TABLE public.sports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT sports_pkey PRIMARY KEY (id)
);
CREATE TABLE public.team_features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  feature_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_features_pkey PRIMARY KEY (id),
  CONSTRAINT team_features_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text, 'sales'::text, 'operations'::text])),
  invited_by uuid NOT NULL,
  token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  team_id uuid,
  CONSTRAINT team_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT team_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id),
  CONSTRAINT team_invitations_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  name text,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text, 'sales'::text, 'operations'::text])),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'invited'::text, 'inactive'::text])),
  invited_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  invited_by uuid,
  invitation_token text,
  invitation_expires_at timestamp with time zone,
  team_id uuid,
  phone text,
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id),
  CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  max_members integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  logo_url text,
  agency_name text,
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.ticket_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  venue_id text,
  sport_type text,
  category_type text,
  description jsonb,
  options jsonb,
  ticket_delivery_days integer,
  media_files jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT ticket_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  ticket_category_id uuid,
  quantity_total integer NOT NULL CHECK (quantity_total >= 0),
  quantity_reserved integer NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  price numeric NOT NULL CHECK (price >= 0::numeric),
  markup_percent numeric DEFAULT 0.00 CHECK (markup_percent >= 0::numeric),
  price_with_markup numeric DEFAULT (price + ((price * markup_percent) / (100)::numeric)),
  currency text NOT NULL DEFAULT 'EUR'::text,
  ticket_type text,
  refundable boolean DEFAULT false,
  resellable boolean DEFAULT false,
  supplier text,
  supplier_ref text,
  ordered boolean DEFAULT false,
  ordered_at timestamp without time zone,
  paid boolean DEFAULT false,
  paid_at timestamp without time zone,
  tickets_received boolean DEFAULT false,
  tickets_received_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  metadata jsonb,
  supplier_currency text DEFAULT 'EUR'::text,
  supplier_price numeric,
  price_gbp numeric DEFAULT (supplier_price + ((supplier_price * markup_percent) / (100)::numeric)),
  ticket_days text CHECK (ticket_days = ANY (ARRAY['Monday'::text, 'Tuesday'::text, 'Wednesday'::text, 'Thursday'::text, 'Friday'::text, 'Saturday'::text, 'Sunday'::text, 'Friday-Saturday'::text, 'Saturday-Sunday'::text, 'Friday-Sunday'::text, 'Thursday-Sunday'::text])),
  active boolean DEFAULT true,
  is_provisional boolean NOT NULL DEFAULT false,
  quantity_available integer DEFAULT 
CASE
    WHEN is_provisional THEN 0
    ELSE (quantity_total - quantity_reserved)
END,
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_ticket_category_id_fkey FOREIGN KEY (ticket_category_id) REFERENCES public.ticket_categories(id),
  CONSTRAINT tickets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  agency_name text,
  logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  country text,
  city text,
  timezone text,
  latitude numeric,
  longitude numeric,
  description text,
  images jsonb,
  map_url text,
  website text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT venues_pkey PRIMARY KEY (id)
);