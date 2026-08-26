export interface DecisionStatusConfig {
  id: string;
  name: string;
  color: string;
}

export interface DecisionUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Decision {
  id: string;
  title: string;
  topic: string | null;
  context: string | null;
  proposed_decision: string | null;
  decision_text: string | null;
  reason: string | null;
  alternatives: string | null;
  creator_id: string;
  owner_id: string | null;
  project_id: string | null;
  status_id: string;
  decided_at: string | null;
  superseded_by: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  creator?: DecisionUser;
  owner?: DecisionUser | null;
  project?: { id: string; name: string } | null;
  status?: DecisionStatusConfig;
  contributors?: { user: DecisionUser; contribution: string | null }[];
  tags?: { id: string; name: string; color: string }[];
}

export interface CreateDecisionInput {
  title: string;
  topic?: string;
  context?: string;
  proposed_decision?: string;
  decision_text?: string;
  reason?: string;
  alternatives?: string;
  owner_id?: string;
  project_id?: string;
  status_id: string;
  contributor_ids?: string[];
  tag_ids?: string[];
}
