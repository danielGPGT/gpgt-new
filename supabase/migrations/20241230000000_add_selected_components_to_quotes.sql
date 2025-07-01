-- Add selected_flights and selected_hotels columns to quotes table
ALTER TABLE public.quotes 
ADD COLUMN selected_flights jsonb null,
ADD COLUMN selected_hotels jsonb null;

-- Add comments to document the new columns
COMMENT ON COLUMN public.quotes.selected_flights IS 'Stores selected flight data from intake form with pricing and currency information';
COMMENT ON COLUMN public.quotes.selected_hotels IS 'Stores selected hotel data from intake form with pricing and currency information'; 