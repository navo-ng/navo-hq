export type TaskStatus = string;
export type TaskPriority = string;

export interface TaskStatusConfig {
  id: string;
  name: string;
  color: string;
}

export interface TaskPriorityConfig {
  id: string;
  name: string;
  color: string;
}

export interface TaskUser {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string;
}

export interface TaskProject {
  id: string;
  name: string;
}

export interface TaskTag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  owner_id: string | null;
  project_id: string | null;
  status_id: string;
  priority_id: string;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  is_archived: boolean;
  sort_order: number;
  recurrence: string | null;
  recurrence_end_date: string | null;
  created_at: string;
  updated_at: string;
  owner?: TaskUser | null;
  creator?: TaskUser;
  project?: TaskProject | null;
  tags?: TaskTag[];
  status?: TaskStatusConfig;
  priority?: TaskPriorityConfig;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  owner_id?: string;
  project_id?: string;
  status_id: string;
  priority_id: string;
  due_date?: string;
  tag_ids?: string[];
  recurrence?: string;
  recurrence_end_date?: string;
}
