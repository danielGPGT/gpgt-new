-- Add missing fields to tickets table
ALTER TABLE public.tickets 
ADD COLUMN supplier_currency text DEFAULT 'EUR',
ADD COLUMN supplier_price numeric(10, 2),
ADD COLUMN ticket_days text;

-- Add constraint for ticket_days
ALTER TABLE public.tickets 
ADD CONSTRAINT ticket_days_valid_range CHECK (
  ticket_days = ANY (ARRAY[
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
    'Friday-Saturday',
    'Saturday-Sunday',
    'Friday-Sunday',
    'Thursday-Sunday'
  ])
);

-- Add generated column for price_gbp
ALTER TABLE public.tickets 
ADD COLUMN price_gbp numeric(10, 2) GENERATED ALWAYS AS (
  supplier_price + (supplier_price * markup_percent / 100)
) STORED; 