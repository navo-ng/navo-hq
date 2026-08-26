# NAVO HQ — Database Migration Plan

**Status:** APPROVED WITH REVISIONS — PENDING EXECUTION
**Date:** 2025-08-24
**Phase:** 2 — Database Architecture

---

## MIGRATION STRUCTURE

```
supabase/migrations/
├── 00001_create_roles.sql
├── 00002_create_profiles.sql
├── 00003_create_task_statuses.sql
├── 00004_create_task_priorities.sql
├── 00005_create_tasks.sql
├── 00006_create_project_statuses.sql
├── 00007_create_projects.sql
├── 00008_create_project_members.sql
├── 00009_create_decision_statuses.sql
├── 00010_create_decisions.sql
├── 00011_create_decision_contributors.sql
├── 00012_create_document_statuses.sql
├── 00013_create_documents.sql
├── 00014_create_document_versions.sql
├── 00015_create_tags.sql
├── 00016_create_junction_tables.sql
├── 00017_create_task_dependencies.sql
├── 00018_create_activities.sql
├── 00019_create_comments.sql
├── 00020_create_notifications.sql
├── 00021_create_calendar_events.sql
├── 00022_create_team_settings.sql
├── 00023_create_user_settings.sql
├── 00024_create_indexes.sql
├── 00025_create_rls_policies.sql
├── 00026_create_triggers_functions.sql
└── 00027_seed_data.sql
```

---

## MIGRATION DETAILS

---

### 00001_create_roles.sql

**Creates:** `roles`

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Seed:** See 00027

---

### 00002_create_profiles.sql

**Creates:** `profiles`

**Notes:**
- `email` is DENORMALIZED from auth.users for query convenience only
- NOT an independent authentication source of truth
- Synchronized via database trigger (see 00026)
- Normal users cannot change their authentication email through profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**ON DELETE:** CASCADE — if auth user is deleted, profile is deleted.

---

### 00003_create_task_statuses.sql

**Creates:** `task_statuses`

```sql
CREATE TABLE task_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00004_create_task_priorities.sql

**Creates:** `task_priorities`

```sql
CREATE TABLE task_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00005_create_tasks.sql

**Creates:** `tasks`

**Notes:**
- No progress column — derived from tasks in application layer
- `creator_id` ON DELETE RESTRICT — don't delete users who created tasks
- `owner_id` ON DELETE SET NULL — if assignee deleted, task remains unassigned
- `project_id` ON DELETE SET NULL — if project deleted, tasks remain
- `status_id` ON DELETE RESTRICT — don't delete statuses in use
- `priority_id` ON DELETE RESTRICT — don't delete priorities in use

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_id UUID,
  status_id UUID NOT NULL REFERENCES task_statuses(id) ON DELETE RESTRICT,
  priority_id UUID NOT NULL REFERENCES task_priorities(id) ON DELETE RESTRICT,
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- project_id FK added after projects table is created (00007)
```

---

### 00006_create_project_statuses.sql

**Creates:** `project_statuses`

```sql
CREATE TABLE project_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00007_create_projects.sql

**Creates:** `projects`

**Notes:**
- `owner_id` ON DELETE RESTRICT — don't delete users who own projects

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status_id UUID NOT NULL REFERENCES project_statuses(id) ON DELETE RESTRICT,
  start_date DATE,
  target_date DATE,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now add tasks.project_id FK
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
```

---

### 00008_create_project_members.sql

**Creates:** `project_members`

```sql
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
```

---

### 00009_create_decision_statuses.sql

**Creates:** `decision_statuses`

```sql
CREATE TABLE decision_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00010_create_decisions.sql

**Creates:** `decisions`

**Notes:**
- `superseded_by` self-references decisions(id) ON DELETE SET NULL
- Decision history is NEVER physically deleted
- Use archival/status changes instead

