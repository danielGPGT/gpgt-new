-- Update team schema to consistently use team_id instead of subscription_id
-- This migration ensures all team-related tables use team_id for consistency

-- First, let's check if team_invitations table has the correct structure
-- If it has subscription_id, we need to update it
DO $$
BEGIN
  -- Check if team_invitations has subscription_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_invitations' 
    AND column_name = 'subscription_id'
  ) THEN
    -- Add team_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'team_invitations' 
      AND column_name = 'team_id'
    ) THEN
      ALTER TABLE public.team_invitations ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
    
    -- Update existing records to have team_id (this is a simplified approach)
    -- In a real scenario, you'd need to map subscription_id to team_id
    UPDATE public.team_invitations 
    SET team_id = (
      SELECT t.id FROM public.teams t 
      WHERE t.subscription_id = team_invitations.subscription_id
      LIMIT 1
    )
    WHERE team_id IS NULL AND subscription_id IS NOT NULL;
    
    -- Drop subscription_id column
    ALTER TABLE public.team_invitations DROP COLUMN IF EXISTS subscription_id;
  END IF;
END $$;

-- Update team_members table to use team_id consistently
DO $$
BEGIN
  -- Check if team_members has subscription_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' 
    AND column_name = 'subscription_id'
  ) THEN
    -- Add team_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'team_members' 
      AND column_name = 'team_id'
    ) THEN
      ALTER TABLE public.team_members ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
    
    -- Update existing records to have team_id
    UPDATE public.team_members 
    SET team_id = (
      SELECT t.id FROM public.teams t 
      WHERE t.subscription_id = team_members.subscription_id
      LIMIT 1
    )
    WHERE team_id IS NULL AND subscription_id IS NOT NULL;
    
    -- Drop subscription_id column
    ALTER TABLE public.team_members DROP COLUMN IF EXISTS subscription_id;
  END IF;
END $$;

-- Update teams table to remove subscription_id dependency if it exists
DO $$
BEGIN
  -- Check if teams table has subscription_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' 
    AND column_name = 'subscription_id'
  ) THEN
    -- Drop the foreign key constraint first
    ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_subscription_id_fkey;
    ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_subscription_id_unique;
    
    -- Drop subscription_id column
    ALTER TABLE public.teams DROP COLUMN IF EXISTS subscription_id;
  END IF;
END $$;

-- Update RLS policies to use team_id instead of subscription_id
DROP POLICY IF EXISTS "Team owners can view all team members" ON public.team_members;
CREATE POLICY "Team owners can view all team members" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;
CREATE POLICY "Team owners can manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team owners can manage invitations" ON public.team_invitations;
CREATE POLICY "Team owners can manage invitations" ON public.team_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = team_invitations.team_id 
      AND t.owner_id = auth.uid()
    )
  );

-- Update indexes to use team_id
DROP INDEX IF EXISTS idx_team_members_subscription_id;
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);

DROP INDEX IF EXISTS idx_team_invitations_subscription_id;
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);

-- Ensure team_invitations table has the correct structure
ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'));

-- Update the role constraints to include new roles
ALTER TABLE public.team_invitations 
DROP CONSTRAINT IF EXISTS team_invitations_role_check;

ALTER TABLE public.team_invitations 
ADD CONSTRAINT team_invitations_role_check 
CHECK (role IN ('owner', 'admin', 'member', 'sales', 'operations'));

-- Add comments for documentation
COMMENT ON COLUMN public.team_members.team_id IS 'Reference to the team this member belongs to';
COMMENT ON COLUMN public.team_invitations.team_id IS 'Reference to the team this invitation is for'; 