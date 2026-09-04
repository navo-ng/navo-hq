"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import ReportTabs from "@/components/reports/ReportTabs";
import { TrendingUp, Award, Zap } from "lucide-react";

interface RawTask {
  completed_at: string | null;
  created_at: string;
}

interface WeekData {
  week: string;
  label: string;
  completed: number;
  created: number;
}

function getWeekLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weeksAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return getWeekStart(d);
}

export default function VelocityPage() {
  const [tasks, setTasks] = useState<RawTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const twelveWeeks = weeksAgo(12);
      const twelveWeeksStr = twelveWeeks.toISOString();

      const [completedRes, createdRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("completed_at")
          .eq("is_archived", false)
          .not("completed_at", "is", null)
          .gte("completed_at", twelveWeeksStr),
        supabase
          .from("tasks")
          .select("created_at")
          .eq("is_archived", false)
          .gte("created_at", twelveWeeksStr),
      ]);

      const allTasks: RawTask[] = [];
      for (const row of completedRes.data || []) {
        allTasks.push({ completed_at: row.completed_at, created_at: "" });
      }
      for (const row of createdRes.data || []) {
        allTasks.push({ completed_at: null, created_at: row.created_at });
      }

      setTasks(allTasks);
      setIsLoading(false);
    };

    load();
  }, [supabase]);

  const weeklyData = useMemo(() => {
    const weeks: WeekData[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = weeksAgo(i);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      const completed = tasks.filter((t) => {
        if (!t.completed_at) return false;
        const d = t.completed_at.split("T")[0];
        return d >= startStr && d < endStr;
      }).length;

      const created = tasks.filter((t) => {
        if (!t.created_at) return false;
        const d = t.created_at.split("T")[0];
        return d >= startStr && d < endStr;
      }).length;

      weeks.push({
        week: startStr,
        label: getWeekLabel(start),
        completed,
        created,
      });
    }
    return weeks;
  }, [tasks]);

  const avgVelocity = useMemo(() => {
    const total = weeklyData.reduce((s, w) => s + w.completed, 0);
    return weeklyData.length > 0 ? total / weeklyData.length : 0;
  }, [weeklyData]);

  const bestWeek = useMemo(() => {
    let max = 0;
    let label = "N/A";
    for (const w of weeklyData) {
      if (w.completed > max) {
        max = w.completed;
        label = w.label;
      }
    }
    return { count: max, label };
  }, [weeklyData]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      if (weeklyData[i].completed > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [weeklyData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track team productivity and performance.</p>
        </div>
        <ReportTabs />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navo-blue/10 text-navo-blue">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Velocity</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{avgVelocity.toFixed(1)} / week</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
              <Award size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Best Week</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {bestWeek.count} tasks <span className="text-xs font-normal text-gray-400">({bestWeek.label})</span>
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Streak</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{currentStreak} weeks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Tasks Completed per Week</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#0064F0"
              strokeWidth={2}
              dot={{ fill: "#0064F0", r: 4 }}
              activeDot={{ r: 6 }}
              name="Completed"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Completed vs Created per Week</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
            />
            <Legend />
            <Bar dataKey="completed" fill="#0064F0" radius={[4, 4, 0, 0]} name="Completed" />
            <Bar dataKey="created" fill="#93C5FD" radius={[4, 4, 0, 0]} name="Created" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
