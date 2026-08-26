import { SupabaseClient } from "@supabase/supabase-js";

export interface Comment {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentWithUser extends Comment {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

const COMMENT_SELECT = `
  *,
  user:profiles!comments_user_id_fkey(id, name, email, avatar_url)
`;

function mapComment(row: Record<string, unknown>): CommentWithUser {
  const user = row.user as Record<string, unknown> | null;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    entity_type: row.entity_type as string,
    entity_id: row.entity_id as string,
    content: row.content as string,
    is_edited: row.is_edited as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user: user
      ? {
          id: user.id as string,
          name: user.name as string,
          email: user.email as string,
          avatar_url: user.avatar_url as string | null,
        }
      : undefined,
  };
}

export async function fetchComments(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string
): Promise<CommentWithUser[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return (data || []).map(mapComment);
}

export async function createComment(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string,
  content: string
): Promise<CommentWithUser | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("No authenticated user");
    return null;
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      content,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    return null;
  }

  return mapComment(data);
}

export async function updateComment(
  supabase: SupabaseClient,
  commentId: string,
  content: string
): Promise<CommentWithUser | null> {
  const { data, error } = await supabase
    .from("comments")
    .update({ content, is_edited: true })
    .eq("id", commentId)
    .select(COMMENT_SELECT)
    .single();

  if (error) {
    console.error("Error updating comment:", error);
    return null;
  }

  return mapComment(data);
}

export async function deleteComment(
  supabase: SupabaseClient,
  commentId: string
): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
  }
}
