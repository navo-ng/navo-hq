"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import ReportTabs from "@/components/reports/ReportTabs";
import { Calendar, ListChecks, Target } from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
}

interface BurndownPoint {
  date: string;
  label: string;
  ideal: number;
  actual: number;
}

export default function BurndownPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [taskData, setTaskData] = useState<{
    id: string;
    status_id: string;
    completed_at: string | null;
    created_at: string;
  }[]>([]);
  const [doneStatusId, setDoneStatusId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const [projectRes, statusRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name")
          .eq("is_archived", false)
          .order("name"),
        supabase
          .from("task_statuses")
          .select("id")
          .eq("name", "Done")
          .single(),
      ]);

      setProjects((projectRes.data || []).map((p) => ({ id: p.id, name: p.name })));
      setDoneStatusId(statusRes.data?.id || "");
      setIsProjectLoading(false);
    };

    load();
  }, [supabase]);

  useEffect(() => {
    if (!selectedProjectId) {
      setTaskData([]);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("tasks")
        .select("id, status_id, completed_at, created_at")
        .eq("project_id", selectedProjectId)
        .eq("is_archived", false);

      setTaskData(
        (data || []).map((row) => ({
          id: row.id,
          status_id: row.status_id,
          completed_at: row.completed_at as string | null,
          created_at: row.created_at,
        }))
      );
      setIsLoading(false);
    };

    load();
  }, [selectedProjectId, supabase]);

  const burndownData = useMemo<BurndownPoint[]>(() => {
    if (taskData.length === 0) return [];

    const createdDates = taskData.map((t) => t.created_at.split("T")[0]);
    const completedDates = taskData
      .filter((t) => t.completed_at)
      .map((t) => t.completed_at!.split("T")[0]);

    const allDates = [...createdDates, ...completedDates].sort();
    if (allDates.length === 0) return [];

    const startDate = allDates[0];
    const totalTasks = taskData.length;

    const endDate = new Date();
    const endStr = endDate.toISOString().split("T")[0];
    const latestDate = allDates[allDates.length - 1];
    const finalEnd = endStr > latestDate ? endStr : latestDate;

    const days: string[] = [];
    const current = new Date(startDate + "T00:00:00");
    const final = new Date(finalEnd + "T00:00:00");
    while (current <= final) {
      days.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    const totalDays = days.length - 1 || 1;
    let completed = 0;

    return days.map((day, i) => {
      const completedOnDay = completedDates.filter((d) => d === day).length;
      completed += completedOnDay;
      const remaining = totalTasks - completed;

      return {
        date: day,
        label: new Date(day + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ideal: Math.round(((totalDays - i) / totalDays) * totalTasks * 10) / 10,
        actual: remaining,
      };
    });
  }, [taskData]);

  const stats = useMemo(() => {
    if (taskData.length === 0) {
      return { daysRemaining: 0, tasksRemaining: 0, projectedCompletion: "N/A" };
    }

    const total = taskData.length;
    const done = taskData.filter((t) => t.status_id === doneStatusId).length;
    const remaining = total - done;

    const completedTasks = taskData.filter((t) => t.completed_at);
    if (completedTasks.length === 0 || done === 0) {
      return { daysRemaining: 0, tasksRemaining: remaining, projectedCompletion: "N/A" };
    }

    const firstCompletion = new Date(
      Math.min(...completedTasks.map((t) => new Date(t.completed_at!).getTime()))
    );
    const daysSinceStart = Math.max(
      1,
      (Date.now() - firstCompletion.getTime()) / (1000 * 60 * 60 * 24)
    );
    const velocity = done / daysSinceStart;
    const daysLeft = velocity > 0 ? Math.ceil(remaining / velocity) : 0;

    const projected = new Date();
    projected.setDate(projected.getDate() + daysLeft);

    return {
      daysRemaining: daysLeft,
      tasksRemaining: remaining,
      projectedCompletion: projected.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  }, [taskData, doneStatusId]);

  if (isProjectLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track team productivity and performance.</p>
        </div>
        <ReportTabs />
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

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project:</label>
        <select
          value={selectedProjectId}
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setIsLoading(true);
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedProjectId ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">Select a project to view its burndown chart.</p>
        </div>
      ) : isLoading ? (
        <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900" />
      ) : taskData.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">No tasks found for this project.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navo-blue/10 text-navo-blue">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Est. Days Remaining</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.daysRemaining}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <ListChecks size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Remaining</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.tasksRemaining}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                  <Target size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Projected Completion</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.projectedCompletion}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Burndown Chart</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  stroke="#9CA3AF"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="Ideal"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#0064F0"
                  strokeWidth={2}
                  dot={{ fill: "#0064F0", r: 3 }}
                  activeDot={{ r: 6 }}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
