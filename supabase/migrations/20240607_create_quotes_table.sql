CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  client_name text NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  travelers jsonb NOT NULL, -- { adults: 2, children: 1 }
  preferences jsonb,        -- tone, pace, interests
  inventory_options jsonb,  -- flights/hotels/events + filters
  agent_margin numeric DEFAULT 0.15,
  generated_itinerary jsonb, -- AI + real inventory
  total_price numeric,
  currency text DEFAULT 'GBP',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Additional columns for the new quote service
  trip_details jsonb,       -- Complete trip details from form
  include_inventory jsonb,  -- Inventory selection flags
  filters jsonb,           -- Inventory filters
  agent_context jsonb,     -- Agent context and margin override
  base_cost numeric,       -- Base cost before margin
  margin numeric           -- Applied margin percentage
); 