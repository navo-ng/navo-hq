"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchTaskActivities } from "@/lib/data/activities";
import type { ActivityWithUser } from "@/types/activity";
import {
  Plus, Pencil, ArrowRightLeft, UserPlus, MessageSquare,
  CheckCircle, Clock, Tag, Paperclip, Archive, RotateCcw
} from "lucide-react";

function getActionIcon(action: string) {
  switch (action) {
    case "create": return <Plus size={14} />;
    case "update": return <Pencil size={14} />;
    case "status_change": return <ArrowRightLeft size={14} />;
    case "assign": return <UserPlus size={14} />;
    case "comment": return <MessageSquare size={14} />;
    case "complete": return <CheckCircle size={14} />;
    case "log_time": return <Clock size={14} />;
    case "tag": return <Tag size={14} />;
    case "attach": return <Paperclip size={14} />;
    case "archive": return <Archive size={14} />;
    case "restore": return <RotateCcw size={14} />;
    default: return <Pencil size={14} />;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "create": return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    case "complete": return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "archive": return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    case "comment": return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

function formatAction(activity: ActivityWithUser): string {
  const meta = activity.metadata as Record<string, unknown> | null;
  switch (activity.action) {
    case "create": return "created this task";
    case "update": return meta?.field ? `updated ${String(meta.field)}` : "updated this task";
    case "status_change": return meta?.new_value ? `changed status to ${String(meta.new_value)}` : "changed status";
    case "assign": return meta?.new_value ? `assigned to ${String(meta.new_value)}` : "reassigned";
    case "comment": return "added a comment";
    case "complete": return "completed this task";
    case "log_time": return meta?.minutes ? `logged ${Number(meta.minutes)}m` : "logged time";
    case "archive": return "archived this task";
    case "restore": return "restored this task";
    default: return activity.action.replace(/_/g, " ");
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

interface TaskActivityTimelineProps {
  taskId: string;
}

export function TaskActivityTimeline({ taskId }: TaskActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchTaskActivities(supabase, taskId);
      if (!cancelled) {
        setActivities(data);
        setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase, taskId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-2 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-400 dark:bg-gray-800/50">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-200 dark:bg-gray-700" />
      {activities.map((activity) => (
        <div key={activity.id} className="relative flex gap-3 py-3">
          <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getActionColor(activity.action)}`}>
            {getActionIcon(activity.action)}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="font-medium">{activity.user?.name || "Someone"}</span>{" "}
              {formatAction(activity)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {formatTime(activity.created_at)}
            </p>
            {activity.old_value && activity.new_value && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="line-through">{String(activity.old_value)}</span>
                {" → "}
                <span className="font-medium">{String(activity.new_value)}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
