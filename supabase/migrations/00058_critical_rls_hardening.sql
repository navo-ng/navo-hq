-- 00058: Critical RLS hardening (audit P0)
-- Safe to run on live data: only replaces policies/functions, touches no rows.

-- ============================================================
-- 1. profiles: block self-promotion (WITH CHECK on role_id)
-- ============================================================
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON profiles;

-- Members can update their OWN row but may not change role_id.
-- (Inner SELECT uses the permissive SELECT policy, so no recursion issue.)
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role_id = (SELECT role_id FROM profiles WHERE id = auth.uid())
  );

-- Owners/admins keep full update rights.
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
  )
  WITH CHECK (true);

-- ============================================================
-- 2. tasks_insert: close viewer standalone-insert loophole
-- ============================================================
DROP POLICY IF EXISTS "tasks_insert_editor" ON tasks;

CREATE POLICY "tasks_insert_editor" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR check_project_permission(auth.uid(), project_id, 'editor')
    OR (
      project_id IS NULL
      AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
        SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
      ))
    )
  );

-- ============================================================
-- 3. task_checklists: replace world-writable policies
-- ============================================================
DROP POLICY IF EXISTS "Users can view all checklists" ON task_checklists;
DROP POLICY IF EXISTS "Users can manage checklists" ON task_checklists;

CREATE POLICY "checklists_select_members" ON task_checklists
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "checklists_insert_editors" ON task_checklists
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_id AND (
        check_project_permission(auth.uid(), t.project_id, 'editor')
        OR (t.project_id IS NULL AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
            SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
          )
        ))
      )
    )
  );

CREATE POLICY "checklists_update_editors" ON task_checklists
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_checklists.task_id AND (
        check_project_permission(auth.uid(), t.project_id, 'editor')
        OR (t.project_id IS NULL AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
            SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
          )
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_checklists.task_id AND (
        check_project_permission(auth.uid(), t.project_id, 'editor')
        OR (t.project_id IS NULL AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
            SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
          )
        ))
      )
    )
  );

CREATE POLICY "checklists_delete_editors" ON task_checklists
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_checklists.task_id AND (
        check_project_permission(auth.uid(), t.project_id, 'editor')
        OR (t.project_id IS NULL AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
            SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
          )
        ))
      )
    )
  );

-- ============================================================
-- 4. task_links: replace world-writable policies (scoped on task_id)
-- ============================================================
DROP POLICY IF EXISTS "Users can view all task links" ON task_links;
DROP POLICY IF EXISTS "Users can manage task links" ON task_links;

CREATE POLICY "task_links_select_members" ON task_links
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_links_insert_editors" ON task_links
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_id AND (
        check_project_permission(auth.uid(), t.project_id, 'editor')
        OR (t.project_id IS NULL AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
            SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
          )
        ))
      )
    )
  );

CREATE POLICY "task_links_update_editors" ON task_links
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_links.task_id AND (
        check_project_permission(auth.uid(), t.project_id, 'editor')
        OR (t.project_id IS NULL AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
            SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
          )
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_links.task_id AND (
        check_project_permission(auth.uid(), t.project_id, 'editor')
        OR (t.project_id IS NULL AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
            SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
          )
        ))
      )
    )
  );

CREATE POLICY "task_links_delete_editors" ON task_links
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_links.task_id AND (
        check_project_permission(auth.uid(), t.project_id, 'editor')
        OR (t.project_id IS NULL AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
            SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
          )
        ))
      )
    )
  );

-- ============================================================
-- 5. email_digests: replace misleading public policy (self-read only;
--    service role bypasses RLS for cron writes)
-- ============================================================
DROP POLICY IF EXISTS "Service role can manage digests" ON email_digests;

CREATE POLICY "email_digests_select_own" ON email_digests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 6. custom_fields: schema edits owner/admin; values member+
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage field definitions" ON custom_field_definitions;
DROP POLICY IF EXISTS "Anyone can read field definitions" ON custom_field_definitions;
DROP POLICY IF EXISTS "Authenticated users can manage field values" ON custom_field_values;
DROP POLICY IF EXISTS "Anyone can read field values" ON custom_field_values;

CREATE POLICY "field_definitions_select" ON custom_field_definitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "field_definitions_manage_admin" ON custom_field_definitions
  FOR ALL TO authenticated
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

CREATE POLICY "field_values_select" ON custom_field_values
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "field_values_write_members" ON custom_field_values
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
    ))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin', 'member')
    ))
  );

-- ============================================================
-- 7. push_subscriptions: allow re-subscribe (UPDATE on own rows)
-- ============================================================
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. Client-write tables: allow authenticated inserts.
--    NOTE (trust model): notifications/activities are created FOR other
--    users by the actor's client (assignee alerts, comment fan-out), so
--    the check cannot be auth.uid()=user_id. 5-person trusted team:
--    any member may append; nothing may UPDATE/DELETE except owners
--    via existing policies. Revisit with service-role writes if needed.
-- ============================================================
DROP POLICY IF EXISTS "notifications_insert_members" ON notifications;
CREATE POLICY "notifications_insert_members" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "activities_insert_members" ON activities;
CREATE POLICY "activities_insert_members" ON activities
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "audit_log_insert_members" ON audit_log;
CREATE POLICY "audit_log_insert_members" ON audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 9. log_task_activity: never abort the parent UPDATE when there is
--    no attributable user (seeds, service_role, cron, direct SQL)
-- ============================================================
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID;
BEGIN
  v_actor := COALESCE(auth.uid(), NEW.creator_id, NEW.owner_id);
  IF v_actor IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    INSERT INTO activities (user_id, entity_type, entity_id, action, old_value, new_value)
    VALUES (
      v_actor,
      'task',
      NEW.id,
      'status_changed',
      jsonb_build_object('status_id', OLD.status_id),
      jsonb_build_object('status_id', NEW.status_id)
    );
  END IF;

  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    INSERT INTO activities (user_id, entity_type, entity_id, action, old_value, new_value)
    VALUES (
      v_actor,
      'task',
      NEW.id,
      'assigned',
      jsonb_build_object('owner_id', OLD.owner_id),
      jsonb_build_object('owner_id', NEW.owner_id)
    );
  END IF;

  IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
    INSERT INTO activities (user_id, entity_type, entity_id, action, new_value)
    VALUES (
      v_actor,
      'task',
      NEW.id,
      'completed',
      jsonb_build_object('completed_at', NEW.completed_at)
    );
  END IF;

  IF OLD.is_archived = false AND NEW.is_archived = true THEN
    INSERT INTO activities (user_id, entity_type, entity_id, action)
    VALUES (v_actor, 'task', NEW.id, 'archived');
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 10. Harden SECURITY DEFINER helpers with explicit search_path
-- ============================================================
ALTER FUNCTION check_project_permission(UUID, UUID, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION get_project_role(UUID, UUID) SET search_path = public, pg_temp;
