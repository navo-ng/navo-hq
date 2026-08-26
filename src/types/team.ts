export interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: { id: string; name: string; description: string | null } | null;
}

export interface TeamRole {
  id: string;
  name: string;
  description: string | null;
  position: number;
}
