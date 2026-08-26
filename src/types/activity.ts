export interface Activity {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ActivityWithUser extends Activity {
  user?: ActivityUser;
}
