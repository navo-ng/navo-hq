CREATE TABLE task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  linked_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'related',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, linked_task_id)
);

ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all task links" ON task_links FOR SELECT USING (true);
CREATE POLICY "Users can manage task links" ON task_links FOR ALL USING (true);
CREATE INDEX idx_task_links_task ON task_links(task_id);
