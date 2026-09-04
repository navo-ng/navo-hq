CREATE TABLE task_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all checklists" ON task_checklists FOR SELECT USING (true);
CREATE POLICY "Users can manage checklists" ON task_checklists FOR ALL USING (true);
CREATE INDEX idx_task_checklists_task ON task_checklists(task_id, position);
