-- Function to find duplicate clients by email within the same team
CREATE OR REPLACE FUNCTION find_duplicate_clients_by_email()
RETURNS TABLE (
  team_id UUID,
  email TEXT,
  client_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c1.team_id,
    c1.email,
    array_agg(c1.id ORDER BY c1.created_at) as client_ids
  FROM clients c1
  WHERE c1.email IS NOT NULL 
    AND c1.team_id IS NOT NULL
  GROUP BY c1.team_id, c1.email
  HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint to prevent future duplicates
-- This will fail if duplicates already exist, so we need to clean them first
-- ALTER TABLE clients ADD CONSTRAINT unique_email_per_team UNIQUE (team_id, email); 