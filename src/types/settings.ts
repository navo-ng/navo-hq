// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = string | number | boolean | null | { [key: string]: any } | any[];

export interface TeamSetting {
  id: string;
  key: string;
  value: Json;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSetting {
  id: string;
  user_id: string;
  key: string;
  value: Json;
  created_at: string;
  updated_at: string;
}
