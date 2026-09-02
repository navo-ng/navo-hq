"use client";

import { ActivityWithUser } from "@/types/activity";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface ActivityFeedProps {
  activities: ActivityWithUser[];
  showEntity?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  status_changed: "changed status of",
  assigned: "assigned",
  unassigned: "unassigned",
  commented: "commented on",
  completed: "completed",
};

const ENTITY_LABELS: Record<string, string> = {
  task: "Task",
  project: "Project",
  decision: "Decision",
  document: "Document",
  comment: "Comment",
  team_member: "Team member",
};

export function ActivityFeed({ activities, showEntity = true }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navo-blue/10 text-xs font-bold text-navo-blue">
            {activity.user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-white">
                {activity.user?.name || "Unknown"}
              </span>{" "}
              {ACTION_LABELS[activity.action] || activity.action}{" "}
              {showEntity && (
                <>
                  <Badge color="#6B7280">
                    {ENTITY_LABELS[activity.entity_type] || activity.entity_type}
                  </Badge>{" "}
                </>
              )}
            </p>
            {activity.metadata && typeof activity.metadata === "object" && "name" in activity.metadata && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {(activity.metadata as Record<string, unknown>).name as string}
              </p>
            )}
          </div>
          <span className="flex-shrink-0 text-xs text-gray-400">
            {formatRelativeTime(activity.created_at)}
          </span>
        </div>
      ))}
    </div>
  );
}
