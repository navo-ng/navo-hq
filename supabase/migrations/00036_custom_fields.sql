CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'project')),
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'checkbox')),
  options JSONB,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(field_id, entity_id)
);

ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read field definitions" ON custom_field_definitions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage field definitions" ON custom_field_definitions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can read field values" ON custom_field_values FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage field values" ON custom_field_values FOR ALL USING (auth.uid() IS NOT NULL);
