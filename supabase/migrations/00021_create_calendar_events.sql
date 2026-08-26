CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  end_date DATE,
  end_time TIME,
  type TEXT NOT NULL DEFAULT 'event',
  entity_type TEXT,
  entity_id UUID,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
