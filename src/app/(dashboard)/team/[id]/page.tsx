"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, Briefcase, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityGraph } from "@/components/team/ActivityGraph";
import { RoleManager } from "@/components/team/RoleManager";
import { RemoveMemberDialog } from "@/components/team/RemoveMemberDialog";
import { TeamMember } from "@/types/team";
import { ActivityWithUser } from "@/types/activity";
import { Task } from "@/types/task";
import { createClient } from "@/lib/supabase/client";
import { fetchTeam } from "@/lib/data/team";
import { fetchActivities } from "@/lib/data/activities";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
}

function getStatusColor(name: string): string {
  const map: Record<string, string> = {
    "To Do": "#6b7280",
    "In Progress": "#f59e0b",
    "Done": "#10b981",
    "Blocked": "#ef4444",
  };
  return map[name] || "#6b7280";
}

export default function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { role: currentUserRole, userId: currentUserId, loading: userLoading } = useCurrentUser();
  const isOwner = currentUserRole === "owner";
  const [member, setMember] = useState<TeamMember | null>(null);
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [teamData, activityData] = await Promise.all([
        fetchTeam(supabase),
        fetchActivities(supabase, { limit: 200 }),
      ]);

      const found = teamData.find((m) => m.id === id);
      const userActivities = activityData.filter((a) => a.user_id === id);

      const { data: taskData } = await supabase
        .from("tasks")
        .select("*, owner:profiles!tasks_owner_id_fkey(id, name, email, avatar_url), status:task_statuses(id, name, color), priority:task_priorities(id, name, color), project:projects(id, name)")
        .eq("owner_id", id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!cancelled) {
        setMember(found || null);
        setActivities(userActivities);
        if (taskData) {
          setTasks(taskData.map((t: Record<string, unknown>) => ({
            ...t,
            owner: t.owner ? { id: (t.owner as Record<string,unknown>).id, name: (t.owner as Record<string,unknown>).name, email: (t.owner as Record<string,unknown>).email, avatar_url: (t.owner as Record<string,unknown>).avatar_url } : null,
            status: t.status ? { id: (t.status as Record<string,unknown>).id, name: (t.status as Record<string,unknown>).name, color: (t.status as Record<string,unknown>).color } : undefined,
            priority: t.priority ? { id: (t.priority as Record<string,unknown>).id, name: (t.priority as Record<string,unknown>).name, color: (t.priority as Record<string,unknown>).color } : undefined,
            project: t.project ? { id: (t.project as Record<string,unknown>).id, name: (t.project as Record<string,unknown>).name } : null,
          })) as unknown as Task[]);
        }
        setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase, id]);

  if (isLoading || userLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900" />
        <div className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-6">
        <Link href="/team" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <ArrowLeft size={14} />
          Team
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Member not found.</p>
        </div>
      </div>
    );
  }

  const recentActivity = activities.slice(0, 8);

  return (
    <div className="space-y-6">
      <Link
        href="/team"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={14} />
        Team
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ backgroundColor: "#0064F0" }}
          >
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              member.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {member.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Mail size={14} />
                {member.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Joined {formatJoinDate(member.created_at)}
              </span>
            </div>
            {isOwner && member.id !== currentUserId && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RoleManager
                  userId={member.id}
                  currentRoleId={member.role_id || ""}
                  currentRoleName={member.role?.name}
                  userName={member.name}
                  isOwner={isOwner}
                  onRoleChanged={() => {
                    fetchTeam(supabase).then((teamData) => {
                      const updated = teamData.find((m) => m.id === id);
                      if (updated) setMember(updated);
                    });
                  }}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setRemoveDialogOpen(true)}
                >
                  <Trash2 size={14} />
                  Remove
                </Button>
              </div>
            )}
            {!isOwner && member.role && (
              <div className="mt-3">
                <Badge color="#0064F0">{member.role.name}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <ActivityGraph activities={activities} />

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center gap-2">
          <Briefcase size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Recent Tasks
          </h3>
        </div>
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {task.project?.name || "No project"}
                  </p>
                </div>
                {task.status && (
                  <Badge color={getStatusColor(task.status.name)}>
                    {task.status.name}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-navo-blue" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{activity.action}</span>{" "}
                    {activity.entity_type}
                    {activity.metadata && (activity.metadata as Record<string,unknown>).entityName
                      ? `: ${(activity.metadata as Record<string,unknown>).entityName}`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwner && member.id !== currentUserId && (
        <RemoveMemberDialog
          open={removeDialogOpen}
          onClose={() => setRemoveDialogOpen(false)}
          userId={member.id}
          userName={member.name}
          onRemoved={() => {
            window.location.href = "/team";
          }}
        />
      )}
    </div>
  );
}
