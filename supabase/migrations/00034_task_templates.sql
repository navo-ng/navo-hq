CREATE TABLE IF NOT EXISTS task_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  title TEXT NOT NULL,
  task_description TEXT,
  priority_name TEXT DEFAULT 'Medium',
  status_name TEXT DEFAULT 'To Do',
  recurrence TEXT DEFAULT 'none',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates" ON task_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create templates" ON task_templates FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own templates" ON task_templates FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own templates" ON task_templates FOR DELETE USING (auth.uid() = created_by);
