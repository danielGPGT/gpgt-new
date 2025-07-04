-- Add active column to tickets table
ALTER TABLE public.tickets 
ADD COLUMN active boolean DEFAULT true;

-- Add active column to flights table  
ALTER TABLE public.flights
ADD COLUMN active boolean DEFAULT true;

-- Add comments to explain the purpose
COMMENT ON COLUMN public.tickets.active IS 'Whether this ticket category is available for selection in packages';
COMMENT ON COLUMN public.flights.active IS 'Whether this flight is available for selection in packages';

-- Update existing records to be active by default
UPDATE public.tickets SET active = true WHERE active IS NULL;
UPDATE public.flights SET active = true WHERE active IS NULL; 