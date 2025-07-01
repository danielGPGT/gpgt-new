-- Debug HubSpot Access Issue
-- This script will help identify and fix the 406 errors

-- 1. First, let's check if the tables exist and have data
SELECT 'hubspot_connections' as table_name, COUNT(*) as row_count FROM public.hubspot_connections
UNION ALL
SELECT 'hubspot_sync_settings' as table_name, COUNT(*) as row_count FROM public.hubspot_sync_settings
UNION ALL
SELECT 'hubspot_sync_logs' as table_name, COUNT(*) as row_count FROM public.hubspot_sync_logs
UNION ALL
SELECT 'teams' as table_name, COUNT(*) as row_count FROM public.teams
UNION ALL
SELECT 'team_members' as table_name, COUNT(*) as row_count FROM public.team_members;

-- 2. Check if the specific team exists
SELECT * FROM public.teams WHERE id = '0cef0867-1b40-4de1-9936-16b867a753d7';

-- 3. Check team members for this team
SELECT * FROM public.team_members WHERE team_id = '0cef0867-1b40-4de1-9936-16b867a753d7';

-- 4. Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'hubspot_%' AND schemaname = 'public';

-- 5. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE 'hubspot_%' AND schemaname = 'public';

-- 6. Temporarily disable RLS to test
ALTER TABLE public.hubspot_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_contact_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_deal_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_sync_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_sync_settings DISABLE ROW LEVEL SECURITY;

-- 7. Create default sync settings for the specific team
INSERT INTO public.hubspot_sync_settings (team_id)
VALUES ('0cef0867-1b40-4de1-9936-16b867a753d7')
ON CONFLICT (team_id) DO NOTHING;

-- 8. Test direct access to the tables
SELECT * FROM public.hubspot_connections WHERE team_id = '0cef0867-1b40-4de1-9936-16b867a753d7';
SELECT * FROM public.hubspot_sync_settings WHERE team_id = '0cef0867-1b40-4de1-9936-16b867a753d7';
SELECT * FROM public.hubspot_sync_logs WHERE team_id = '0cef0867-1b40-4de1-9936-16b867a753d7' ORDER BY created_at DESC LIMIT 1; 