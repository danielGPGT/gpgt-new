-- HubSpot Integration Tables
-- Run this in your Supabase SQL Editor to create the HubSpot integration tables

-- 1. HubSpot team connections table
CREATE TABLE public.hubspot_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  hubspot_portal_id text NOT NULL,
  hubspot_account_name text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  sync_frequency text DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL,
  CONSTRAINT hubspot_connections_pkey PRIMARY KEY (id),
  CONSTRAINT hubspot_connections_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
  CONSTRAINT hubspot_connections_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT hubspot_connections_team_id_unique UNIQUE (team_id)
);

-- 2. HubSpot contact mappings table (maps our clients to HubSpot contacts)
CREATE TABLE public.hubspot_contact_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  client_id uuid NOT NULL,
  hubspot_contact_id text NOT NULL,
  last_synced_at timestamp with time zone DEFAULT now(),
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed', 'conflict')),
  sync_error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hubspot_contact_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT hubspot_contact_mappings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
  CONSTRAINT hubspot_contact_mappings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT hubspot_contact_mappings_unique UNIQUE (team_id, client_id, hubspot_contact_id)
);

-- 3. HubSpot deal mappings table (maps our quotes to HubSpot deals)
CREATE TABLE public.hubspot_deal_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  quote_id uuid NOT NULL,
  hubspot_deal_id text NOT NULL,
  last_synced_at timestamp with time zone DEFAULT now(),
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed', 'conflict')),
  sync_error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hubspot_deal_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT hubspot_deal_mappings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
  CONSTRAINT hubspot_deal_mappings_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE,
  CONSTRAINT hubspot_deal_mappings_unique UNIQUE (team_id, quote_id, hubspot_deal_id)
);

-- 4. HubSpot sync logs table (tracks sync operations)
CREATE TABLE public.hubspot_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  sync_type text NOT NULL CHECK (sync_type IN ('contacts', 'deals', 'companies', 'full_sync')),
  status text NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'partial')),
  records_processed integer DEFAULT 0,
  records_synced integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hubspot_sync_logs_pkey PRIMARY KEY (id),
  CONSTRAINT hubspot_sync_logs_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE
);

-- 5. HubSpot sync settings table (team-specific sync configuration)
CREATE TABLE public.hubspot_sync_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  sync_contacts boolean DEFAULT true,
  sync_deals boolean DEFAULT true,
  sync_companies boolean DEFAULT false,
  sync_interactions boolean DEFAULT true,
  sync_travel_history boolean DEFAULT true,
  auto_create_contacts boolean DEFAULT true,
  auto_create_deals boolean DEFAULT true,
  sync_direction text DEFAULT 'bidirectional' CHECK (sync_direction IN ('to_hubspot', 'from_hubspot', 'bidirectional')),
  contact_mapping jsonb DEFAULT '{}',
  deal_mapping jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hubspot_sync_settings_pkey PRIMARY KEY (id),
  CONSTRAINT hubspot_sync_settings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
  CONSTRAINT hubspot_sync_settings_team_id_unique UNIQUE (team_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hubspot_connections_team_id ON public.hubspot_connections(team_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_connections_portal_id ON public.hubspot_connections(hubspot_portal_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_contact_mappings_team_id ON public.hubspot_contact_mappings(team_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_contact_mappings_client_id ON public.hubspot_contact_mappings(client_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_contact_mappings_hubspot_id ON public.hubspot_contact_mappings(hubspot_contact_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_deal_mappings_team_id ON public.hubspot_deal_mappings(team_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_deal_mappings_quote_id ON public.hubspot_deal_mappings(quote_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_deal_mappings_hubspot_id ON public.hubspot_deal_mappings(hubspot_deal_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_logs_team_id ON public.hubspot_sync_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_logs_created_at ON public.hubspot_sync_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.hubspot_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_contact_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_deal_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_sync_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hubspot_connections
CREATE POLICY "Team owners can manage their HubSpot connections" ON public.hubspot_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = hubspot_connections.team_id 
      AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can view HubSpot connections" ON public.hubspot_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = hubspot_connections.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
      AND tm.status = 'active'
    )
  );

-- RLS Policies for hubspot_contact_mappings
CREATE POLICY "Team members can view contact mappings" ON public.hubspot_contact_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = hubspot_contact_mappings.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team owners can manage contact mappings" ON public.hubspot_contact_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = hubspot_contact_mappings.team_id 
      AND t.owner_id = auth.uid()
    )
  );

-- RLS Policies for hubspot_deal_mappings
CREATE POLICY "Team members can view deal mappings" ON public.hubspot_deal_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = hubspot_deal_mappings.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team owners can manage deal mappings" ON public.hubspot_deal_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = hubspot_deal_mappings.team_id 
      AND t.owner_id = auth.uid()
    )
  );

-- RLS Policies for hubspot_sync_logs
CREATE POLICY "Team members can view sync logs" ON public.hubspot_sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = hubspot_sync_logs.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

-- RLS Policies for hubspot_sync_settings
CREATE POLICY "Team owners can manage sync settings" ON public.hubspot_sync_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = hubspot_sync_settings.team_id 
      AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can view sync settings" ON public.hubspot_sync_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = hubspot_sync_settings.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
      AND tm.status = 'active'
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_hubspot_connections_updated_at
  BEFORE UPDATE ON public.hubspot_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_hubspot_contact_mappings_updated_at
  BEFORE UPDATE ON public.hubspot_contact_mappings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_hubspot_deal_mappings_updated_at
  BEFORE UPDATE ON public.hubspot_deal_mappings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_hubspot_sync_settings_updated_at
  BEFORE UPDATE ON public.hubspot_sync_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default sync settings when a team connects to HubSpot
CREATE OR REPLACE FUNCTION public.create_default_hubspot_sync_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.hubspot_sync_settings (team_id)
  VALUES (NEW.team_id)
  ON CONFLICT (team_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_default_hubspot_sync_settings_trigger
  AFTER INSERT ON public.hubspot_connections
  FOR EACH ROW EXECUTE FUNCTION public.create_default_hubspot_sync_settings(); 