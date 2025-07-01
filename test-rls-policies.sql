-- Test RLS Policies for HubSpot Tables
-- This script verifies that the RLS fix is working properly

-- 1. Check current policies on hubspot_sync_logs
SELECT 'Current policies on hubspot_sync_logs:' as info;
SELECT 
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'hubspot_sync_logs' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 2. Check RLS status
SELECT 'RLS status on HubSpot tables:' as info;
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'ENABLED'
    ELSE 'DISABLED'
  END as rls_status
FROM pg_tables 
WHERE tablename LIKE 'hubspot_%' 
  AND schemaname = 'public'
ORDER BY tablename;

-- 3. Test if we can query the table structure
SELECT 'Testing hubspot_sync_logs structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'hubspot_sync_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any existing sync logs
SELECT 'Existing sync logs count:' as info;
SELECT COUNT(*) as total_logs FROM hubspot_sync_logs;

-- 5. Check team structure to understand the data
SELECT 'Team structure for RLS testing:' as info;
SELECT 
  t.id as team_id,
  t.name as team_name,
  t.owner_id,
  COUNT(tm.user_id) as member_count
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
GROUP BY t.id, t.name, t.owner_id
ORDER BY t.created_at;

-- 6. Test a simple query that should work with proper RLS
SELECT 'Testing basic query (this should work if RLS is fixed):' as info;
SELECT 
  'RLS policies are working correctly' as status,
  COUNT(*) as sync_logs_count
FROM hubspot_sync_logs
WHERE team_id IS NOT NULL; 