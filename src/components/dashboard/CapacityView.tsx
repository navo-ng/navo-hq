"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users } from "lucide-react";

interface CapacityMember {
  id: string;
  name: string;
  avatar_url: string | null;
  activeTasks: number;
  totalMinutes: number;
  capacity: number;
}

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
        {Math.round(pct)}%
      </span>
    </div>
  );
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

export function CapacityView() {
  const [members, setMembers] = useState<CapacityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .eq("is_active", true);

      if (!profiles) {
        setIsLoading(false);
        return;
      }

      const { data: tasks } = await supabase
        .from("tasks")
        .select("owner_id, status_id")
        .eq("is_archived", false);

      const { data: doneStatus } = await supabase
        .from("task_statuses")
        .select("id")
        .eq("name", "Done")
        .single();

      const doneStatusId = doneStatus?.id;

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("user_id, minutes")
        .gte("date", weekStart.toISOString().split("T")[0]);

      const memberData: CapacityMember[] = profiles.map((p) => {
        const activeTasks = (tasks || []).filter(
          (t) => t.owner_id === p.id && t.status_id !== doneStatusId
        ).length;

        const totalMinutes = (timeEntries || [])
          .filter((t) => t.user_id === p.id)
          .reduce((sum, t) => sum + (t.minutes || 0), 0);

        return {
          id: p.id,
          name: p.name || "Unknown",
          avatar_url: p.avatar_url,
          activeTasks,
          totalMinutes,
          capacity: 40,
        };
      });

      setMembers(memberData);
      setIsLoading(false);
    }
    load();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Team Capacity
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">(this week)</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {members.filter((m) => m.totalMinutes / 60 / m.capacity > 0.9).length} over 90%
        </span>
      </div>

      {members.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No team members found
        </p>
      ) : (
        <div className="space-y-4">
          {members
            .sort((a, b) => b.totalMinutes - a.totalMinutes)
            .map((m) => {
              const hoursUsed = m.totalMinutes / 60;
              return (
                <div key={m.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.name}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          {getInitials(m.name)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {m.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {hoursUsed.toFixed(1)}h / {m.capacity}h · {m.activeTasks} tasks
                    </span>
                  </div>
                  <CapacityBar used={hoursUsed} total={m.capacity} />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
