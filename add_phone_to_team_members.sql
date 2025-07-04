-- Add phone number column to team_members table
ALTER TABLE public.team_members 
ADD COLUMN phone text;

-- Add comment for documentation
COMMENT ON COLUMN public.team_members.phone IS 'Phone number for the team member'; 