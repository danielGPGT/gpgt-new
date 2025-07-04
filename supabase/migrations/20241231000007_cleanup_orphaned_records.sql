-- Clean up orphaned records before adding foreign key constraints
-- This migration removes records that would violate foreign key constraints

-- First, let's see what orphaned records exist
-- Remove team_members records where user_id doesn't exist in auth.users
DELETE FROM public.team_members 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM auth.users);

-- Remove team_members records where invited_by doesn't exist in auth.users
UPDATE public.team_members 
SET invited_by = NULL 
WHERE invited_by IS NOT NULL 
AND invited_by NOT IN (SELECT id FROM auth.users);

-- Remove team_invitations records where invited_by doesn't exist in auth.users
UPDATE public.team_invitations 
SET invited_by = NULL 
WHERE invited_by IS NOT NULL 
AND invited_by NOT IN (SELECT id FROM auth.users);

-- Remove team_members records where team_id doesn't exist in teams
DELETE FROM public.team_members 
WHERE team_id IS NOT NULL 
AND team_id NOT IN (SELECT id FROM public.teams);

-- Remove team_invitations records where team_id doesn't exist in teams
DELETE FROM public.team_invitations 
WHERE team_id IS NOT NULL 
AND team_id NOT IN (SELECT id FROM public.teams);

-- Remove teams records where owner_id doesn't exist in auth.users
DELETE FROM public.teams 
WHERE owner_id IS NOT NULL 
AND owner_id NOT IN (SELECT id FROM auth.users);

-- Note: Teams and team members will be created automatically when users first access the team management
-- This migration only cleans up orphaned records to allow foreign key constraints to be added 