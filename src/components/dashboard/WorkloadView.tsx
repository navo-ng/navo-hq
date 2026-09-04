"use client";

import { useMemo } from "react";
import { Task, TaskStatusConfig } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface WorkloadMember {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface WorkloadViewProps {
  tasks: Task[];
  members: WorkloadMember[];
  statuses: TaskStatusConfig[];
  onMemberClick?: (memberId: string) => void;
  thresholds?: { green: number; yellow: number };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getColor(count: number, max: number, thresholds: { green: number; yellow: number }) {
  if (count === 0) return { bar: "#9CA3AF", text: "text-gray-500 dark:text-gray-400" };
  if (count <= thresholds.green) return { bar: "#32C85A", text: "text-green-600 dark:text-green-400" };
  if (count <= thresholds.yellow) return { bar: "#F59E0B", text: "text-yellow-600 dark:text-yellow-400" };
  return { bar: "#EF4444", text: "text-red-600 dark:text-red-400" };
}

export function WorkloadView({
  tasks,
  members,
  statuses,
  onMemberClick,
  thresholds = { green: 3, yellow: 6 },
}: WorkloadViewProps) {
  const doneStatusId = useMemo(() => {
    const done = statuses.find((s) => s.name === "Done");
    return done?.id ?? null;
  }, [statuses]);

  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.is_archived && t.status_id !== doneStatusId),
    [tasks, doneStatusId]
  );

  const memberTaskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of activeTasks) {
      if (task.owner_id) {
        counts.set(task.owner_id, (counts.get(task.owner_id) || 0) + 1);
      }
    }
    return counts;
  }, [activeTasks]);

  const sortedMembers = useMemo(
    () =>
      [...members]
        .map((m) => ({ ...m, count: memberTaskCounts.get(m.id) || 0 }))
        .filter((m) => m.count > 0)
        .sort((a, b) => b.count - a.count),
    [members, memberTaskCounts]
  );

  const unassignedCount = useMemo(
    () => activeTasks.filter((t) => !t.owner_id).length,
    [activeTasks]
  );

  const maxCount = useMemo(() => {
    const memberMax = sortedMembers.length > 0 ? sortedMembers[0].count : 0;
    return Math.max(memberMax, unassignedCount, 1);
  }, [sortedMembers, unassignedCount]);

  const totalCount = activeTasks.length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Workload
        </h2>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {totalCount} active
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {members.length} members
          </span>
        </div>
      </div>

      {totalCount === 0 && members.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tasks to display.
        </p>
      ) : (
        <div className="space-y-1">
          {sortedMembers.map((member) => {
            const { bar } = getColor(member.count, maxCount, thresholds);
            const pct = Math.round((member.count / maxCount) * 100);

            return (
              <div
                key={member.id}
                onClick={onMemberClick ? () => onMemberClick(member.id) : undefined}
                role={onMemberClick ? "button" : undefined}
                tabIndex={onMemberClick ? 0 : undefined}
                onKeyDown={onMemberClick ? (e) => { if (e.key === "Enter" || e.key === " ") onMemberClick(member.id); } : undefined}
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                  onMemberClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" : ""
                }`}
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {getInitials(member.name)}
                  </div>
                )}

                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                  {member.name}
                </span>

                <div className="hidden w-32 sm:block">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: bar }}
                    />
                  </div>
                </div>

                <Badge color={bar}>{member.count}</Badge>
              </div>
            );
          })}

          {unassignedCount > 0 && (
            <div className="mt-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <AlertTriangle size={14} className="text-gray-400 dark:text-gray-500" />
                </div>

                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  Unassigned
                </span>

                <div className="hidden w-32 sm:block">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-gray-300 transition-all duration-300 dark:bg-gray-600"
                      style={{ width: `${Math.round((unassignedCount / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>

                <Badge>{unassignedCount}</Badge>
              </div>
            </div>
          )}

          {sortedMembers.length === 0 && unassignedCount === 0 && (
            <div className="flex items-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle size={14} />
              All tasks are completed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
