"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CommentWithUser,
  fetchComments,
  createComment,
} from "@/lib/data/comments";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { notifyMentionedUsers } from "@/lib/utils/mentions";
import { createNotification } from "@/lib/data/create-notification";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";

interface CommentThreadProps {
  entityType: string;
  entityId: string;
}

interface ProfileUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navo-blue text-xs font-medium text-white">
      {initials}
    </div>
  );
}

function parseMentions(text: string): React.ReactNode[] {
  const mentionRegex = /@([A-Za-z0-9 ]+?)(?=\s|$)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={`mention-${match.index}`}
        className="text-navo-blue font-medium"
      >
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function CommentThread({ entityType, entityId }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { showToast } = useToast();

  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user?.id ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    fetchComments(supabase, entityType, entityId).then((c) => {
      setComments(c);
      setLoading(false);
    });
  }, [supabase, entityType, entityId]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .order("name")
      .then(({ data }) => {
        if (data) setUsers(data);
      });
  }, [supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionQuery]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursorPos = e.target.selectionStart;
      setNewComment(value);

      const textBeforeCursor = value.slice(0, cursorPos);
      const mentionMatch = textBeforeCursor.match(/@([A-Za-z0-9 ]*)$/);

      if (mentionMatch) {
        setMentionQuery(mentionMatch[1]);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
        setMentionQuery("");
      }
    },
    []
  );

  const insertMention = useCallback(
    (name: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = newComment.slice(0, cursorPos);
      const textAfterCursor = newComment.slice(cursorPos);
      const mentionMatch = textBeforeCursor.match(/@([A-Za-z0-9 ]*)$/);

      if (mentionMatch) {
        const beforeMention = textBeforeCursor.slice(
          0,
          mentionMatch.index
        );
        const newText = `${beforeMention}@${name} ${textAfterCursor}`;
        setNewComment(newText);
        setShowMentionDropdown(false);
        setMentionQuery("");

        setTimeout(() => {
          const newCursorPos = beforeMention.length + name.length + 2;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    },
    [newComment]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showMentionDropdown || filteredUsers.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
      } else if (e.key === "Enter" && showMentionDropdown) {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex].name);
      } else if (e.key === "Escape") {
        setShowMentionDropdown(false);
      }
    },
    [showMentionDropdown, filteredUsers, mentionIndex, insertMention]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(e.target as Node)
      ) {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || sending) return;

    const optimistic: CommentWithUser = {
      id: `temp-${Date.now()}`,
      user_id: currentUser ?? "",
      entity_type: entityType,
      entity_id: entityId,
      content: text,
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: currentUser
        ? { id: currentUser, name: "You", email: "", avatar_url: null }
        : undefined,
    };

    setComments((prev) => [...prev, optimistic]);
    setNewComment("");
    setSending(true);

    const created = await createComment(supabase, entityType, entityId, text);
    if (created) {
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? created : c))
      );
      showToast({ title: MESSAGES.COMMENT_POSTED, type: "success" });

      const { data: actorProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", currentUser)
        .single();

      const actorName = actorProfile?.name || "Someone";

      await notifyMentionedUsers(
        supabase,
        text,
        entityType,
        entityId,
        currentUser || "",
        actorName
      );

      const { data: otherCommenters } = await supabase
        .from("comments")
        .select("user_id")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .neq("user_id", currentUser)
        .order("created_at", { ascending: false });

      const uniqueUserIds = [
        ...new Set((otherCommenters || []).map((c) => c.user_id)),
      ];

      for (const uid of uniqueUserIds) {
        await createNotification({
          supabase,
          userId: uid,
          type: "comment",
          title: "New comment",
          message: `${actorName} commented on ${entityType}`,
          entityType,
          entityId,
        });
      }

      if (uniqueUserIds.length > 0) {
        showToast({ title: MESSAGES.COMMENT_NOTIFICATION_SENT, type: "success" });
      }
    } else {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      showToast({ title: MESSAGES.NETWORK_ERROR, type: "error" });
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800 w-3/4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 px-4 py-8 text-center dark:bg-gray-800/50">
          <MessageSquare
            size={24}
            className="mb-2 text-gray-300 dark:text-gray-600"
          />
          <p className="text-sm text-gray-400">No comments yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => {
            const isOwn = comment.user_id === currentUser;
            return (
              <div key={comment.id} className="flex gap-3">
                <UserAvatar
                  name={comment.user?.name || comment.user?.email || "U"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {isOwn ? "You" : comment.user?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(comment.created_at)}
                      {comment.is_edited && " (edited)"}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
                    {parseMentions(comment.content)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment... Use @ to mention"
            disabled={sending}
            rows={1}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50"
          />
          {showMentionDropdown && filteredUsers.length > 0 && (
            <div
              ref={mentionDropdownRef}
              className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              {filteredUsers.map((user, idx) => (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(user.name);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    idx === mentionIndex
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }`}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navo-blue text-[10px] font-medium text-white">
                    {user.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <span className="text-gray-900 dark:text-white">
                    {user.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!newComment.trim() || sending}
        >
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}
