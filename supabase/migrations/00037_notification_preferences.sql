CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  task_assigned BOOLEAN DEFAULT true,
  task_status_changed BOOLEAN DEFAULT true,
  task_commented BOOLEAN DEFAULT true,
  project_added BOOLEAN DEFAULT true,
  decision_voted BOOLEAN DEFAULT true,
  dependency_added BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);
