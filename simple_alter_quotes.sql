-- Simple ALTER script to add package intake fields to existing quotes table
-- This adds only the essential fields needed for the package intake form

-- Add missing fields for package intake form
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS quote_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES public.team_members(id),
ADD COLUMN IF NOT EXISTS travelers_adults INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS travelers_children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS travelers_total INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id),
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id),
ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES public.package_tiers(id),
ADD COLUMN IF NOT EXISTS payment_deposit DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_second_payment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_final_payment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_deposit_date DATE,
ADD COLUMN IF NOT EXISTS payment_second_payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_final_payment_date DATE,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE;

-- Update status constraint to include new statuses
ALTER TABLE public.quotes 
DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'confirmed', 'cancelled'));

-- Add basic constraint for travelers
ALTER TABLE public.quotes 
ADD CONSTRAINT IF NOT EXISTS valid_travelers 
CHECK (travelers_total = travelers_adults + travelers_children);

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_event_id ON public.quotes(event_id);
CREATE INDEX IF NOT EXISTS idx_quotes_consultant_id ON public.quotes(consultant_id);

-- Simple function to generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_num INTEGER;
    new_quote_number VARCHAR(50);
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.quotes
    WHERE quote_number LIKE 'Q-' || year_part || '-%';
    
    new_quote_number := 'Q-' || year_part || '-' || LPAD(sequence_num::VARCHAR, 3, '0');
    NEW.quote_number := new_quote_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate quote numbers
DROP TRIGGER IF EXISTS trigger_generate_quote_number ON public.quotes;
CREATE TRIGGER trigger_generate_quote_number
    BEFORE INSERT ON public.quotes
    FOR EACH ROW
    WHEN (NEW.quote_number IS NULL)
    EXECUTE FUNCTION generate_quote_number();

-- Update existing quotes to have quote numbers if they don't have them
UPDATE public.quotes 
SET quote_number = 'Q-' || EXTRACT(YEAR FROM created_at)::VARCHAR || '-' || LPAD(id::text, 3, '0')
WHERE quote_number IS NULL; 