-- Migration script to clean up the existing quotes table
-- This script removes unused columns and ensures proper client_id relationships

-- Step 1: Add client_id column if it doesn't exist
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Step 2: Create client records for existing quotes that don't have client_id
DO $$
DECLARE
    quote_record RECORD;
    new_client_id uuid;
BEGIN
    -- Process quotes that don't have a client_id but have client information
    FOR quote_record IN 
        SELECT id, user_id, client_name, client_email, client_phone, client_first_name, client_last_name
        FROM public.quotes 
        WHERE client_id IS NULL 
        AND client_email IS NOT NULL
    LOOP
        -- Try to find existing client first
        SELECT id INTO new_client_id 
        FROM public.clients 
        WHERE email = quote_record.client_email 
        AND user_id = quote_record.user_id;
        
        -- If client doesn't exist, create one
        IF new_client_id IS NULL THEN
            INSERT INTO public.clients (
                user_id,
                first_name,
                last_name,
                email,
                phone,
                status,
                created_at
            ) VALUES (
                quote_record.user_id,
                COALESCE(quote_record.client_first_name, split_part(quote_record.client_name, ' ', 1), ''),
                COALESCE(quote_record.client_last_name, 
                    CASE 
                        WHEN quote_record.client_first_name IS NOT NULL 
                        THEN split_part(quote_record.client_name, ' ', 2)
                        ELSE split_part(quote_record.client_name, ' ', 2)
                    END, ''),
                quote_record.client_email,
                quote_record.client_phone,
                'active',
                NOW()
            ) RETURNING id INTO new_client_id;
        END IF;
        
        -- Update the quote with the client_id
        UPDATE public.quotes 
        SET client_id = new_client_id
        WHERE id = quote_record.id;
    END LOOP;
END $$;

-- Step 3: Remove unused columns that are redundant or not used
-- These columns are either stored in JSONB fields or are redundant

-- Remove redundant client name columns (we have client_name and client_id)
ALTER TABLE public.quotes DROP COLUMN IF EXISTS client_first_name;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS client_last_name;

-- Remove redundant destination/date columns (we have event_location and event dates)
ALTER TABLE public.quotes DROP COLUMN IF EXISTS destination;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS start_date;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS end_date;

-- Remove old JSONB fields that are now stored in selected_components
ALTER TABLE public.quotes DROP COLUMN IF EXISTS travelers;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS preferences;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS inventory_options;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS generated_itinerary;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS trip_details;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS include_inventory;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS filters;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS agent_context;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS budget;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS client_address;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS selected_event;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS selected_ticket;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS selected_flights;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS selected_hotels;

-- Remove unused pricing fields (we have the new payment fields)
ALTER TABLE public.quotes DROP COLUMN IF EXISTS base_cost;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS margin;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS agent_margin;

-- Remove unused summary field (data is in other fields)
ALTER TABLE public.quotes DROP COLUMN IF EXISTS summary;

