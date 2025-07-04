-- Complete team sharing implementation for quotes, bookings, and media library
-- This migration ensures all entities have team_id columns and proper RLS policies

-- 1. Add team_id to quotes table if it doesn't exist
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- 2. Add team_id to bookings table if it doesn't exist
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- 3. Update existing quotes to have team_id based on user's team membership
UPDATE public.quotes 
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = quotes.user_id 
  AND tm.status = 'active'
  LIMIT 1
)
WHERE team_id IS NULL;

-- 4. Update existing bookings to have team_id based on user's team membership
UPDATE public.bookings 
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = bookings.user_id 
  AND tm.status = 'active'
  LIMIT 1
)
WHERE team_id IS NULL;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_team_id ON public.quotes(team_id);
CREATE INDEX IF NOT EXISTS idx_bookings_team_id ON public.bookings(team_id);

-- 6. Drop existing user-based RLS policies for quotes
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;

-- 7. Create new team-based RLS policies for quotes
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

-- 8. Drop existing user-based RLS policies for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

-- 9. Create new team-based RLS policies for bookings
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

-- 10. Ensure media_library has team_id column (should already exist from previous migration)
ALTER TABLE public.media_library 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- 11. Update existing media library records to have team_id
UPDATE public.media_library 
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = media_library.user_id 
  AND tm.status = 'active'
  LIMIT 1
)
WHERE team_id IS NULL;

-- 12. Drop existing user-based RLS policies for media_library
DROP POLICY IF EXISTS "Users can view their own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can insert their own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can update their own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can delete their own media" ON public.media_library;

-- 13. Create new team-based RLS policies for media_library
CREATE POLICY "Team members can view team media" ON public.media_library
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = media_library.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can insert team media" ON public.media_library
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = media_library.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can update team media" ON public.media_library
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = media_library.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can delete team media" ON public.media_library
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = media_library.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- 14. Create index for media_library team_id
CREATE INDEX IF NOT EXISTS idx_media_library_team_id ON public.media_library(team_id);

-- 15. Add comments for documentation
COMMENT ON COLUMN public.quotes.team_id IS 'Reference to the team this quote belongs to for team sharing';
COMMENT ON COLUMN public.bookings.team_id IS 'Reference to the team this booking belongs to for team sharing';
COMMENT ON COLUMN public.media_library.team_id IS 'Reference to the team this media belongs to for team sharing';

-- 16. Ensure RLS is enabled on all tables
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY; 