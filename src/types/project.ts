export interface ProjectStatusConfig {
  id: string;
  name: string;
  color: string;
}

export interface ProjectUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ProjectTag {
  id: string;
  name: string;
  color: string;
}

export interface ProjectMember {
  user_id: string;
  role: string;
  joined_at: string;
  user?: ProjectUser;
}

export interface ProjectTaskStats {
  total: number;
  done: number;
  in_progress: number;
  blocked: number;
  overdue: number;
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
  owner?: ProjectUser | null;
  status?: ProjectStatusConfig;
  members?: ProjectMember[];
  tags?: ProjectTag[];
  task_stats?: ProjectTaskStats;
  health?: "green" | "yellow" | "red";
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  owner_id: string;
  status_id: string;
  start_date?: string;
  target_date?: string;
  member_ids?: string[];
  tag_ids?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  owner_id?: string;
  status_id?: string;
  start_date?: string;
  target_date?: string;
}
