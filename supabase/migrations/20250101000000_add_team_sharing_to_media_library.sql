-- Add team_id to media_library table for team sharing
ALTER TABLE public.media_library 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_media_library_team_id ON public.media_library(team_id);

-- Update existing media library records to have team_id
-- This will assign media to the user's team
UPDATE public.media_library 
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = media_library.user_id 
  AND tm.status = 'active'
  LIMIT 1
)
WHERE team_id IS NULL;

-- Drop existing RLS policies for media_library
DROP POLICY IF EXISTS "Users can view their own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can insert their own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can update their own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can delete their own media" ON public.media_library;

-- Create new RLS policies for team-based access
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

-- Add comments for documentation
COMMENT ON COLUMN public.media_library.team_id IS 'Reference to the team this media belongs to for team sharing'; 