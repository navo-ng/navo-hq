-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO roles (name, description, position) VALUES
  ('owner', 'Full system access. Can manage team, settings, and all content.', 1),
  ('admin', 'Can manage projects, tasks, team work, and most settings.', 2),
  ('member', 'Can create and update assigned work.', 3),
  ('viewer', 'Read-only access.', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TASK STATUSES
-- ============================================================
INSERT INTO task_statuses (name, color, position) VALUES
  ('Backlog', '#9CA3AF', 1),
  ('To Do', '#3B82F6', 2),
  ('In Progress', '#F59E0B', 3),
  ('Blocked', '#EF4444', 4),
  ('Review', '#8B5CF6', 5),
  ('Done', '#10B981', 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TASK PRIORITIES
-- ============================================================
INSERT INTO task_priorities (name, color, position) VALUES
  ('Low', '#9CA3AF', 1),
  ('Medium', '#3B82F6', 2),
  ('High', '#F59E0B', 3),
  ('Urgent', '#EF4444', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PROJECT STATUSES
-- ============================================================
INSERT INTO project_statuses (name, color, position) VALUES
  ('Planning', '#9CA3AF', 1),
  ('Active', '#3B82F6', 2),
  ('On Hold', '#F59E0B', 3),
  ('Completed', '#10B981', 4),
  ('Archived', '#6B7280', 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- DECISION STATUSES
-- ============================================================
INSERT INTO decision_statuses (name, color, position) VALUES
  ('Proposed', '#9CA3AF', 1),
  ('Under Discussion', '#3B82F6', 2),
  ('Approved', '#10B981', 3),
  ('Rejected', '#EF4444', 4),
  ('Superseded', '#6B7280', 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- DOCUMENT STATUSES
-- ============================================================
INSERT INTO document_statuses (name, color, position) VALUES
  ('Draft', '#9CA3AF', 1),
  ('In Review', '#3B82F6', 2),
  ('Approved', '#10B981', 3),
  ('Archived', '#6B7280', 4)
ON CONFLICT (name) DO NOTHING;
