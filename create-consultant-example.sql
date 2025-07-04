-- Example: Create a sales consultant directly in the database
-- Replace the values with your actual data

-- 1. First, ensure you have a team
INSERT INTO teams (id, name, owner_id) 
VALUES (
  'your-team-id-here', 
  'Your Team Name', 
  'your-user-id-here'
) ON CONFLICT (id) DO NOTHING;

-- 2. Create a team member with 'sales' role
INSERT INTO team_members (
  team_id,
  user_id,
  email,
  name,
  role,
  status
) VALUES (
  'your-team-id-here',
  'consultant-user-id-here',
  'consultant@example.com',
  'John Consultant',
  'sales',
  'active'
);

-- 3. Verify the consultant was created
SELECT 
  tm.id,
  tm.name,
  tm.email,
  tm.role,
  tm.status,
  t.name as team_name
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
WHERE tm.role = 'sales' 
AND tm.status = 'active'; 