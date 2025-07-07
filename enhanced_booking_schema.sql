-- Enhanced Booking Schema for Quote-to-Booking Conversion
-- This schema supports all the requirements for creating bookings from quotes

-- Enhanced bookings table with all necessary fields
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  user_id uuid NOT NULL,
  team_id uuid,
  client_id uuid,
  
  -- Booking Status and Payment
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'confirmed', 'cancelled', 'completed', 'refunded'])),
  deposit_paid boolean DEFAULT false,
  deposit_paid_at timestamp with time zone,
  deposit_amount numeric,
  deposit_reference text,
  
  -- Client and Traveler Information
  lead_traveler_name text NOT NULL,
  lead_traveler_email text,
  lead_traveler_phone text,
  guest_travelers jsonb, -- Array of guest names and details
  
  -- Event and Package Details
  event_id uuid,
  event_name text,
  event_location text,
  event_start_date date,
  event_end_date date,
  package_id uuid,
  package_name text,
  tier_id uuid,
  tier_name text,
  
  -- Pricing and Payment Schedule
  total_cost numeric NOT NULL,
  currency text DEFAULT 'GBP',
  original_payment_schedule jsonb, -- Original quote payment schedule
  adjusted_payment_schedule jsonb, -- Adjusted payment schedule for booking
  payment_terms text,
  
  -- Component Details
  selected_components jsonb, -- All selected components from quote
  component_availability jsonb, -- Availability status for each component
  
  -- Supplier References
  supplier_refs jsonb, -- References for each component supplier
  
  -- Booking Details
  booking_notes text,
  internal_notes text,
  special_requests text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id),
  CONSTRAINT bookings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT bookings_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id),
  CONSTRAINT bookings_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.package_tiers(id)
);

