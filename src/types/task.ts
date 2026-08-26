export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "blocked"
  | "review"
  | "done";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskStatusConfig {
  id: TaskStatus;
  name: string;
  color: string;
  bg: string;
}

export interface TaskPriorityConfig {
  id: TaskPriority;
  name: string;
  color: string;
  bg: string;
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
  status_id: TaskStatus;
  priority_id: TaskPriority;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  owner?: TaskUser | null;
  creator?: TaskUser;
  project?: TaskProject | null;
  tags?: TaskTag[];
}

export const TASK_STATUSES: TaskStatusConfig[] = [
  { id: "backlog", name: "Backlog", color: "#9CA3AF", bg: "bg-gray-100 text-gray-600" },
  { id: "todo", name: "To Do", color: "#3B82F6", bg: "bg-blue-100 text-blue-700" },
  { id: "in_progress", name: "In Progress", color: "#F59E0B", bg: "bg-amber-100 text-amber-700" },
  { id: "blocked", name: "Blocked", color: "#EF4444", bg: "bg-red-100 text-red-700" },
  { id: "review", name: "Review", color: "#8B5CF6", bg: "bg-violet-100 text-violet-700" },
  { id: "done", name: "Done", color: "#10B981", bg: "bg-emerald-100 text-emerald-700" },
];

export const TASK_PRIORITIES: TaskPriorityConfig[] = [
  { id: "low", name: "Low", color: "#9CA3AF", bg: "bg-gray-100 text-gray-600" },
  { id: "medium", name: "Medium", color: "#3B82F6", bg: "bg-blue-100 text-blue-700" },
  { id: "high", name: "High", color: "#F59E0B", bg: "bg-amber-100 text-amber-700" },
  { id: "urgent", name: "Urgent", color: "#EF4444", bg: "bg-red-100 text-red-700" },
];

export function getStatusConfig(status: TaskStatus): TaskStatusConfig {
  return TASK_STATUSES.find((s) => s.id === status) || TASK_STATUSES[0];
}

export function getPriorityConfig(priority: TaskPriority): TaskPriorityConfig {
  return TASK_PRIORITIES.find((p) => p.id === priority) || TASK_PRIORITIES[0];
}
