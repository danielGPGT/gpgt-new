-- Enhance team management system
-- Add missing fields and improve structure

-- Add missing columns to team_members table
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invitation_token text UNIQUE,
ADD COLUMN IF NOT EXISTS invitation_expires_at timestamp with time zone;

-- Create team_invitations table for better invitation management
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token text UNIQUE NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_invitations_pkey PRIMARY KEY (id)
);

-- Create teams table for better organization
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  max_members integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_subscription_id_unique UNIQUE (subscription_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_subscription_id ON public.team_members(subscription_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_subscription_id ON public.team_invitations(subscription_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);

-- Add RLS policies for team management
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members policies
CREATE POLICY "Users can view their own team membership" ON public.team_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team owners can view all team members" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.id = team_members.subscription_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.id = team_members.subscription_id 
      AND s.user_id = auth.uid()
    )
  );

-- Team invitations policies
CREATE POLICY "Team owners can manage invitations" ON public.team_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.id = team_invitations.subscription_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations sent to them" ON public.team_invitations
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Teams policies
CREATE POLICY "Team owners can manage their team" ON public.teams
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Team members can view their team" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.subscription_id = teams.subscription_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Function to generate invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to create team invitation
CREATE OR REPLACE FUNCTION create_team_invitation(
  p_subscription_id uuid,
  p_email text,
  p_role text DEFAULT 'member',
  p_expires_in_hours integer DEFAULT 168 -- 7 days
)
RETURNS uuid AS $$
DECLARE
  v_invitation_id uuid;
  v_token text;
BEGIN
  -- Generate unique token
  v_token := generate_invitation_token();
  
  -- Create invitation
  INSERT INTO public.team_invitations (
    subscription_id, email, role, invited_by, token, expires_at
  ) VALUES (
    p_subscription_id, p_email, p_role, auth.uid(), v_token, 
    now() + (p_expires_in_hours || ' hours')::interval
  ) RETURNING id INTO v_invitation_id;
  
  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(p_token text)
RETURNS boolean AS $$
DECLARE
  v_invitation public.team_invitations;
  v_team_member_id uuid;
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation 
  FROM public.team_invitations 
  WHERE token = p_token 
  AND status = 'pending' 
  AND expires_at > now();
  
  IF v_invitation IS NULL THEN
    RETURN false;
  END IF;
  
  -- Create team member record
  INSERT INTO public.team_members (
    subscription_id, user_id, email, name, role, status, 
    invited_by, invitation_token, joined_at
  ) VALUES (
    v_invitation.subscription_id, auth.uid(), v_invitation.email,
    (SELECT name FROM auth.users WHERE id = auth.uid()),
    v_invitation.role, 'active', v_invitation.invited_by,
    v_invitation.token, now()
  ) RETURNING id INTO v_team_member_id;
  
  -- Mark invitation as accepted
  UPDATE public.team_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE id = v_invitation.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 