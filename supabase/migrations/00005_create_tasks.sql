CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_id UUID,
  status_id UUID NOT NULL REFERENCES task_statuses(id) ON DELETE RESTRICT,
  priority_id UUID NOT NULL REFERENCES task_priorities(id) ON DELETE RESTRICT,
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