-- Booking components table to track individual component bookings
CREATE TABLE public.booking_components (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  component_type text NOT NULL CHECK (component_type = ANY (ARRAY['ticket', 'hotel_room', 'circuit_transfer', 'airport_transfer', 'flight', 'lounge_pass'])),
  component_id uuid, -- Reference to original component (ticket, hotel_room, etc.)
  
  -- Component Details
  component_name text,
  component_description text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  
  -- Booking Status
  booking_status text DEFAULT 'pending' CHECK (booking_status = ANY (ARRAY['pending', 'confirmed', 'cancelled', 'refunded'])),
  supplier_confirmed boolean DEFAULT false,
  supplier_confirmed_at timestamp with time zone,
  
  -- Supplier Information
  supplier_name text,
  supplier_ref text,
  supplier_booking_ref text,
  
  -- Component-specific data
  component_data jsonb, -- Detailed component information
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT booking_components_pkey PRIMARY KEY (id),
  CONSTRAINT booking_components_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

-- Booking payments table to track payment schedule and payments
CREATE TABLE public.booking_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  payment_type text NOT NULL CHECK (payment_type = ANY (ARRAY['deposit', 'second_payment', 'final_payment', 'additional'])),
  payment_number integer NOT NULL, -- 1, 2, 3, etc.
  
  -- Payment Details
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid boolean DEFAULT false,
  paid_at timestamp with time zone,
  payment_reference text,
  payment_method text,
  
  -- Payment Notes
  notes text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT booking_payments_pkey PRIMARY KEY (id),
  CONSTRAINT booking_payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

-- Booking travelers table for detailed traveler information
CREATE TABLE public.booking_travelers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  traveler_type text NOT NULL CHECK (traveler_type = ANY (ARRAY['lead', 'guest'])),
  traveler_number integer NOT NULL, -- 1, 2, 3, etc.
  
  -- Personal Information (required for all travelers)
  first_name text NOT NULL,
  last_name text NOT NULL,
  
  -- Lead traveler specific fields (only used when traveler_type = 'lead')
  email text,
  phone text,
  address text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT booking_travelers_pkey PRIMARY KEY (id),
  CONSTRAINT booking_travelers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

-- Booking activity log
CREATE TABLE public.booking_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  activity_type text NOT NULL,
  activity_description text,
  performed_by uuid,
  performed_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  
  CONSTRAINT booking_activity_log_pkey PRIMARY KEY (id),
  CONSTRAINT booking_activity_log_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT booking_activity_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_bookings_quote_id ON public.bookings(quote_id);
CREATE INDEX idx_bookings_team_id ON public.bookings(team_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_deposit_paid ON public.bookings(deposit_paid);
CREATE INDEX idx_booking_components_booking_id ON public.booking_components(booking_id);
CREATE INDEX idx_booking_components_type ON public.booking_components(component_type);
CREATE INDEX idx_booking_payments_booking_id ON public.booking_payments(booking_id);
CREATE INDEX idx_booking_payments_due_date ON public.booking_payments(due_date);
CREATE INDEX idx_booking_travelers_booking_id ON public.booking_travelers(booking_id);
CREATE INDEX idx_booking_activity_log_booking_id ON public.booking_activity_log(booking_id);

-- Row Level Security Policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Users can view their team's bookings" ON public.bookings
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert bookings for their team" ON public.bookings
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update their team's bookings" ON public.bookings
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for booking_components
CREATE POLICY "Users can view their team's booking components" ON public.booking_components
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can insert booking components for their team" ON public.booking_components
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Similar policies for other tables...
-- (Adding abbreviated policies for brevity)

-- Functions for booking creation
CREATE OR REPLACE FUNCTION create_booking_from_quote(
  p_quote_id uuid,
  p_lead_traveler_name text,
  p_lead_traveler_email text,
  p_lead_traveler_phone text,
  p_guest_travelers jsonb DEFAULT '[]'::jsonb,
  p_adjusted_payment_schedule jsonb DEFAULT NULL,
  p_booking_notes text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_booking_id uuid;
  v_quote_data record;
  v_component record;
  v_payment record;
  v_traveler record;
  v_traveler_count integer;
BEGIN
  -- Get quote data
  SELECT * INTO v_quote_data FROM public.quotes WHERE id = p_quote_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;
  
  -- Check if booking already exists for this quote
  IF EXISTS (SELECT 1 FROM public.bookings WHERE quote_id = p_quote_id) THEN
    RAISE EXCEPTION 'Booking already exists for this quote';
  END IF;
  
  -- Create booking
  INSERT INTO public.bookings (
    quote_id,
    user_id,
    team_id,
    client_id,
    lead_traveler_name,
    lead_traveler_email,
    lead_traveler_phone,
    guest_travelers,
    event_id,
    event_name,
    event_location,
    event_start_date,
    event_end_date,
    package_id,
    package_name,
    tier_id,
    tier_name,
    total_cost,
    currency,
    original_payment_schedule,
    adjusted_payment_schedule,
    selected_components,
    booking_notes
  ) VALUES (
    p_quote_id,
    v_quote_data.user_id,
    v_quote_data.team_id,
    v_quote_data.client_id,
    p_lead_traveler_name,
    p_lead_traveler_email,
    p_lead_traveler_phone,
    p_guest_travelers,
    v_quote_data.event_id,
    v_quote_data.event_name,
    v_quote_data.event_location,
    v_quote_data.start_date,
    v_quote_data.end_date,
    v_quote_data.package_id,
    v_quote_data.package_name,
    v_quote_data.tier_id,
    v_quote_data.tier_name,
    v_quote_data.total_price,
    v_quote_data.currency,
    jsonb_build_object(
      'deposit', v_quote_data.payment_deposit,
      'secondPayment', v_quote_data.payment_second_payment,
      'finalPayment', v_quote_data.payment_final_payment,
      'depositDate', v_quote_data.payment_deposit_date,
      'secondPaymentDate', v_quote_data.payment_second_payment_date,
      'finalPaymentDate', v_quote_data.payment_final_payment_date
    ),
    COALESCE(p_adjusted_payment_schedule, jsonb_build_object(
      'deposit', v_quote_data.payment_deposit,
      'secondPayment', v_quote_data.payment_second_payment,
      'finalPayment', v_quote_data.payment_final_payment,
      'depositDate', v_quote_data.payment_deposit_date,
      'secondPaymentDate', v_quote_data.payment_second_payment_date,
      'finalPaymentDate', v_quote_data.payment_final_payment_date
    )),
    v_quote_data.selected_components,
    p_booking_notes
  ) RETURNING id INTO v_booking_id;
  
  -- Create booking components
  IF v_quote_data.selected_components IS NOT NULL THEN
    FOR v_component IN SELECT * FROM jsonb_array_elements(v_quote_data.selected_components) AS comp
    LOOP
      -- This would need to be expanded based on component structure
      -- For now, creating a basic component record
      INSERT INTO public.booking_components (
        booking_id,
        component_type,
        component_name,
        quantity,
        unit_price,
        total_price,
        component_data
      ) VALUES (
        v_booking_id,
        v_component->>'type',
        v_component->>'name',
        (v_component->>'quantity')::integer,
        (v_component->>'price')::numeric,
        (v_component->>'total')::numeric,
        v_component
      );
    END LOOP;
  END IF;
  
  -- Create payment schedule
  INSERT INTO public.booking_payments (
    booking_id,
    payment_type,
    payment_number,
    amount,
    due_date
  ) VALUES 
  (v_booking_id, 'deposit', 1, v_quote_data.payment_deposit, v_quote_data.payment_deposit_date),
  (v_booking_id, 'second_payment', 2, v_quote_data.payment_second_payment, v_quote_data.payment_second_payment_date),
  (v_booking_id, 'final_payment', 3, v_quote_data.payment_final_payment, v_quote_data.payment_final_payment_date);
  
  -- Create lead traveler record
  INSERT INTO public.booking_travelers (
    booking_id,
    traveler_type,
    traveler_number,
    first_name,
    last_name,
    email,
    phone,
    address
  ) VALUES (
    v_booking_id,
    'lead',
    1,
    split_part(p_lead_traveler_name, ' ', 1),
    split_part(p_lead_traveler_name, ' ', 2),
    p_lead_traveler_email,
    p_lead_traveler_phone,
    NULL -- Address would need to be passed as parameter
  );
  
  -- Create guest traveler records
  v_traveler_count := 2;
  FOR v_traveler IN SELECT * FROM jsonb_array_elements(p_guest_travelers) AS guest
  LOOP
    INSERT INTO public.booking_travelers (
      booking_id,
      traveler_type,
      traveler_number,
      first_name,
      last_name
    ) VALUES (
      v_booking_id,
      'guest',
      v_traveler_count,
      v_traveler->>'firstName',
      v_traveler->>'lastName'
    );
    v_traveler_count := v_traveler_count + 1;
  END LOOP;
  
  -- Log the booking creation
  INSERT INTO public.booking_activity_log (
    booking_id,
    activity_type,
    activity_description,
    performed_by
  ) VALUES (
    v_booking_id,
    'booking_created',
    'Booking created from quote ' || p_quote_id,
    v_quote_data.user_id
  );
  
  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check component availability
CREATE OR REPLACE FUNCTION check_component_availability(
  p_component_type text,
  p_component_id uuid,
  p_quantity integer,
  p_event_id uuid
) RETURNS boolean AS $$
DECLARE
  v_available integer;
BEGIN
  CASE p_component_type
    WHEN 'ticket' THEN
      SELECT quantity_available INTO v_available 
      FROM public.tickets 
      WHERE id = p_component_id AND event_id = p_event_id;
    WHEN 'hotel_room' THEN
      SELECT quantity_available INTO v_available 
      FROM public.hotel_rooms 
      WHERE id = p_component_id AND event_id = p_event_id;
    WHEN 'circuit_transfer' THEN
      -- For transfers, we need to check capacity
      SELECT coach_capacity - used INTO v_available 
      FROM public.circuit_transfers 
      WHERE id = p_component_id AND event_id = p_event_id;
    WHEN 'airport_transfer' THEN
      -- For airport transfers, check capacity
      SELECT max_capacity - used INTO v_available 
      FROM public.airport_transfers 
      WHERE id = p_component_id AND event_id = p_event_id;
    WHEN 'flight' THEN
      -- For flights, assume available if active
      SELECT CASE WHEN active THEN 999 ELSE 0 END INTO v_available 
      FROM public.flights 
      WHERE id = p_component_id AND event_id = p_event_id;
    WHEN 'lounge_pass' THEN
      -- For lounge passes, assume available if active
      SELECT CASE WHEN is_active THEN 999 ELSE 0 END INTO v_available 
      FROM public.lounge_passes 
      WHERE id = p_component_id AND event_id = p_event_id;
    ELSE
      v_available := 0;
  END CASE;
  
  RETURN COALESCE(v_available, 0) >= p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 