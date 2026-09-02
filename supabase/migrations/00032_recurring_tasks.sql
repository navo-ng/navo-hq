ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'biweekly', 'monthly')) DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
