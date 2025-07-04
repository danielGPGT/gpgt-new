-- Fix team creation trigger to not create teams for invited users
-- This prevents creating duplicate teams when users accept invitations

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a new function that checks for pending invitations
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if this user has a pending invitation
  -- If they do, don't create a team (they'll be added to the invited team)
  IF EXISTS (
    SELECT 1 FROM public.team_invitations 
    WHERE email = NEW.email 
    AND status = 'pending'
  ) THEN
    -- User has a pending invitation, don't create a team
    RETURN NEW;
  END IF;

  -- No pending invitation, create a team for the new user
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 