-- Update RLS policies for quotes table to support team sharing
-- Drop existing user-based policies
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;

-- Create new team-based policies for quotes
CREATE POLICY "Team members can view team quotes" ON public.quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = quotes.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can insert team quotes" ON public.quotes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = quotes.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can update team quotes" ON public.quotes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = quotes.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can delete team quotes" ON public.quotes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = quotes.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Update RLS policies for bookings table to support team sharing
-- Drop existing user-based policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

-- Create new team-based policies for bookings
CREATE POLICY "Team members can view team bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = bookings.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can insert team bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = bookings.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can update team bookings" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = bookings.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can delete team bookings" ON public.bookings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = bookings.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_team_id ON public.quotes(team_id);
CREATE INDEX IF NOT EXISTS idx_bookings_team_id ON public.bookings(team_id);

-- Add comments for documentation
COMMENT ON COLUMN public.quotes.team_id IS 'Reference to the team this quote belongs to for team sharing';
COMMENT ON COLUMN public.bookings.team_id IS 'Reference to the team this booking belongs to for team sharing'; 