-- Add consultant roles and event consultant functionality
-- This migration adds 'sales' and 'operations' roles to team members
-- and creates the ability to assign consultants to events

-- Update team_members table to include new roles
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('owner', 'admin', 'member', 'sales', 'operations'));

-- Update team_invitations table to include new roles
ALTER TABLE public.team_invitations 
DROP CONSTRAINT IF EXISTS team_invitations_role_check;

ALTER TABLE public.team_invitations 
ADD CONSTRAINT team_invitations_role_check 
CHECK (role IN ('owner', 'admin', 'member', 'sales', 'operations'));

-- Ensure team_invitations table has the correct structure
ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'));

-- Create event_consultants table to link consultants to events
CREATE TABLE IF NOT EXISTS public.event_consultants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  notes text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_consultants_pkey PRIMARY KEY (id),
  CONSTRAINT event_consultants_unique UNIQUE (event_id, consultant_id)
);

-- Add consultant_id to events table for quick lookup
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS primary_consultant_id uuid REFERENCES public.team_members(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_consultants_event_id ON public.event_consultants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_consultants_consultant_id ON public.event_consultants(consultant_id);
CREATE INDEX IF NOT EXISTS idx_event_consultants_status ON public.event_consultants(status);
CREATE INDEX IF NOT EXISTS idx_events_primary_consultant ON public.events(primary_consultant_id);

-- Enable RLS on event_consultants table
ALTER TABLE public.event_consultants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_consultants
CREATE POLICY "Team members can view event consultants for their team's events" ON public.event_consultants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.events e ON e.id = event_consultants.event_id
      WHERE tm.user_id = auth.uid()
      AND tm.team_id = (
        SELECT team_id FROM public.team_members 
        WHERE user_id = e.primary_consultant_id
        LIMIT 1
      )
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team admins and owners can manage event consultants" ON public.event_consultants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.status = 'active'
      AND tm.team_id = (
        SELECT team_id FROM public.team_members 
        WHERE id = event_consultants.consultant_id
      )
    )
  );

CREATE POLICY "Consultants can view their own assignments" ON public.event_consultants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.id = event_consultants.consultant_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Function to assign consultant to event
CREATE OR REPLACE FUNCTION assign_consultant_to_event(
  p_event_id uuid,
  p_consultant_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_assignment_id uuid;
  v_consultant_team_id uuid;
  v_current_user_team_id uuid;
BEGIN
  -- Get consultant's team
  SELECT team_id INTO v_consultant_team_id
  FROM public.team_members
  WHERE id = p_consultant_id AND status = 'active';
  
  IF v_consultant_team_id IS NULL THEN
    RAISE EXCEPTION 'Consultant not found or inactive';
  END IF;
  
  -- Get current user's team
  SELECT team_id INTO v_current_user_team_id
  FROM public.team_members
  WHERE user_id = auth.uid() AND status = 'active';
  
  -- Check if user can assign consultants (must be admin/owner in same team)
  IF v_current_user_team_id IS NULL OR v_current_user_team_id != v_consultant_team_id THEN
    RAISE EXCEPTION 'You can only assign consultants from your own team';
  END IF;
  
  -- Check if user has permission to assign
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid()
    AND team_id = v_current_user_team_id
    AND role IN ('owner', 'admin')
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only team admins and owners can assign consultants';
  END IF;
  
  -- Check if consultant has sales role
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE id = p_consultant_id
    AND role = 'sales'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only team members with sales role can be assigned as consultants';
  END IF;
  
  -- Create or update assignment
  INSERT INTO public.event_consultants (
    event_id, consultant_id, assigned_by, notes
  ) VALUES (
    p_event_id, p_consultant_id, auth.uid(), p_notes
  )
  ON CONFLICT (event_id, consultant_id) 
  DO UPDATE SET 
    assigned_by = auth.uid(),
    notes = COALESCE(p_notes, event_consultants.notes),
    status = 'active',
    updated_at = now()
  RETURNING id INTO v_assignment_id;
  
  -- Update event's primary consultant if not set
  UPDATE public.events 
  SET primary_consultant_id = p_consultant_id
  WHERE id = p_event_id AND primary_consultant_id IS NULL;
  
  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get consultants for a team
CREATE OR REPLACE FUNCTION get_team_consultants(p_team_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  name text,
  role text,
  status text,
  joined_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.id,
    tm.user_id,
    tm.email,
    tm.name,
    tm.role,
    tm.status,
    tm.joined_at
  FROM public.team_members tm
  WHERE tm.team_id = p_team_id
  AND tm.role = 'sales'
  AND tm.status = 'active'
  ORDER BY tm.name, tm.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get events for a consultant
CREATE OR REPLACE FUNCTION get_consultant_events(p_consultant_id uuid)
RETURNS TABLE (
  event_id uuid,
  event_name text,
  location text,
  start_date date,
  end_date date,
  assigned_at timestamp with time zone,
  status text,
  notes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as event_id,
    e.name as event_name,
    e.location,
    e.start_date,
    e.end_date,
    ec.assigned_at,
    ec.status,
    ec.notes
  FROM public.event_consultants ec
  JOIN public.events e ON e.id = ec.event_id
  WHERE ec.consultant_id = p_consultant_id
  AND ec.status = 'active'
  ORDER BY e.start_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.event_consultants IS 'Links consultants (sales team members) to events they are responsible for';
COMMENT ON COLUMN public.event_consultants.consultant_id IS 'Reference to team_members with role = sales';
COMMENT ON COLUMN public.event_consultants.assigned_by IS 'User who assigned the consultant to the event';
COMMENT ON COLUMN public.events.primary_consultant_id IS 'Primary consultant assigned to this event for quick lookup';

-- Drop existing function first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS create_team_invitation(uuid, text, text, integer);

-- Create updated function to handle new roles (using team_id to match current table structure)
CREATE OR REPLACE FUNCTION create_team_invitation(
  p_team_id uuid,
  p_email text,
  p_role text DEFAULT 'member',
  p_expires_in_hours integer DEFAULT 168 -- 7 days
)
RETURNS uuid AS $$
DECLARE
  v_invitation_id uuid;
  v_token text;
BEGIN
  -- Validate role
  IF p_role NOT IN ('owner', 'admin', 'member', 'sales', 'operations') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;
  
  -- Generate unique token
  v_token := generate_invitation_token();
  
  -- Create invitation
  INSERT INTO public.team_invitations (
    team_id, email, role, invited_by, token, expires_at
  ) VALUES (
    p_team_id, p_email, p_role, auth.uid(), v_token, 
    now() + (p_expires_in_hours || ' hours')::interval
  ) RETURNING id INTO v_invitation_id;
  
  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update accept_team_invitation function to work with current table structure
DROP FUNCTION IF EXISTS accept_team_invitation(text);

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
    team_id, user_id, email, name, role, status, 
    invited_by, invitation_token, joined_at
  ) VALUES (
    v_invitation.team_id, auth.uid(), v_invitation.email,
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