-- ============================================================
-- FUNCTION: handle_new_user()
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  ON CONFLICT (id) DO NOTHING
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: assign_first_user_owner()
-- ============================================================
CREATE OR REPLACE FUNCTION assign_first_user_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  owner_role_id UUID;
  member_role_id UUID;
  user_count BIGINT;
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('assign_first_user_owner'));

  SELECT id INTO owner_role_id FROM roles WHERE name = 'owner' LIMIT 1;
  SELECT id INTO member_role_id FROM roles WHERE name = 'member' LIMIT 1;

  SELECT COUNT(*) INTO user_count FROM profiles WHERE role_id IS NOT NULL;

  IF user_count = 0 AND owner_role_id IS NOT NULL THEN
    UPDATE profiles SET role_id = owner_role_id WHERE id = NEW.id;
  ELSIF member_role_id IS NOT NULL THEN
    UPDATE profiles SET role_id = member_role_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_assign_owner
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_first_user_owner();

-- ============================================================
-- FUNCTION: update_updated_at()
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_team_settings_updated_at
  BEFORE UPDATE ON team_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: log_task_activity()
-- ============================================================
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    INSERT INTO activities (user_id, entity_type, entity_id, action, old_value, new_value)
    VALUES (
      auth.uid(),
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
      auth.uid(),
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
      auth.uid(),
      'task',
      NEW.id,
      'completed',
      jsonb_build_object('completed_at', NEW.completed_at)
    );
  END IF;

  IF OLD.is_archived = false AND NEW.is_archived = true THEN
    INSERT INTO activities (user_id, entity_type, entity_id, action)
    VALUES (auth.uid(), 'task', NEW.id, 'archived');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_updated
  AFTER UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_activity();
