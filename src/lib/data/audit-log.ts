import { SupabaseClient } from "@supabase/supabase-js";

export interface AuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: { id: string; name: string; email: string } | null;
}

export async function logAuditEntry(
  supabase: SupabaseClient,
  entry: {
    action: string;
    entity_type: string;
    entity_id?: string;
    entity_name?: string;
    old_value?: Record<string, unknown>;
    new_value?: Record<string, unknown>;
  }
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("audit_log").insert({
    user_id: userData.user?.id || null,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id || null,
    entity_name: entry.entity_name || null,
    old_value: entry.old_value || null,
    new_value: entry.new_value || null,
  });
  if (error) console.error("Audit log error:", error);
}

export async function fetchAuditLog(
  supabase: SupabaseClient,
  filters?: {
    entity_type?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<AuditEntry[]> {
  let query = supabase
    .from("audit_log")
    .select("*, user:profiles!audit_log_user_id_fkey(id, name, email)")
    .order("created_at", { ascending: false });

  if (filters?.entity_type)
    query = query.eq("entity_type", filters.entity_type);
  if (filters?.user_id) query = query.eq("user_id", filters.user_id);

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  if (filters?.offset !== undefined) {
    query = query.range(offset, offset + limit - 1);
  } else {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    action: r.action,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    entity_name: r.entity_name,
    old_value: r.old_value,
    new_value: r.new_value,
    ip_address: r.ip_address,
    created_at: r.created_at,
    user: r.user as AuditEntry["user"],
  }));
}
