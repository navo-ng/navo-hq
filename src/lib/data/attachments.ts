import { SupabaseClient } from "@supabase/supabase-js";

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  file_url: string;
  created_at: string;
  user?: { id: string; name: string; avatar_url: string | null };
}

export async function fetchAttachments(supabase: SupabaseClient, taskId: string): Promise<TaskAttachment[]> {
  const { data, error } = await supabase
    .from("task_attachments")
    .select("*, user:profiles!task_attachments_user_id_fkey(id, name, avatar_url)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) { console.error("Error fetching attachments:", error); return []; }
  return (data || []).map((row) => ({
    id: row.id,
    task_id: row.task_id,
    user_id: row.user_id,
    file_name: row.file_name,
    file_size: row.file_size,
    file_type: row.file_type,
    file_url: row.file_url,
    created_at: row.created_at,
    user: row.user as TaskAttachment["user"],
  }));
}

export async function uploadAttachment(
  supabase: SupabaseClient,
  taskId: string,
  file: File
): Promise<TaskAttachment | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const filePath = `task-attachments/${taskId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return null;
  }

  const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: taskId,
      user_id: userId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: urlData.publicUrl,
    })
    .select("*, user:profiles!task_attachments_user_id_fkey(id, name, avatar_url)")
    .single();

  if (error) { console.error("Error saving attachment:", error); return null; }

  return {
    id: data.id,
    task_id: data.task_id,
    user_id: data.user_id,
    file_name: data.file_name,
    file_size: data.file_size,
    file_type: data.file_type,
    file_url: data.file_url,
    created_at: data.created_at,
    user: data.user as TaskAttachment["user"],
  };
}

export async function deleteAttachment(supabase: SupabaseClient, attachmentId: string, fileUrl: string): Promise<boolean> {
  const urlParts = fileUrl.split("/attachments/");
  if (urlParts[1]) {
    await supabase.storage.from("attachments").remove([urlParts[1]]);
  }
  const { error } = await supabase.from("task_attachments").delete().eq("id", attachmentId);
  return !error;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
