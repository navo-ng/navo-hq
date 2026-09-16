-- 00059: Schema completions (audit P1/P2) — safe on live data.
-- Skips anything whose table doesn't exist (e.g. decision_votes/standups
-- if migrations 00030/00040 were never applied — run those files first).

-- ============================================================
-- 1. Repoint user FKs at profiles(id) so PostgREST embeds work.
--    Values are identical (profiles.id references auth.users(id)).
-- ============================================================
DO $$
DECLARE
  c RECORD;
BEGIN
  -- task_attachments.user_id -> profiles(id)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_attachments') THEN
    FOR c IN SELECT conname FROM pg_constraint
             WHERE conrelid = 'public.task_attachments'::regclass AND contype = 'f'
    LOOP
      EXECUTE format('ALTER TABLE public.task_attachments DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;
    ALTER TABLE public.task_attachments
      ADD CONSTRAINT task_attachments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- audit_log.user_id -> profiles(id)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
    FOR c IN SELECT conname FROM pg_constraint
             WHERE conrelid = 'public.audit_log'::regclass AND contype = 'f'
    LOOP
      EXECUTE format('ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;
    ALTER TABLE public.audit_log
      ADD CONSTRAINT audit_log_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- decision_votes.user_id -> profiles(id) (only if table exists)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decision_votes') THEN
    FOR c IN SELECT conname FROM pg_constraint
             WHERE conrelid = 'public.decision_votes'::regclass AND contype = 'f'
    LOOP
      EXECUTE format('ALTER TABLE public.decision_votes DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;
    ALTER TABLE public.decision_votes
      ADD CONSTRAINT decision_votes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  ELSE
    RAISE NOTICE 'decision_votes missing — run migration 00030 first, then re-run this block';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'standups') THEN
    RAISE NOTICE 'standups missing — run migration 00040';
  END IF;
END $$;

-- ============================================================
-- 2. Missing UPDATE/DELETE policies (legit features locked out)
-- ============================================================
DROP POLICY IF EXISTS "Users can update own external calendars" ON external_calendars;
CREATE POLICY "Users can update own external calendars" ON external_calendars
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own standups" ON standups;
CREATE POLICY "Users can delete own standups" ON standups
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON project_templates;
CREATE POLICY "Users can update own templates" ON project_templates
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own preferences" ON notification_preferences;
CREATE POLICY "Users can delete own preferences" ON notification_preferences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "document_versions_update_admin" ON document_versions;
CREATE POLICY "document_versions_update_admin" ON document_versions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

DROP POLICY IF EXISTS "document_versions_delete_admin" ON document_versions;
CREATE POLICY "document_versions_delete_admin" ON document_versions
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  );

-- ============================================================
-- 3. Template SELECTs: members-only (were anon-readable)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read templates" ON task_templates;
CREATE POLICY "Members can read templates" ON task_templates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view all templates" ON project_templates;
CREATE POLICY "Members can view templates" ON project_templates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view all task set templates" ON task_set_templates;
CREATE POLICY "Members can view task set templates" ON task_set_templates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own task set templates" ON task_set_templates;
CREATE POLICY "Users can update own task set templates" ON task_set_templates
  FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete own task set templates" ON task_set_templates;
CREATE POLICY "Users can delete own task set templates" ON task_set_templates
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- ============================================================
-- 4. Indexes: FK child columns + entity lookups (IF NOT EXISTS)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status_id);
CREATE INDEX IF NOT EXISTS idx_decisions_owner ON decisions(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_uploader ON document_versions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_calendar_events_creator ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_entity ON calendar_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocked_by ON task_dependencies(blocked_by_task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_linked ON task_links(linked_task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_task ON task_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checklists_task ON task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_user ON task_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_external_calendars_user ON external_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_task_set_templates_creator ON task_set_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ============================================================
-- 5. CHECK constraints (skipped with NOTICE if violating rows exist)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM time_entries WHERE minutes <= 0) THEN
    ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_minutes_positive;
    ALTER TABLE time_entries ADD CONSTRAINT time_entries_minutes_positive CHECK (minutes > 0);
  ELSE
    RAISE NOTICE 'time_entries has non-positive rows — skipping CHECK, clean data first';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_links') THEN
    IF NOT EXISTS (SELECT 1 FROM task_links WHERE task_id = linked_task_id) THEN
      ALTER TABLE task_links DROP CONSTRAINT IF EXISTS task_links_no_self_link;
      ALTER TABLE task_links ADD CONSTRAINT task_links_no_self_link CHECK (task_id != linked_task_id);
    ELSE
      RAISE NOTICE 'task_links has self-links — skipping CHECK, clean data first';
    END IF;
  END IF;
END $$;

-- ============================================================
-- 6. Storage: attachments bucket + policies (uploads break on fresh
--    projects without this — bucket currently exists only manually)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "attachments_public_read" ON storage.objects;
CREATE POLICY "attachments_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments_auth_insert" ON storage.objects;
CREATE POLICY "attachments_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments_auth_update" ON storage.objects;
CREATE POLICY "attachments_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'attachments')
  WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments_auth_delete" ON storage.objects;
CREATE POLICY "attachments_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'attachments');
