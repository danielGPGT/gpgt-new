CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  client_name text NOT NULL,
  booking_data jsonb,
  total_cost numeric,
  currency text DEFAULT 'GBP',
  status text DEFAULT 'confirmed',
  supplier_ref text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
); 