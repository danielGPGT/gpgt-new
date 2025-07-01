-- Add missing columns for the new quote service
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS trip_details jsonb,
ADD COLUMN IF NOT EXISTS include_inventory jsonb,
ADD COLUMN IF NOT EXISTS filters jsonb,
ADD COLUMN IF NOT EXISTS agent_context jsonb,
ADD COLUMN IF NOT EXISTS base_cost numeric,
ADD COLUMN IF NOT EXISTS margin numeric,
ADD COLUMN IF NOT EXISTS budget jsonb,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS travelers jsonb;

-- Add client contact information columns
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_address JSONB;

-- Add selected event and ticket columns
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS selected_event JSONB,
ADD COLUMN IF NOT EXISTS selected_ticket JSONB; 