```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT,
  context TEXT,
  proposed_decision TEXT,
  decision_text TEXT,
  reason TEXT,
  alternatives TEXT,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status_id UUID NOT NULL REFERENCES decision_statuses(id) ON DELETE RESTRICT,
  decided_at DATE,
  superseded_by UUID REFERENCES decisions(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00011_create_decision_contributors.sql

**Creates:** `decision_contributors`

```sql
CREATE TABLE decision_contributors (
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contribution TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (decision_id, user_id)
);
```

---

### 00012_create_document_statuses.sql

**Creates:** `document_statuses`

```sql
CREATE TABLE document_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00013_create_documents.sql

**Creates:** `documents`

**Notes:**
- `current_version_id` added after document_versions table is created
- Files stored in Supabase Storage, not PostgreSQL

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status_id UUID NOT NULL REFERENCES document_statuses(id) ON DELETE RESTRICT,
  current_version_id UUID,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00014_create_document_versions.sql

**Creates:** `document_versions`

**Notes:**
- IMMUTABLE after creation — no UPDATE or DELETE by normal users
- Each version has file_url in Supabase Storage
- CASCADE on document deletion

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Add current_version_id FK to documents
ALTER TABLE documents ADD CONSTRAINT fk_documents_current_version
  FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;
```

---

### 00015_create_tags.sql

**Creates:** `tags`

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, category)
);
```

---

### 00016_create_junction_tables.sql

**Creates:** `task_tags`, `project_tags`, `decision_tags`, `document_tags`

```sql
CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE project_tags (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE decision_tags (
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (decision_id, tag_id)
);

CREATE TABLE document_tags (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);
```

---

### 00017_create_task_dependencies.sql

**Creates:** `task_dependencies`

**Notes:**
- CHECK constraint prevents self-blocking
- Application must prevent circular dependency chains
- CASCADE on both sides

```sql
CREATE TABLE task_dependencies (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocked_by_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, blocked_by_id),
  CHECK (task_id != blocked_by_id)
);
```

---

### 00018_create_activities.sql

**Creates:** `activities`

**Notes:**
- IMMUTABLE — no UPDATE or DELETE by any authenticated user
- Polymorphic entity_type + entity_id
- Allowed entity_type values enforced at application boundary
- Activity creation via controlled server-side operations only

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00019_create_comments.sql

**Creates:** `comments`

**Notes:**
- Polymorphic entity_type + entity_id
- Allowed entity_type: 'task', 'project', 'decision', 'document'
- Users can edit their own comments
- No physical deletion — use archival

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00020_create_notifications.sql

**Creates:** `notifications`

**Notes:**
- Users can only read/update their own notifications
- System inserts via service role

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00021_create_calendar_events.sql

**Creates:** `calendar_events`

**Notes:**
- For non-task events only (meetings, milestones, launches)
- Tasks with due_dates appear in calendar via application query, not duplication

```sql
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
```

---

### 00022_create_team_settings.sql

**Creates:** `team_settings`

```sql
CREATE TABLE team_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 00023_create_user_settings.sql

**Creates:** `user_settings`

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);
```

---

### 00024_create_indexes.sql

**Creates:** All indexes

```sql
-- Tasks
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status_id);
CREATE INDEX idx_tasks_priority ON tasks(priority_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_is_archived ON tasks(is_archived) WHERE is_archived = false;
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- Projects
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status_id);
CREATE INDEX idx_projects_is_archived ON projects(is_archived) WHERE is_archived = false;

-- Decisions
CREATE INDEX idx_decisions_creator ON decisions(creator_id);
CREATE INDEX idx_decisions_owner ON decisions(owner_id);
CREATE INDEX idx_decisions_project ON decisions(project_id);
CREATE INDEX idx_decisions_status ON decisions(status_id);
CREATE INDEX idx_decisions_is_archived ON decisions(is_archived) WHERE is_archived = false;

-- Documents
CREATE INDEX idx_documents_author ON documents(author_id);
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_status ON documents(status_id);

-- Activities (polymorphic)
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

-- Comments (polymorphic)
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Calendar
CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX idx_calendar_events_type ON calendar_events(type);

-- Task Dependencies
CREATE INDEX idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_blocked_by ON task_dependencies(blocked_by_id);

-- Junction Tables
CREATE INDEX idx_task_tags_tag ON task_tags(tag_id);
CREATE INDEX idx_project_tags_tag ON project_tags(tag_id);
CREATE INDEX idx_decision_tags_tag ON decision_tags(tag_id);
CREATE INDEX idx_document_tags_tag ON document_tags(tag_id);
```

