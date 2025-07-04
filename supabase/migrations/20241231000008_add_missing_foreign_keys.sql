-- Add missing foreign key constraints
-- This migration adds the foreign key constraints that are missing from the schema

-- Add foreign key constraint for teams.owner_id
ALTER TABLE public.teams 
ADD CONSTRAINT teams_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for team_members.team_id
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- Add foreign key constraint for team_members.user_id
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for team_members.invited_by
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add foreign key constraint for team_invitations.team_id
ALTER TABLE public.team_invitations 
ADD CONSTRAINT team_invitations_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- Add foreign key constraint for team_invitations.invited_by
ALTER TABLE public.team_invitations 
ADD CONSTRAINT team_invitations_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams table
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

-- Create RLS policies for team_members table
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

-- Create RLS policies for team_invitations table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email); 