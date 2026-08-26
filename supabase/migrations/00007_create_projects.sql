CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status_id UUID NOT NULL REFERENCES project_statuses(id) ON DELETE RESTRICT,
  start_date DATE,
  target_date DATE,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
