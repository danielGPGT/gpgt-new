-- Create team_invitations table for team onboarding
CREATE TABLE IF NOT EXISTS team_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    email text NOT NULL,
    token text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'member',
    invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_team_email_invite UNIQUE (team_id, email)
);

-- Index for quick lookup by token
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

-- Index for quick lookup by team
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);

-- Index for quick lookup by email
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email); 