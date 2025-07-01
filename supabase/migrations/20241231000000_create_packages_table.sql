-- Create packages table
CREATE TABLE public.packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid,
  name text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  duration_days integer NOT NULL,
  min_travelers integer DEFAULT 1,
  max_travelers integer,
  is_public boolean DEFAULT false,
  status text DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  
  -- Package content
  destinations jsonb NOT NULL DEFAULT '[]',
  flights jsonb DEFAULT '{}',
  transfers jsonb DEFAULT '[]',
  events jsonb DEFAULT '[]',
  itinerary_text text,
  
  -- Pricing
  base_price numeric,
  currency text DEFAULT 'GBP',
  pricing_type text DEFAULT 'per_person' CHECK (pricing_type = ANY (ARRAY['per_person'::text, 'per_group'::text, 'dynamic'::text])),
  margin_type text DEFAULT 'percentage' CHECK (margin_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  margin_value numeric DEFAULT 0.15,
  internal_notes text,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  version text DEFAULT '1.0',
  
  CONSTRAINT packages_pkey PRIMARY KEY (id),
  CONSTRAINT packages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT packages_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);

-- Create indexes for better performance
CREATE INDEX idx_packages_user_id ON public.packages(user_id);
CREATE INDEX idx_packages_team_id ON public.packages(team_id);
CREATE INDEX idx_packages_status ON public.packages(status);
CREATE INDEX idx_packages_tags ON public.packages USING GIN(tags);
CREATE INDEX idx_packages_public ON public.packages(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own packages" ON public.packages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own packages" ON public.packages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own packages" ON public.packages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own packages" ON public.packages
  FOR DELETE USING (auth.uid() = user_id);

-- Team members can view team packages
CREATE POLICY "Team members can view team packages" ON public.packages
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Public packages can be viewed by anyone
CREATE POLICY "Public packages are viewable by all" ON public.packages
  FOR SELECT USING (is_public = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION update_packages_updated_at(); 