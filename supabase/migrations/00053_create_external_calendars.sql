CREATE TABLE external_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE external_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own external calendars" ON external_calendars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own external calendars" ON external_calendars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own external calendars" ON external_calendars FOR DELETE USING (auth.uid() = user_id);
