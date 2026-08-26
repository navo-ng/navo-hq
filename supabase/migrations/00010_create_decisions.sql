CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT,
  context TEXT,
  proposed_decision TEXT,
  decision_text TEXT,
  reason TEXT,
  alternatives TEXT,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status_id UUID NOT NULL REFERENCES decision_statuses(id) ON DELETE RESTRICT,
  decided_at DATE,
  superseded_by UUID REFERENCES decisions(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
