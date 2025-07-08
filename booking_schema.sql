-- Robust Travel Booking System Schema for Quote-to-Booking Conversion (with improvements)
-- All columns and tables use snake_case

-- 1. bookings (master booking record)
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL, -- e.g., HUN-F1-2026-0001 (enforce format via trigger if needed)
  quote_id uuid REFERENCES public.quotes(id),
  parent_quote_id uuid REFERENCES public.quotes(id), -- for quote revision traceability
  quote_version integer, -- for quote revision traceability
  event_id uuid REFERENCES public.events(id),
  client_id uuid REFERENCES public.clients(id),
  lead_traveler_id uuid NOT NULL REFERENCES public.booking_travelers(id), -- should match client_id unless overridden
  consultant_id uuid REFERENCES public.team_members(id),
  user_id uuid REFERENCES auth.users(id),
  team_id uuid REFERENCES public.teams(id),
  status text NOT NULL CHECK (status IN ('draft', 'provisional', 'pending_payment', 'confirmed', 'cancelled', 'completed', 'refunded')),
  total_price numeric(10,2) NOT NULL,
  currency text DEFAULT 'GBP',
  payment_schedule_snapshot jsonb, -- stores original payment schedule from quote
  package_snapshot jsonb, -- stores all package details as they were at booking time
  provisional_expires_at timestamptz, -- when provisional hold expires
  provisional_reason text, -- reason for provisional status
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- for soft deletes
);
CREATE INDEX idx_bookings_quote_id ON public.bookings(quote_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_team_id ON public.bookings(team_id);
CREATE INDEX idx_bookings_team_status ON public.bookings(team_id, status);
CREATE INDEX idx_bookings_event_status ON public.bookings(event_id, status);
CREATE INDEX idx_bookings_provisional_expires_at ON public.bookings(provisional_expires_at);

-- 2. booking_travelers
CREATE TABLE public.booking_travelers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  traveler_type text NOT NULL CHECK (traveler_type IN ('lead', 'guest')),
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- for soft deletes
);
CREATE INDEX idx_booking_travelers_booking_id ON public.booking_travelers(booking_id);

-- 3. bookings_flights
CREATE TABLE public.bookings_flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  source_flight_id uuid REFERENCES public.flights(id), -- optional if internal
  api_source text, -- e.g., 'Amadeus', 'Direct Supplier'
  ticketing_deadline date,
  booking_pnr text,
  flight_status text CHECK (flight_status IN ('Booked - Ticketed - Paid', 'Booked - Ticketed - Not Paid', 'Booked - Not Ticketed')),
  flight_details jsonb NOT NULL, -- stores outbound/inbound/layovers/etc.
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  currency text DEFAULT 'GBP',
  refundable boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- for soft deletes
);
CREATE INDEX idx_bookings_flights_booking_id ON public.bookings_flights(booking_id);

-- 4. bookings_lounge_passes
CREATE TABLE public.bookings_lounge_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  lounge_pass_id uuid REFERENCES public.lounge_passes(id),
  booking_reference text, -- supplier booking ref
  quantity integer,
  unit_price numeric(10,2),
  total_price numeric(10,2),
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- for soft deletes
);
CREATE INDEX idx_bookings_lounge_passes_booking_id ON public.bookings_lounge_passes(booking_id);

-- 5. booking_components (generic for tickets, hotels, transfers, etc.)
CREATE TABLE public.booking_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  component_type text NOT NULL CHECK (component_type IN ('ticket', 'hotel_room', 'circuit_transfer', 'airport_transfer', 'flight', 'lounge_pass')),
  component_id uuid, -- references the original inventory item
  component_name text,
  quantity integer,
  unit_price numeric(10,2),
  total_price numeric(10,2),
  component_data jsonb, -- extra supplier-specific data
  component_snapshot jsonb, -- full state of the component at booking time
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- for soft deletes
);
CREATE INDEX idx_booking_components_booking_id ON public.booking_components(booking_id);
CREATE INDEX idx_booking_components_component_type ON public.booking_components(component_type);

-- 6. booking_payments
CREATE TABLE public.booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('deposit', 'second_payment', 'final_payment', 'additional')),
  payment_number integer NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'GBP',
  due_date date,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  payment_reference text, -- e.g., Stripe payment intent
  payment_method text, -- e.g., card, bank_transfer
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- for soft deletes
);
CREATE INDEX idx_booking_payments_booking_id ON public.booking_payments(booking_id);
CREATE INDEX idx_booking_payments_status_due_date ON public.booking_payments(paid, due_date);

-- Optional: booking_activity_logs, booking_supplier_invoices, refunds, etc. can be added as needed. 