---

### 00025_create_rls_policies.sql

**Creates:** All RLS policies

**Design principles:**
- Every table has RLS enabled
- No generic "authenticated can do everything" policies
- Owner/Admin/Member/Viewer model enforced
- Activities are immutable (no UPDATE/DELETE for any user)
- Document versions are immutable after creation

```sql
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
-- Profile creation is handled exclusively by the handle_new_user()
-- trigger on auth.users. No client-side INSERT policy is needed.
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
-- IMMUTABLE — no UPDATE or DELETE policies
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
-- Granular policies: members can manage tags on entities they own/created
-- Read access is open for team visibility
-- ============================================================
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- task_tags: SELECT open, INSERT/DELETE require task ownership or admin
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

-- project_tags: SELECT open, INSERT/DELETE require project ownership or admin
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

-- decision_tags: SELECT open, INSERT/DELETE require decision ownership or admin
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

-- document_tags: SELECT open, INSERT/DELETE require document ownership or admin
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
-- IMMUTABLE — SELECT only, no INSERT/UPDATE/DELETE via RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select_members" ON activities
  FOR SELECT TO authenticated USING (true);

-- INSERT handled by service role or database triggers only
-- No UPDATE policy = immutable
-- No DELETE policy = immutable

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
-- Notifications are created only by controlled server-side mechanisms
-- (SECURITY DEFINER functions, service-role operations).
-- No client-side INSERT policy is needed.
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
```

---

### 00026_create_triggers_functions.sql

**Creates:** Database triggers and functions

```sql
-- ============================================================
-- FUNCTION: handle_new_user()
-- Creates a profile when a new user signs up via Supabase Auth
-- Race-condition resistant: uses INSERT ... ON CONFLICT DO NOTHING
-- SECURITY DEFINER with explicit search_path for safety
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

-- Trigger: create profile on auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: assign_first_user_owner()
-- Assigns owner role to the first user who signs up
-- Race-condition resistant: uses advisory lock
-- SECURITY DEFINER with explicit search_path for safety
-- ============================================================
CREATE OR REPLACE FUNCTION assign_first_user_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  owner_role_id UUID;
  user_count BIGINT;
BEGIN
  -- Only run if this user has no role yet
  IF NEW.role_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Use advisory lock to prevent concurrent first-user race condition
  -- Lock key: unique integer for this function
  PERFORM pg_advisory_xact_lock(hashtext('assign_first_user_owner'));

  -- Get the owner role ID
  SELECT id INTO owner_role_id FROM roles WHERE name = 'owner' LIMIT 1;

  -- Count existing users with roles (re-check after acquiring lock)
  SELECT COUNT(*) INTO user_count FROM profiles WHERE role_id IS NOT NULL;

  -- If this is the first user with no role, assign owner
  IF user_count = 0 AND owner_role_id IS NOT NULL THEN
    UPDATE profiles SET role_id = owner_role_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: assign owner role to first user
CREATE TRIGGER on_profile_created_assign_owner
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_first_user_owner();

-- ============================================================
-- FUNCTION: update_updated_at()
-- Automatically updates updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
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
-- Logs task changes to activities table
-- SECURITY DEFINER with explicit search_path for safety
-- ============================================================
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Log status changes
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

  -- Log assignment changes
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

  -- Log completion
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

  -- Log archival
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
```

---

### 00027_seed_data.sql

**Creates:** Seed data for all lookup tables

