CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status_id UUID NOT NULL REFERENCES document_statuses(id) ON DELETE RESTRICT,
  current_version_id UUID,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
