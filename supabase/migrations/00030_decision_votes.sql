CREATE TABLE IF NOT EXISTS decision_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(decision_id, user_id)
);

ALTER TABLE decision_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes for decisions"
  ON decision_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own vote"
  ON decision_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vote"
  ON decision_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote"
  ON decision_votes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_decision_votes_decision_id ON decision_votes(decision_id);
