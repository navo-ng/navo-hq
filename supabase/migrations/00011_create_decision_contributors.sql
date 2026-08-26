CREATE TABLE decision_contributors (
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contribution TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (decision_id, user_id)
);
