"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CommentWithUser,
  fetchComments,
  createComment,
} from "@/lib/data/comments";
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";

interface CommentThreadProps {
  entityType: string;
  entityId: string;
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

export function CommentThread({ entityType, entityId }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

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
    } else {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
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
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          disabled={sending}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50"
        />
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
