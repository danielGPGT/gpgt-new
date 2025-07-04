-- Fix foreign key constraints and table relationships
-- This migration ensures all foreign keys are properly set up

-- First, let's ensure the teams table exists with proper structure
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id)
);

-- Ensure team_members table has proper foreign key constraints
DO $$
BEGIN
  -- Add team_id foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_team_id_fkey'
    AND table_name = 'team_members'
  ) THEN
    ALTER TABLE public.team_members 
    ADD CONSTRAINT team_members_team_id_fkey 
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
  
  -- Add user_id foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_user_id_fkey'
    AND table_name = 'team_members'
  ) THEN
    ALTER TABLE public.team_members 
    ADD CONSTRAINT team_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add invited_by foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_invited_by_fkey'
    AND table_name = 'team_members'
  ) THEN
    ALTER TABLE public.team_members 
    ADD CONSTRAINT team_members_invited_by_fkey 
    FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Fix team_invitations table foreign key constraints
DO $$
BEGIN
  -- Fix invited_by foreign key to reference auth.users instead of users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_invitations_invited_by_fkey'
    AND table_name = 'team_invitations'
  ) THEN
    ALTER TABLE public.team_invitations 
    DROP CONSTRAINT team_invitations_invited_by_fkey;
  END IF;
  
  -- Add correct invited_by foreign key
  ALTER TABLE public.team_invitations 
  ADD CONSTRAINT team_invitations_invited_by_fkey 
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Team owners can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team members can view their team" ON public.teams;
DROP POLICY IF EXISTS "Team owners can manage their team" ON public.teams;

-- Create proper RLS policies for teams table
CREATE POLICY "Team owners can manage their team" ON public.teams
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Team members can view their team" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = teams.id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Create proper RLS policies for team_members table
CREATE POLICY "Users can view their own team membership" ON public.team_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Team owners can view all team members" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    )
  );

-- Create proper RLS policies for team_invitations table
CREATE POLICY "Team owners can manage invitations" ON public.team_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams t 
      WHERE t.id = team_invitations.team_id 
      AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations sent to them" ON public.team_invitations
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Ensure all required columns exist
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS email text NOT NULL,
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member',
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invitation_token text UNIQUE,
ADD COLUMN IF NOT EXISTS invitation_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS email text NOT NULL,
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member',
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS token text UNIQUE NOT NULL,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NOT NULL,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add role constraints
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('owner', 'admin', 'member', 'sales', 'operations'));

ALTER TABLE public.team_invitations 
DROP CONSTRAINT IF EXISTS team_invitations_role_check;

ALTER TABLE public.team_invitations 
ADD CONSTRAINT team_invitations_role_check 
CHECK (role IN ('owner', 'admin', 'member', 'sales', 'operations'));

-- Add status constraints
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_status_check;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_status_check 
CHECK (status IN ('active', 'invited', 'inactive'));

ALTER TABLE public.team_invitations 
DROP CONSTRAINT IF EXISTS team_invitations_status_check;

ALTER TABLE public.team_invitations 
ADD CONSTRAINT team_invitations_status_check 
CHECK (status IN ('pending', 'accepted', 'expired'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);

-- Add comments for documentation
COMMENT ON TABLE public.teams IS 'Teams table for organizing users into groups';
COMMENT ON COLUMN public.teams.owner_id IS 'Reference to the user who owns this team';
COMMENT ON TABLE public.team_members IS 'Team members with their roles and status';
COMMENT ON COLUMN public.team_members.team_id IS 'Reference to the team this member belongs to';
COMMENT ON COLUMN public.team_members.user_id IS 'Reference to the user account';
COMMENT ON TABLE public.team_invitations IS 'Pending team invitations';
COMMENT ON COLUMN public.team_invitations.team_id IS 'Reference to the team this invitation is for'; 