**Note:** All inserts use `ON CONFLICT DO NOTHING` for idempotency.

```sql
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
```

---

## REVISION NOTES

### 1. Profiles/Email
- `profiles.email` is DENORMALIZED from auth.users
- Synchronized via `handle_new_user()` trigger
- Normal users cannot change email through profiles
- Only owner/admin can update profiles via RLS

### 2. Activity/Activities
- Immutable — no UPDATE or DELETE policies
- Only SELECT allowed for authenticated users
- INSERT via triggers and service role only
- `log_task_activity()` trigger captures task state changes

### 3. Polymorphic Entity Types
- `entity_type` is TEXT, validated at application boundary
- Comments: 'task', 'project', 'decision', 'document'
- Activities: all entity types in NAVO HQ
- Notifications: all entity types
- Calendar events: optional entity reference

### 4. Project Progress
- NO progress column in projects table
- Derived from task completion in application queries
- Zero-task projects return NULL/0, not 100%

### 5. Decision History
- Never physically deleted
- `superseded_by` preserves replacement chain
- `is_archived` for hiding without deletion

### 6. Document Versions
- Immutable after creation (no UPDATE/DELETE policies)
- `documents.current_version_id` points to active version
- New version = new row + update current_version_id

### 7. Task Dependencies
- Self-reference CHECK constraint prevents self-blocking
- Application must prevent circular chains
- CASCADE on both sides

### 8. Security
- Every table has RLS enabled
- No generic permissive policies
- Activities: SELECT only (immutable)
- Document versions: SELECT + INSERT only (immutable)
- Owner/Admin/Member/Viewer model enforced

### 9. Owner Bootstrap
- `assign_first_user_owner()` trigger on profiles INSERT
- Race-condition resistant via subquery count
- Only assigns if no other users have roles yet

### 10. Migration Structure
- 27 migration files, ordered by dependency
- Logically grouped
- Foreign keys added in correct order
- ALTER TABLE for circular references deferred

---

## EXECUTION ORDER

1. 00001 — roles (no dependencies)
2. 00002 — profiles (depends on roles)
3. 00003 — task_statuses (no dependencies)
4. 00004 — task_priorities (no dependencies)
5. 00005 — tasks (depends on profiles, task_statuses, task_priorities)
6. 00006 — project_statuses (no dependencies)
7. 00007 — projects + ALTER tasks FK (depends on profiles, project_statuses)
8. 00008 — project_members (depends on projects, profiles)
9. 00009 — decision_statuses (no dependencies)
10. 00010 — decisions (depends on profiles, projects, decision_statuses)
11. 00011 — decision_contributors (depends on decisions, profiles)
12. 00012 — document_statuses (no dependencies)
13. 00013 — documents (depends on profiles, projects, document_statuses)
14. 00014 — document_versions + ALTER documents FK (depends on documents, profiles)
15. 00015 — tags (no dependencies)
16. 00016 — junction tables (depends on tasks, projects, decisions, documents, tags)
17. 00017 — task_dependencies (depends on tasks)
18. 00018 — activities (depends on profiles)
19. 00019 — comments (depends on profiles)
20. 00020 — notifications (depends on profiles)
21. 00021 — calendar_events (depends on profiles)
22. 00022 — team_settings (depends on profiles)
23. 00023 — user_settings (depends on profiles)
24. 00024 — indexes (all tables created)
25. 00025 — RLS policies (all tables created)
26. 00026 — triggers/functions (all tables created)
27. 00027 — seed data (all lookup tables created)

---

## WHAT IS NOT IN V1

- Multi-workspace/tenancy
- Complex RBAC beyond 4 fixed roles
- Workflow automation engine
- AI features
- Time tracking
- Recurring tasks
- Email notifications (in-app only)
- File storage UI (use Supabase dashboard)
- Activity table partitioning
- Manual progress override on projects
- Custom fields

---

**STOPPED. Migration plan produced. Awaiting review before execution.**
