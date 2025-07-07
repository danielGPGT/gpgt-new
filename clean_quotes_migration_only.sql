-- Clean Quotes Migration - Main Table Only
-- This script updates only the main quotes table and drops unused supporting tables

-- Step 1: Backup existing data
CREATE TABLE quotes_backup AS SELECT * FROM quotes;

-- Step 2: Drop unused supporting tables (they're not being used in the codebase)
DROP TABLE IF EXISTS quote_components CASCADE;
DROP TABLE IF EXISTS quote_attachments CASCADE;
DROP TABLE IF EXISTS quote_activity_log CASCADE;
DROP TABLE IF EXISTS quote_email_tracking CASCADE;
DROP TABLE IF EXISTS quote_settings CASCADE;

-- Step 3: Create new clean quotes table
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
  
  -- Component Data (stored as JSONB - simpler approach)
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

-- Step 4: Migrate data from old table to new table
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
  -- Use existing travelers jsonb or create from individual fields
  COALESCE(travelers, jsonb_build_object(
    'adults', COALESCE(travelers_adults, 1),
    'children', COALESCE(travelers_children, 0),
    'total', COALESCE(travelers_total, 1)
  )) as travelers,
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

-- Step 5: Handle foreign key dependencies properly
-- First, drop the foreign key constraint from bookings table
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_quote_id_fkey;

-- Step 6: Drop old table and rename new table
DROP TABLE quotes;
ALTER TABLE quotes_new RENAME TO quotes;

-- Step 7: Add PRIMARY KEY constraint FIRST (this is crucial!)
ALTER TABLE quotes ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);

-- Step 8: Add UNIQUE constraint for quote_number
ALTER TABLE quotes ADD CONSTRAINT quotes_quote_number_key UNIQUE (quote_number);

-- Step 9: Now add foreign key constraints (after primary key is in place)
ALTER TABLE quotes ADD CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL;
ALTER TABLE quotes ADD CONSTRAINT quotes_event_id_fkey FOREIGN KEY (event_id) REFERENCES events (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL;
ALTER TABLE quotes ADD CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES package_tiers (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_package_id_fkey FOREIGN KEY (package_id) REFERENCES packages (id);
ALTER TABLE quotes ADD CONSTRAINT quotes_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES team_members (id) ON DELETE SET NULL;

-- Step 10: Add self-referencing foreign key (after primary key is in place)
ALTER TABLE quotes ADD CONSTRAINT quotes_parent_quote_id_fkey FOREIGN KEY (parent_quote_id) REFERENCES quotes (id);

-- Step 11: Re-add the foreign key constraint to bookings table
ALTER TABLE bookings ADD CONSTRAINT bookings_quote_id_fkey 
  FOREIGN KEY (quote_id) REFERENCES quotes(id);

-- Step 12: Add validation constraints
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

-- Step 13: Create indexes
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

-- Step 14: Add RLS
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

-- Step 15: Verify migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_quotes,
  COUNT(CASE WHEN currency IS NOT NULL THEN 1 END) as quotes_with_currency,
  COUNT(CASE WHEN travelers IS NOT NULL THEN 1 END) as quotes_with_travelers_json,
  COUNT(CASE WHEN client_address IS NOT NULL THEN 1 END) as quotes_with_client_address
FROM quotes;

-- Verify bookings table still works
SELECT 
  'Bookings table verification' as check_type,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN quote_id IS NOT NULL THEN 1 END) as bookings_with_quotes
FROM bookings;

-- Optional: Clean up backup table after verification
-- DROP TABLE quotes_backup; 