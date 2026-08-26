export interface DocumentStatusConfig {
  id: string;
  name: string;
  color: string;
}

export interface DocumentUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  file_name: string;
  file_size: number | null;
  uploaded_by: string;
  notes: string | null;
  created_at: string;
  uploader?: DocumentUser;
}

export interface DocDocument {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  author_id: string;
  owner_id: string;
  project_id: string | null;
  status_id: string;
  current_version_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  author?: DocumentUser;
  owner?: DocumentUser;
  project?: { id: string; name: string } | null;
  status?: DocumentStatusConfig;
  versions?: DocumentVersion[];
  tags?: { id: string; name: string; color: string }[];
}

export interface CreateDocumentInput {
  title: string;
  description?: string;
  category?: string;
  owner_id: string;
  project_id?: string;
  status_id: string;
  tag_ids?: string[];
}
