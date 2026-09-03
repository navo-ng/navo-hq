CREATE TABLE standups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  today_doing TEXT NOT NULL DEFAULT '',
  today_done TEXT NOT NULL DEFAULT '',
  blockers TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE standups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all standups"
  ON standups FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own standups"
  ON standups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own standups"
  ON standups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_standups_user_id ON standups(user_id);
CREATE INDEX idx_standups_created_at ON standups(created_at DESC);