-- Step 4: Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_package_id ON public.quotes(package_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tier_id ON public.quotes(tier_id);

-- Step 5: Update constraints to match the clean schema
-- Drop old constraints that reference removed columns
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS valid_travelers;
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS valid_payment_schedule;

-- Add new constraints
ALTER TABLE public.quotes 
ADD CONSTRAINT valid_travelers CHECK (travelers_total = (travelers_adults + travelers_children));

ALTER TABLE public.quotes 
ADD CONSTRAINT valid_payment_schedule CHECK (
  (payment_deposit + payment_second_payment + payment_final_payment) = total_price
);

-- Step 6: Update status constraint to include all valid statuses
ALTER TABLE public.quotes 
DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_status_check CHECK (
  status = ANY (ARRAY['draft', 'sent', 'accepted', 'declined', 'expired', 'confirmed', 'cancelled'])
);

-- Step 7: Ensure all quotes have proper quote numbers
UPDATE public.quotes 
SET quote_number = 'Q-' || EXTRACT(YEAR FROM created_at) || '-' || LPAD(id::text, 6, '0')
WHERE quote_number IS NULL;

-- Step 8: Set proper expiration dates for quotes that don't have them
UPDATE public.quotes 
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL AND status = 'draft';

-- Step 9: Clean up any orphaned data
-- Remove quotes that don't have essential data
DELETE FROM public.quotes 
WHERE client_name IS NULL 
   OR client_email IS NULL 
   OR total_price IS NULL;

-- Step 10: Verify the migration
-- This query should return 0 if everything is clean
SELECT COUNT(*) as quotes_without_client_id
FROM public.quotes 
WHERE client_id IS NULL;

-- This query should return 0 if all quotes have proper payment schedules
SELECT COUNT(*) as quotes_with_invalid_payments
FROM public.quotes 
WHERE (payment_deposit + payment_second_payment + payment_final_payment) != total_price;

-- This query should return 0 if all quotes have proper traveler counts
SELECT COUNT(*) as quotes_with_invalid_travelers
FROM public.quotes 
WHERE travelers_total != (travelers_adults + travelers_children);

-- Migration Script: Old Quotes Table to New Clean Schema
-- Run this AFTER creating the new clean_quotes_table.sql

-- Step 1: Backup existing data (optional but recommended)
CREATE TABLE quotes_backup AS SELECT * FROM quotes;

-- Step 2: Create temporary table with new structure
CREATE TABLE quotes_new (
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
  expired_at timestamp with time zone NULL
);

-- Step 3: Migrate data from old table to new table
INSERT INTO quotes_new (
  id,
  user_id,
  client_id,
  team_id,
  consultant_id,
  client_name,
  client_email,
  client_phone,
  client_address,
  event_id,
  event_name,
  event_location,
  event_start_date,
  event_end_date,
  package_id,
  package_name,
  package_base_type,
  tier_id,
  tier_name,
  tier_description,
  tier_price_override,
  travelers,
  travelers_adults,
  travelers_children,
  travelers_total,
  total_price,
  currency,
  base_cost,
  margin,
  agent_margin,
  payment_deposit,
  payment_second_payment,
  payment_final_payment,
  payment_deposit_date,
  payment_second_payment_date,
  payment_final_payment_date,
  quote_number,
  quote_reference,
  status,
  version,
  is_revision,
  parent_quote_id,
  selected_components,
  selected_package,
  selected_tier,
  price_breakdown,
  preferences,
  internal_notes,
  generated_itinerary,
  created_at,
  updated_at,
  expires_at,
  sent_at,
  accepted_at,
  declined_at,
  expired_at
)
SELECT 
  id,
  user_id,
  client_id,
  team_id,
  consultant_id,
  client_name,
  client_email,
  client_phone,
  client_address,
  event_id,
  event_name,
  event_location,
  event_start_date,
  event_end_date,
  package_id,
  package_name,
  package_base_type,
  tier_id,
  tier_name,
  tier_description,
  tier_price_override,
  -- Create travelers jsonb from individual fields
  jsonb_build_object(
    'adults', COALESCE(travelers_adults, 1),
    'children', COALESCE(travelers_children, 0),
    'total', COALESCE(travelers_total, 1)
  ) as travelers,
  travelers_adults,
  travelers_children,
  travelers_total,
  total_price,
  COALESCE(currency, 'GBP') as currency,
  base_cost,
  margin,
  agent_margin,
  payment_deposit,
  payment_second_payment,
  payment_final_payment,
  payment_deposit_date,
  payment_second_payment_date,
  payment_final_payment_date,
  quote_number,
  quote_reference,
  status,
  version,
  is_revision,
  parent_quote_id,
  selected_components,
  selected_package,
  selected_tier,
  price_breakdown,
  preferences,
  internal_notes,
  generated_itinerary,
  created_at,
  updated_at,
  expires_at,
  sent_at,
  accepted_at,
  declined_at,
  expired_at
FROM quotes;

-- Step 4: Drop old table and rename new table
DROP TABLE quotes;
ALTER TABLE quotes_new RENAME TO quotes;

-- Step 5: Add constraints and indexes (from clean_quotes_table.sql)
ALTER TABLE quotes ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_quote_number_key UNIQUE (quote_number);
ALTER TABLE quotes ADD CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL;
ALTER TABLE quotes ADD CONSTRAINT quotes_parent_quote_id_fkey FOREIGN KEY (parent_quote_id) REFERENCES quotes (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_event_id_fkey FOREIGN KEY (event_id) REFERENCES events (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL;
ALTER TABLE quotes ADD CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES package_tiers (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_package_id_fkey FOREIGN KEY (package_id) REFERENCES packages (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES team_members (id) ON DELETE SET NULL;

-- Add validation constraints
ALTER TABLE quotes ADD CONSTRAINT valid_travelers CHECK (
  (travelers_total = (travelers_adults + travelers_children))
);

ALTER TABLE quotes ADD CONSTRAINT quotes_status_check CHECK (
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
);

ALTER TABLE quotes ADD CONSTRAINT valid_payment_schedule CHECK (
  ((payment_deposit + payment_second_payment + payment_final_payment) = total_price)
);

ALTER TABLE quotes ADD CONSTRAINT valid_currency CHECK (
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
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_team_id ON quotes USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes USING btree (status);
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON quotes USING btree (client_email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_event_id ON quotes USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_quotes_consultant_id ON quotes USING btree (consultant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes USING btree (quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_currency ON quotes USING btree (currency);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes USING btree (user_id);

-- Add RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Team members can view team quotes" ON quotes
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Team members can insert team quotes" ON quotes
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Team members can update team quotes" ON quotes
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Team members can delete team quotes" ON quotes
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Grant permissions
GRANT ALL ON quotes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 6: Verify migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_quotes,
  COUNT(CASE WHEN currency IS NOT NULL THEN 1 END) as quotes_with_currency,
  COUNT(CASE WHEN travelers IS NOT NULL THEN 1 END) as quotes_with_travelers_json
FROM quotes;

-- Optional: Clean up backup table after verification
-- DROP TABLE quotes_backup; 