-- Create CRM system tables
-- This migration creates a proper CRM structure for travel agents

-- Clients table - central client management
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- The travel agent who owns this client
  team_id uuid, -- For team-based access
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  company text,
  job_title text,
  date_of_birth date,
  passport_number text,
  nationality text,
  preferred_language text DEFAULT 'English',
  
  -- Address information
  address jsonb, -- { street, city, state, zip_code, country }
  
  -- Client preferences and notes
  preferences jsonb, -- { dietary_restrictions, accessibility_needs, travel_style, etc. }
  notes text,
  
  -- Client status and categorization
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'vip')),
  source text, -- How they found you: 'referral', 'website', 'social_media', etc.
  tags text[] DEFAULT '{}',
  
  -- Financial information
  budget_preference jsonb, -- { min: 1000, max: 5000, currency: 'USD' }
  payment_preference text, -- 'credit_card', 'bank_transfer', 'cash'
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_contact_at timestamp with time zone,
  
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT clients_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);

-- Client interactions/communications log
CREATE TABLE public.client_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  user_id uuid NOT NULL, -- The agent who made the interaction
  interaction_type text NOT NULL CHECK (interaction_type IN ('email', 'phone', 'meeting', 'quote_sent', 'quote_accepted', 'quote_declined', 'follow_up', 'note')),
  subject text,
  content text,
  outcome text,
  next_action text,
  scheduled_follow_up timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT client_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT client_interactions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT client_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Client travel history
CREATE TABLE public.client_travel_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  quote_id uuid,
  destination text NOT NULL,
  start_date date,
  end_date date,
  trip_type text, -- 'leisure', 'business', 'honeymoon', 'family', etc.
  total_spent numeric,
  currency text DEFAULT 'USD',
  status text DEFAULT 'completed', -- 'planned', 'completed', 'cancelled'
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT client_travel_history_pkey PRIMARY KEY (id),
  CONSTRAINT client_travel_history_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT client_travel_history_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL
);

-- Add client_id to quotes table to link quotes to clients
ALTER TABLE public.quotes 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add client_id to bookings table
ALTER TABLE public.bookings 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_team_id ON public.clients(team_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_client_interactions_client_id ON public.client_interactions(client_id);
CREATE INDEX idx_client_interactions_created_at ON public.client_interactions(created_at);
CREATE INDEX idx_client_travel_history_client_id ON public.client_travel_history(client_id);
CREATE INDEX idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);

-- Create RLS policies for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_travel_history ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view their own clients" ON public.clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own clients" ON public.clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own clients" ON public.clients
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own clients" ON public.clients
  FOR DELETE USING (user_id = auth.uid());

-- Team-based access policies
CREATE POLICY "Team members can view team clients" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = clients.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert team clients" ON public.clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = clients.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update team clients" ON public.clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = clients.team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Client interactions policies
CREATE POLICY "Users can view interactions for their clients" ON public.client_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_interactions.client_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert interactions for their clients" ON public.client_interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_interactions.client_id 
      AND c.user_id = auth.uid()
    )
  );

-- Client travel history policies
CREATE POLICY "Users can view travel history for their clients" ON public.client_travel_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_travel_history.client_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert travel history for their clients" ON public.client_travel_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_travel_history.client_id 
      AND c.user_id = auth.uid()
    )
  );

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_client_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_client_updated_at();

-- Function to update client last_contact_at when interaction is created
CREATE OR REPLACE FUNCTION update_client_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients 
  SET last_contact_at = NEW.created_at
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_last_contact_trigger
  AFTER INSERT ON public.client_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_client_last_contact(); 