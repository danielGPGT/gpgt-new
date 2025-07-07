-- Clean Quotes Table Schema
-- This replaces the existing quotes table with a simplified, optimized structure

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.quotes CASCADE;

-- Create the clean quotes table
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NULL,
  team_id uuid NULL,
  consultant_id uuid NULL,
  
  -- Client Information
  client_name text NOT NULL,
  client_email text NULL,
  client_phone text NULL,
  client_address jsonb NULL,
  
  -- Event Information
  event_id uuid NULL,
  event_name character varying(255) NULL,
  event_location character varying(255) NULL,
  event_start_date date NULL,
  event_end_date date NULL,
  
  -- Package Information
  package_id uuid NULL,
  package_name character varying(255) NULL,
  package_base_type character varying(50) NULL,
  tier_id uuid NULL,
  tier_name character varying(255) NULL,
  tier_description text NULL,
  tier_price_override numeric(10, 2) NULL,
  
  -- Travel Information
  travelers jsonb NOT NULL,
  travelers_adults integer NULL DEFAULT 1,
  travelers_children integer NULL DEFAULT 0,
  travelers_total integer NULL DEFAULT 1,
  
  -- Pricing Information
  total_price numeric(10, 2) NULL,
  currency text NULL DEFAULT 'GBP'::text,
  base_cost numeric(10, 2) NULL,
  margin numeric(10, 2) NULL,
  agent_margin numeric(10, 2) NULL DEFAULT 0.15,
  
  -- Payment Schedule
  payment_deposit numeric(10, 2) NULL DEFAULT 0,
  payment_second_payment numeric(10, 2) NULL DEFAULT 0,
  payment_final_payment numeric(10, 2) NULL DEFAULT 0,
  payment_deposit_date date NULL,
  payment_second_payment_date date NULL,
  payment_final_payment_date date NULL,
  
  -- Quote Details
  quote_number character varying(50) NULL,
  quote_reference character varying(100) NULL,
  status text NULL DEFAULT 'draft'::text,
  version integer NULL DEFAULT 1,
  is_revision boolean NULL DEFAULT false,
  parent_quote_id uuid NULL,
  
  -- Component Data
  selected_components jsonb NULL,
  selected_package jsonb NULL,
  selected_tier jsonb NULL,
  price_breakdown jsonb NULL,
  
  -- Additional Data
  preferences jsonb NULL,
  internal_notes text NULL,
  generated_itinerary jsonb NULL,
  
  -- Timestamps
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  expires_at timestamp with time zone NULL,
  sent_at timestamp with time zone NULL,
  accepted_at timestamp with time zone NULL,
  declined_at timestamp with time zone NULL,
  expired_at timestamp with time zone NULL,
  
  -- Constraints
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_quote_number_key UNIQUE (quote_number),
  CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL,
  CONSTRAINT quotes_parent_quote_id_fkey FOREIGN KEY (parent_quote_id) REFERENCES quotes (id),
  CONSTRAINT quotes_event_id_fkey FOREIGN KEY (event_id) REFERENCES events (id),
  CONSTRAINT quotes_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL,
  CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id),
  CONSTRAINT quotes_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES package_tiers (id),
  CONSTRAINT quotes_package_id_fkey FOREIGN KEY (package_id) REFERENCES packages (id),
  CONSTRAINT quotes_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES team_members (id) ON DELETE SET NULL,
  
  -- Data Validation Constraints
  CONSTRAINT valid_travelers CHECK (
    (travelers_total = (travelers_adults + travelers_children))
  ),
  CONSTRAINT quotes_status_check CHECK (
    (status = ANY (
      ARRAY[
        'draft'::text,
        'sent'::text,
        'accepted'::text,
        'declined'::text,
        'expired'::text,
        'confirmed'::text,
        'cancelled'::text
      ]
    ))
  ),
  CONSTRAINT valid_payment_schedule CHECK (
    ((payment_deposit + payment_second_payment + payment_final_payment) = total_price)
  ),
  CONSTRAINT valid_currency CHECK (
    (currency = ANY (
      ARRAY[
        'GBP'::text,
        'USD'::text,
        'EUR'::text,
        'CAD'::text,
        'AUD'::text,
        'CHF'::text,
        'JPY'::text,
        'SGD'::text,
        'HKD'::text,
        'NZD'::text
      ]
    ))
  )
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes USING btree (client_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_team_id ON public.quotes USING btree (team_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON public.quotes USING btree (client_email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_event_id ON public.quotes USING btree (event_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_consultant_id ON public.quotes USING btree (consultant_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes USING btree (quote_number) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_currency ON public.quotes USING btree (currency) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes USING btree (user_id) TABLESPACE pg_default;

-- Create trigger for quote number generation (if the function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_quote_number') THEN
    CREATE TRIGGER trigger_generate_quote_number 
    BEFORE INSERT ON quotes 
    FOR EACH ROW 
    WHEN (new.quote_number IS NULL)
    EXECUTE FUNCTION generate_quote_number();
  END IF;
END $$;

-- Create trigger for updated_at column (if the function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER trigger_update_quotes_updated_at 
    BEFORE UPDATE ON quotes 
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add RLS policies
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Policy for team members to see their team's quotes
CREATE POLICY "Team members can view team quotes" ON public.quotes
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy for team members to insert quotes for their team
CREATE POLICY "Team members can insert team quotes" ON public.quotes
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy for team members to update their team's quotes
CREATE POLICY "Team members can update team quotes" ON public.quotes
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy for team members to delete their team's quotes
CREATE POLICY "Team members can delete team quotes" ON public.quotes
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Grant permissions
GRANT ALL ON public.quotes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Migration script to clean up existing data (run carefully!)
-- This script helps migrate from the old schema to the new one

/*
-- Migration script (uncomment and run carefully in production)
DO $$
DECLARE
    quote_record RECORD;
BEGIN
    -- Update existing quotes to use the new structure
    FOR quote_record IN SELECT * FROM public.quotes WHERE client_id IS NULL LOOP
        -- Try to find or create a client record
        INSERT INTO public.clients (
            user_id,
            first_name,
            last_name,
            email,
            phone,
            status
        ) VALUES (
            quote_record.user_id,
            COALESCE(quote_record.client_first_name, split_part(quote_record.client_name, ' ', 1)),
            COALESCE(quote_record.client_last_name, split_part(quote_record.client_name, ' ', 2)),
            quote_record.client_email,
            quote_record.client_phone,
            'active'
        ) ON CONFLICT (email, user_id) DO NOTHING
        RETURNING id INTO quote_record.client_id;
        
        -- Update the quote with the client_id
        UPDATE public.quotes 
        SET client_id = (
            SELECT id FROM public.clients 
            WHERE email = quote_record.client_email 
            AND user_id = quote_record.user_id
        )
        WHERE id = quote_record.id;
    END LOOP;
END $$;
*/ 