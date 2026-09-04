"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTimeEntriesByTask,
  logTime,
  deleteTimeEntry,
  fetchTotalTimeByTask,
  TimeEntry,
} from "@/lib/data/time-entries";
import { Clock, Trash2, Plus } from "lucide-react";
import { Task } from "@/types/task";

interface TimeTrackerProps {
  taskId: string;
  task: Task;
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function TimeTracker({ taskId, task }: TimeTrackerProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (task?.active_timer_start) {
      setTimerRunning(true);
      setTimerStart(task.active_timer_start);
      const start = new Date(task.active_timer_start).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }
  }, [task?.active_timer_start]);

  useEffect(() => {
    if (!timerRunning || !timerStart) return;
    const interval = setInterval(() => {
      const start = new Date(timerStart).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerStart]);

  const handleStartTimer = async () => {
    const now = new Date().toISOString();
    await supabase.from("tasks").update({ active_timer_start: now }).eq("id", taskId);
    setTimerRunning(true);
    setTimerStart(now);
    setElapsed(0);
  };

  const handleStopTimer = async () => {
    const minutesTracked = Math.max(1, Math.round(elapsed / 60));
    await supabase.from("tasks").update({ active_timer_start: null }).eq("id", taskId);
    await logTime(supabase, taskId, minutesTracked, "Timer entry");
    setTimerRunning(false);
    setTimerStart(null);
    setElapsed(0);
    window.location.reload();
  };

  const formatElapsed = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [entriesData, totalData] = await Promise.all([
        fetchTimeEntriesByTask(supabase, taskId),
        fetchTotalTimeByTask(supabase, taskId),
      ]);
      if (!cancelled) {
        setEntries(entriesData);
        setTotalMinutes(totalData);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase, taskId]);

  const handleSave = async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const totalMin = h * 60 + m;
    if (totalMin <= 0) return;

    setSaving(true);
    const entry = await logTime(supabase, taskId, totalMin, description.trim() || undefined);
    setSaving(false);

    if (entry) {
      setEntries((prev) => [entry, ...prev]);
      setTotalMinutes((prev) => prev + totalMin);
      setHours("");
      setMinutes("");
      setDescription("");
      setShowForm(false);
    }
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm("Delete this time entry?")) return;
    await deleteTimeEntry(supabase, entry.id);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setTotalMinutes((prev) => prev - entry.minutes);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-gray-400" />
          <span className="text-gray-500">Time Logged:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatDuration(totalMinutes)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-navo-blue hover:bg-navo-blue/10"
        >
          <Plus size={14} />
          Log Time
        </Button>
      </div>

      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Timer</p>
            {timerRunning ? (
              <p className="font-mono text-2xl font-bold text-navo-blue">{formatElapsed(elapsed)}</p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Start tracking time</p>
            )}
          </div>
          <div>
            {timerRunning ? (
              <button
                onClick={handleStopTimer}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className="rounded-lg bg-navo-blue px-4 py-2 text-sm font-medium text-white hover:bg-navo-deep"
              >
                Start Timer
              </button>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hours"
              type="number"
              min="0"
              placeholder="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <Input
              label="Minutes"
              type="number"
              min="0"
              max="59"
              placeholder="0"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
          <div className="mt-2 space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              placeholder="What did you work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              Save
            </Button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDuration(entry.minutes)}
                  {entry.description && (
                    <span className="ml-2 text-gray-500">
                      - {entry.description}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(entry.date).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(entry)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!showForm && entries.length === 0 && (
        <p className="text-center text-xs text-gray-400">
          No time logged yet.
        </p>
      )}
    </div>
  );
}
