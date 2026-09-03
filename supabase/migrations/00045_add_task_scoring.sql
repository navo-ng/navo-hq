ALTER TABLE tasks ADD COLUMN impact_score INTEGER DEFAULT 3 CHECK (impact_score >= 1 AND impact_score <= 5);
ALTER TABLE tasks ADD COLUMN effort_score INTEGER DEFAULT 3 CHECK (effort_score >= 1 AND effort_score <= 5);
