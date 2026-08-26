export type { Database } from "./database";

export type UserRole = "owner" | "admin" | "member" | "viewer";

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "blocked"
  | "review"
  | "done";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

export type DecisionStatus =
  | "proposed"
  | "under_discussion"
  | "approved"
  | "rejected"
  | "superseded";

export type DocumentStatus = "draft" | "in_review" | "approved" | "archived";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  creator_id: string;
  project_id: string | null;
  status_id: string;
  priority_id: string;
  due_date: string | null;
  start_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status_id: string;
  start_date: string | null;
  target_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  title: string;
  topic: string | null;
  description: string | null;
  decision_text: string;
  reason: string | null;
  alternatives: string | null;
  status_id: string;
  owner_id: string | null;
  project_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  author_id: string;
  owner_id: string;
  version: string;
  status_id: string;
  file_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  category: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  created_by: string;
  created_at: string;
}
