-- Add selected components columns to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS selected_flights JSONB,
ADD COLUMN IF NOT EXISTS selected_hotels JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.quotes.selected_flights IS 'Array of selected flight data from new intake form';
COMMENT ON COLUMN public.quotes.selected_hotels IS 'Array of selected hotel data from new intake form'; 