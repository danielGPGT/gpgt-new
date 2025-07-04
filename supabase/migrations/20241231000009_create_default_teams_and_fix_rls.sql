-- Create default teams for users and fix RLS policies
-- This migration ensures every user has a team and can access team management

-- First, let's create teams for users who don't have one
INSERT INTO public.teams (name, owner_id, max_members)
SELECT 
  COALESCE(
    (SELECT raw_user_meta_data->>'agency_name' FROM auth.users WHERE id = u.id),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = u.id),
    'My Team'
  ) as name,
  u.id as owner_id,
  10 as max_members
FROM auth.users u
WHERE u.id NOT IN (
  SELECT DISTINCT owner_id FROM public.teams WHERE owner_id IS NOT NULL
)
ON CONFLICT DO NOTHING;

-- Add team membership for users who don't have one
INSERT INTO public.team_members (team_id, user_id, email, name, role, status, joined_at)
SELECT 
  t.id as team_id,
  u.id as user_id,
  u.email,
  COALESCE(
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = u.id),
    u.email
  ) as name,
  'owner' as role,
  'active' as status,
  now() as joined_at
FROM auth.users u
JOIN public.teams t ON t.owner_id = u.id
WHERE u.id NOT IN (
  SELECT DISTINCT user_id FROM public.team_members WHERE user_id IS NOT NULL
)
ON CONFLICT DO NOTHING;

-- Drop existing RLS policies to recreate them with better logic
DROP POLICY IF EXISTS "Team owners can manage their team" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their team" ON public.teams;
DROP POLICY IF EXISTS "Users can view their own team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON public.team_invitations;

-- Create more permissive RLS policies for teams table
CREATE POLICY "Users can view teams they own" ON public.teams
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can manage teams they own" ON public.teams
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

CREATE POLICY "Users can manage their own team membership" ON public.team_members
  FOR ALL USING (user_id = auth.uid());

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

-- Add a function to automatically create a team for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create a team for the new user
  INSERT INTO public.teams (name, owner_id, max_members)
  VALUES (
    COALESCE(
      NEW.raw_user_meta_data->>'agency_name',
      NEW.raw_user_meta_data->>'name',
      'My Team'
    ),
    NEW.id,
    10
  );
  
  -- Add the user as a team member with owner role
  INSERT INTO public.team_members (team_id, user_id, email, name, role, status, joined_at)
  SELECT 
    t.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'owner',
    'active',
    now()
  FROM public.teams t
  WHERE t.owner_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 