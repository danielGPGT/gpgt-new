-- Add team_quotes feature flag to team_features table
-- This controls whether users can view all team quotes or just their own

-- Insert the feature for all existing teams (enabled by default)
INSERT INTO team_features (team_id, feature_name, enabled)
SELECT id, 'team_quotes', true
FROM teams
WHERE id NOT IN (
  SELECT team_id 
  FROM team_features 
  WHERE feature_name = 'team_quotes'
);

-- Example: Disable team quotes access for a specific team
-- UPDATE team_features 
-- SET enabled = false 
-- WHERE team_id = 'your-team-id-here' AND feature_name = 'team_quotes';

-- Example: Enable team quotes access for a specific team
-- INSERT INTO team_features (team_id, feature_name, enabled)
-- VALUES ('your-team-id-here', 'team_quotes', true)
-- ON CONFLICT (team_id, feature_name) 
-- DO UPDATE SET enabled = true; 