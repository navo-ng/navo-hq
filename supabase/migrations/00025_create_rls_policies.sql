-- ============================================================
-- ROLES
-- ============================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select_authenticated" ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "roles_insert_owner" ON roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name = 'owner'
    ))
  );

CREATE POLICY "roles_update_owner" ON roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name = 'owner'
    ))
  );

CREATE POLICY "roles_delete_owner" ON roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name = 'owner'
    ))
  );

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT TO authenticated USING (true);

-- NO INSERT POLICY — profiles are created by handle_new_user() trigger only

CREATE POLICY "profiles_update_self_or_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

CREATE POLICY "profiles_delete_owner" ON profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name = 'owner'
    ))
  );

-- ============================================================
-- TASK STATUSES
-- ============================================================
ALTER TABLE task_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_statuses_select_authenticated" ON task_statuses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_statuses_manage_admin" ON task_statuses
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- TASK PRIORITIES
-- ============================================================
ALTER TABLE task_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_priorities_select_authenticated" ON task_priorities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_priorities_manage_admin" ON task_priorities
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- TASKS
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_members" ON tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_insert_members" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "tasks_update_admin_or_creator_or_owner" ON tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR creator_id = auth.uid()
    OR owner_id = auth.uid()
  );

CREATE POLICY "tasks_delete_admin" ON tasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- PROJECT STATUSES
-- ============================================================
ALTER TABLE project_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_statuses_select_authenticated" ON project_statuses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "project_statuses_manage_admin" ON project_statuses
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- PROJECTS
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_members" ON projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "projects_insert_members" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "projects_update_admin_or_owner" ON projects
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR owner_id = auth.uid()
  );

CREATE POLICY "projects_delete_admin" ON projects
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_members_select_members" ON project_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "project_members_manage_admin" ON project_members
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- DECISION STATUSES
-- ============================================================
ALTER TABLE decision_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decision_statuses_select_authenticated" ON decision_statuses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "decision_statuses_manage_admin" ON decision_statuses
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- DECISIONS
-- ============================================================
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decisions_select_members" ON decisions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "decisions_insert_members" ON decisions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "decisions_update_admin_or_creator" ON decisions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR creator_id = auth.uid()
    OR owner_id = auth.uid()
  );

CREATE POLICY "decisions_delete_admin" ON decisions
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- DECISION CONTRIBUTORS
-- ============================================================
ALTER TABLE decision_contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decision_contributors_select_members" ON decision_contributors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "decision_contributors_manage_admin" ON decision_contributors
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- DOCUMENT STATUSES
-- ============================================================
ALTER TABLE document_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_statuses_select_authenticated" ON document_statuses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "document_statuses_manage_admin" ON document_statuses
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- DOCUMENTS
-- ============================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_members" ON documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "documents_insert_members" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "documents_update_admin_or_owner" ON documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR owner_id = auth.uid()
    OR author_id = auth.uid()
  );

CREATE POLICY "documents_delete_admin" ON documents
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- DOCUMENT VERSIONS
-- ============================================================
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_versions_select_members" ON document_versions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "document_versions_insert_members" ON document_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
    ))
  );

-- ============================================================
-- TAGS
-- ============================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_select_authenticated" ON tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tags_manage_admin" ON tags
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- TAG JUNCTION TABLES
-- ============================================================
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- task_tags
CREATE POLICY "task_tags_select_members" ON task_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_tags_insert_admin_or_task_owner" ON task_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND (creator_id = auth.uid() OR owner_id = auth.uid()))
  );

CREATE POLICY "task_tags_delete_admin_or_task_owner" ON task_tags
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND (creator_id = auth.uid() OR owner_id = auth.uid()))
  );

-- project_tags
CREATE POLICY "project_tags_select_members" ON project_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "project_tags_insert_admin_or_project_owner" ON project_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  );

CREATE POLICY "project_tags_delete_admin_or_project_owner" ON project_tags
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  );

-- decision_tags
CREATE POLICY "decision_tags_select_members" ON decision_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "decision_tags_insert_admin_or_decision_owner" ON decision_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (SELECT 1 FROM decisions WHERE id = decision_id AND (creator_id = auth.uid() OR owner_id = auth.uid()))
  );

CREATE POLICY "decision_tags_delete_admin_or_decision_owner" ON decision_tags
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (SELECT 1 FROM decisions WHERE id = decision_id AND (creator_id = auth.uid() OR owner_id = auth.uid()))
  );

-- document_tags
CREATE POLICY "document_tags_select_members" ON document_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "document_tags_insert_admin_or_document_owner" ON document_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (SELECT 1 FROM documents WHERE id = document_id AND (author_id = auth.uid() OR owner_id = auth.uid()))
  );

CREATE POLICY "document_tags_delete_admin_or_document_owner" ON document_tags
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (SELECT 1 FROM documents WHERE id = document_id AND (author_id = auth.uid() OR owner_id = auth.uid()))
  );

-- ============================================================
-- TASK DEPENDENCIES
-- ============================================================
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_dependencies_select_members" ON task_dependencies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_dependencies_manage_admin_or_task_owner" ON task_dependencies
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND (creator_id = auth.uid() OR owner_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM tasks WHERE id = blocked_by_id AND (creator_id = auth.uid() OR owner_id = auth.uid()))
  );

-- ============================================================
-- ACTIVITIES
-- ============================================================
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select_members" ON activities
  FOR SELECT TO authenticated USING (true);

-- INSERT handled by service role or database triggers only

-- ============================================================
-- COMMENTS
-- ============================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_members" ON comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "comments_insert_members" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "comments_update_self" ON comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "comments_delete_self_or_admin" ON comments
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_self" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- NO INSERT POLICY — notifications are created by server-side mechanisms only

CREATE POLICY "notifications_update_self" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_self" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_select_members" ON calendar_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "calendar_events_insert_members" ON calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "calendar_events_update_creator_or_admin" ON calendar_events
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

CREATE POLICY "calendar_events_delete_creator_or_admin" ON calendar_events
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- TEAM SETTINGS
-- ============================================================
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_settings_select_authenticated" ON team_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "team_settings_manage_admin" ON team_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- USER SETTINGS
-- ============================================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_self" ON user_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_self" ON user_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_self" ON user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_delete_self" ON user_settings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
