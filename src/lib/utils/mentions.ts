import { SupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/data/create-notification";

/**
 * Extract @mention names from comment text.
 * Mentions are formatted as @Name (name can have spaces, e.g. @John Smith).
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([A-Za-z][A-Za-z0-9 ]*?)(?=\s@|\s*$)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].trim());
  }
  return [...new Set(mentions)]; // deduplicate
}

/**
 * Given a list of mention names, look up their profile IDs.
 */
export async function resolveMentionUserIds(
  supabase: SupabaseClient,
  names: string[]
): Promise<Map<string, string>> {
  if (names.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, name")
    .in("name", names);

  if (!data) return new Map();

  const map = new Map<string, string>();
  for (const profile of data) {
    map.set(profile.name, profile.id);
  }
  return map;
}

/**
 * Send notifications to all mentioned users.
 */
export async function notifyMentionedUsers(
  supabase: SupabaseClient,
  text: string,
  entityType: string,
  entityId: string,
  actorId: string,
  actorName: string
): Promise<void> {
  const names = extractMentions(text);
  if (names.length === 0) return;

  const userMap = await resolveMentionUserIds(supabase, names);

  for (const [name, userId] of userMap) {
    if (userId === actorId) continue; // don't notify yourself

    createNotification({
      supabase,
      userId,
      type: "mention",
      title: "You were mentioned",
      message: `${actorName} mentioned you in a comment`,
      entityType,
      entityId,
    });
  }
}
