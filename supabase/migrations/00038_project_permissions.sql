-- Update role constraint to use proper project roles
DO $$
BEGIN
  -- Drop old default and constraint if they exist
  ALTER TABLE project_members ALTER COLUMN role DROP DEFAULT;
  ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_role_check;

  -- Set new constraint
  ALTER TABLE project_members
    ALTER COLUMN role SET DEFAULT 'viewer';

  ALTER TABLE project_members
    ADD CONSTRAINT project_members_role_check CHECK (role IN ('viewer', 'editor', 'admin'));

  -- Migrate existing 'member' roles to 'editor'
  UPDATE project_members SET role = 'editor' WHERE role = 'member';
  -- Migrate existing 'owner' roles to 'admin'
  UPDATE project_members SET role = 'admin' WHERE role = 'owner';
END $$;

-- Helper function: check project-level permission
CREATE OR REPLACE FUNCTION check_project_permission(
  user_uuid UUID,
  project_uuid UUID,
  required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  is_owner BOOLEAN;
BEGIN
  -- App owner always has full access
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = user_uuid
      AND role_id = (SELECT id FROM roles WHERE name = 'owner')
  ) INTO is_owner;
  IF is_owner THEN RETURN TRUE; END IF;

  -- Check project membership
  SELECT role INTO user_role
  FROM project_members
  WHERE user_id = user_uuid AND project_id = project_uuid;

  IF user_role IS NULL THEN RETURN FALSE; END IF;

  -- Admin can do everything
  IF user_role = 'admin' THEN RETURN TRUE; END IF;

  -- Editor can view and edit
  IF user_role = 'editor' AND required_role IN ('viewer', 'editor') THEN RETURN TRUE; END IF;

  -- Viewer can only view
  IF user_role = 'viewer' AND required_role = 'viewer' THEN RETURN TRUE; END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: get a user's role on a project
CREATE OR REPLACE FUNCTION get_project_role(
  user_uuid UUID,
  project_uuid UUID
)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
  is_owner BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = user_uuid
      AND role_id = (SELECT id FROM roles WHERE name = 'owner')
  ) INTO is_owner;
  IF is_owner THEN RETURN 'owner'; END IF;

  SELECT role INTO user_role
  FROM project_members
  WHERE user_id = user_uuid AND project_id = project_uuid;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old overly-broad project_members policy
DROP POLICY IF EXISTS "project_members_manage_admin" ON project_members;

-- Project members: owners and app admins can manage
CREATE POLICY "project_members_manage_owner_or_admin" ON project_members
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR check_project_permission(auth.uid(), project_id, 'admin')
  );

-- Tasks: tighten insert to require editor or admin on the project
DROP POLICY IF EXISTS "tasks_insert_members" ON tasks;

CREATE POLICY "tasks_insert_editor" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR project_id IS NULL
    OR check_project_permission(auth.uid(), project_id, 'editor')
  );

-- Tasks: tighten update to require editor or admin on the project
DROP POLICY IF EXISTS "tasks_update_admin_or_creator_or_owner" ON tasks;

CREATE POLICY "tasks_update_editor_or_creator" ON tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR creator_id = auth.uid()
    OR owner_id = auth.uid()
    OR (project_id IS NOT NULL AND check_project_permission(auth.uid(), project_id, 'editor'))
  );

-- Tasks: tighten delete to require admin on the project
DROP POLICY IF EXISTS "tasks_delete_admin" ON tasks;

CREATE POLICY "tasks_delete_admin_or_creator" ON tasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (
      SELECT id FROM roles WHERE name IN ('owner', 'admin')
    ))
    OR creator_id = auth.uid()
    OR (project_id IS NOT NULL AND check_project_permission(auth.uid(), project_id, 'admin'))
  );
