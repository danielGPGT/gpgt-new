-- Create itineraries table with team sharing support
CREATE TABLE public.itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  client_name text NOT NULL,
  destination text NOT NULL,
  generated_by uuid NOT NULL REFERENCES auth.users(id),
  date_created timestamp with time zone DEFAULT now(),
  preferences jsonb,
  days jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT itineraries_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX idx_itineraries_team_id ON public.itineraries(team_id);
CREATE INDEX idx_itineraries_generated_by ON public.itineraries(generated_by);
CREATE INDEX idx_itineraries_created_at ON public.itineraries(created_at);

-- Enable Row Level Security
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team-based access
CREATE POLICY "Users can view itineraries from their team" ON public.itineraries
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert itineraries for their team" ON public.itineraries
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update itineraries from their team" ON public.itineraries
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete itineraries from their team" ON public.itineraries
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.itineraries IS 'Stores generated travel itineraries with team sharing support';
COMMENT ON COLUMN public.itineraries.team_id IS 'Team ID for team-based access control';
COMMENT ON COLUMN public.itineraries.user_id IS 'User who created the itinerary';
COMMENT ON COLUMN public.itineraries.generated_by IS 'User who generated the itinerary (may be different from user_id)';
COMMENT ON COLUMN public.itineraries.preferences IS 'Travel preferences and requirements';
COMMENT ON COLUMN public.itineraries.days IS 'Daily itinerary activities and schedule'; 