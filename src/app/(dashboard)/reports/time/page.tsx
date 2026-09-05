"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import ReportTabs from "@/components/reports/ReportTabs";
import {
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Download,
} from "lucide-react";
import { downloadCSV } from "@/lib/utils/csv-export";

interface TimeEntryRow {
  hours: number;
  date: string;
  description: string | null;
  task: { id: string; title: string; project: { id: string; name: string } | null } | null;
  user: { id: string; name: string } | null;
}

type FilterRange = "week" | "month" | "30days" | "all";

function getRangeDates(range: FilterRange): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let from: string;

  switch (range) {
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      from = d.toISOString().split("T")[0];
      break;
    }
    case "month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      from = d.toISOString().split("T")[0];
      break;
    }
    case "30days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      from = d.toISOString().split("T")[0];
      break;
    }
    case "all":
      from = "2020-01-01";
      break;
  }

  return { from, to };
}

const PIE_COLORS = ["#0064F0", "#32C85A", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

export default function TimeReportsPage() {
  const [range, setRange] = useState<FilterRange>("week");
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { from, to } = getRangeDates(range);

      const { data } = await supabase
        .from("time_entries")
        .select(
          "hours, date, description, task:tasks(id, title, project:projects(id, name)), user:profiles!time_entries_user_id_fkey(id, name)"
        )
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });

      // Map raw rows, converting minutes to hours
      const mapped: TimeEntryRow[] = (data || []).map((row: Record<string, unknown>) => {
        const rawHours = row.hours as number | null;
        const taskRaw = row.task as Record<string, unknown> | null;
        const projectRaw = taskRaw?.project as Record<string, unknown> | null;
        const userRaw = row.user as Record<string, unknown> | null;

        return {
          hours: rawHours != null ? rawHours / 60 : 0,
          date: row.date as string,
          description: row.description as string | null,
          task: taskRaw
            ? {
                id: taskRaw.id as string,
                title: taskRaw.title as string,
                project: projectRaw
                  ? { id: projectRaw.id as string, name: projectRaw.name as string }
                  : null,
              }
            : null,
          user: userRaw ? { id: userRaw.id as string, name: userRaw.name as string } : null,
        };
      });

      setEntries(mapped);
      setIsLoading(false);
    };

    load();
  }, [range, supabase]);

  const totalHours = useMemo(() => entries.reduce((s, e) => s + e.hours, 0), [entries]);

  const thisWeekHours = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const cutoff = weekAgo.toISOString().split("T")[0];
    return entries.filter((e) => e.date >= cutoff).reduce((s, e) => s + e.hours, 0);
  }, [entries]);

  const handleExport = () => {
    const headers = ["Task", "Member", "Hours", "Date"];
    const rows = entries.map((e) => [
      e.task?.title || "No Task",
      e.user?.name || "Unknown",
      String(Math.round(e.hours * 10) / 10),
      e.date,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(csv, `time-report-${range}.csv`);
  };

  const avgHoursPerDay = useMemo(() => {
    const uniqueDays = new Set(entries.map((e) => e.date)).size || 1;
    return totalHours / uniqueDays;
  }, [entries, totalHours]);

  const mostActiveMember = useMemo(() => {
    const map = new Map<string, { name: string; hours: number }>();
    for (const e of entries) {
      if (!e.user) continue;
      const existing = map.get(e.user.id);
      if (existing) {
        existing.hours += e.hours;
      } else {
        map.set(e.user.id, { name: e.user.name, hours: e.hours });
      }
    }
    let best = "";
    let maxH = 0;
    for (const [, v] of map) {
      if (v.hours > maxH) {
        maxH = v.hours;
        best = v.name;
      }
    }
    return best || "N/A";
  }, [entries]);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.date, (map.get(e.date) || 0) + e.hours);
    }
    const days: { date: string; label: string; hours: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      days.push({ date: key, label, hours: Math.round((map.get(key) || 0) * 10) / 10 });
    }
    return days;
  }, [entries]);

  const projectData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const name = e.task?.project?.name || "No Project";
      map.set(name, (map.get(name) || 0) + e.hours);
    }
    return Array.from(map.entries())
      .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours);
  }, [entries]);

  const memberData = useMemo(() => {
    const map = new Map<string, { name: string; tasks: Set<string>; totalHours: number; weekHours: number }>();
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekCutoff = weekAgo.toISOString().split("T")[0];

    for (const e of entries) {
      if (!e.user) continue;
      let entry = map.get(e.user.id);
      if (!entry) {
        entry = { name: e.user.name, tasks: new Set(), totalHours: 0, weekHours: 0 };
        map.set(e.user.id, entry);
      }
      entry.totalHours += e.hours;
      if (e.task) entry.tasks.add(e.task.id);
      if (e.date >= weekCutoff) entry.weekHours += e.hours;
    }

    return Array.from(map.values())
      .map((m) => ({
        ...m,
        totalHours: Math.round(m.totalHours * 10) / 10,
        weekHours: Math.round(m.weekHours * 10) / 10,
        taskCount: m.tasks.size,
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [entries]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track team productivity and performance.</p>
        </div>
        <ReportTabs />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track team productivity and performance.</p>
      </div>

      <ReportTabs />

      <div className="flex items-center gap-2">
        {(["week", "month", "30days", "all"] as FilterRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              range === r
                ? "bg-navo-blue text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {r === "week" && "This Week"}
            {r === "month" && "This Month"}
            {r === "30days" && "Last 30 Days"}
            {r === "all" && "All Time"}
          </button>
        ))}
        <button
          onClick={handleExport}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Clock size={20} />} label="This Week" value={`${thisWeekHours.toFixed(1)}h`} />
        <StatCard icon={<Calendar size={20} />} label="Total Hours" value={`${totalHours.toFixed(1)}h`} />
        <StatCard icon={<TrendingUp size={20} />} label="Avg / Day" value={`${avgHoursPerDay.toFixed(1)}h`} />
        <StatCard icon={<Users size={20} />} label="Most Active" value={mostActiveMember} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Hours per Day (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid var(--tooltip-border, #E5E7EB)" }}
                formatter={(value: any) => [`${value}h`, "Hours"]}
              />
              <Bar dataKey="hours" fill="#0064F0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Hours by Project</h2>
          {projectData.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No project data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="hours"
                  nameKey="name"
                >
                  {projectData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--tooltip-border, #E5E7EB)" }}
                  formatter={(value: any) => [`${value}h`, "Hours"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Member Breakdown</h2>
        </div>
        {memberData.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No time entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Member</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Tasks</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total Hours</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">This Week</th>
                </tr>
              </thead>
              <tbody>
                {memberData.map((m, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{m.name}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{m.taskCount}</td>
                    <td className="px-6 py-3 text-right text-gray-900 dark:text-white">{m.totalHours}h</td>
                    <td className="px-6 py-3 text-right text-gray-900 dark:text-white">{m.weekHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navo-blue/10 text-navo-blue">
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
