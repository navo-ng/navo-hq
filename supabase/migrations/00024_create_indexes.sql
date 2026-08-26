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
