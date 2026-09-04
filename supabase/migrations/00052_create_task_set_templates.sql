CREATE TABLE task_set_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  tasks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_set_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all task set templates" ON task_set_templates FOR SELECT USING (true);
CREATE POLICY "Users can create task set templates" ON task_set_templates FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own task set templates" ON task_set_templates FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own task set templates" ON task_set_templates FOR DELETE USING (auth.uid() = creator_id);
