"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Pencil, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { fetchStandups, fetchMyStandup, createStandup, Standup } from "@/lib/data/standups";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";

export default function StandupPage() {
  const [standups, setStandups] = useState<Standup[]>([]);
  const [myStandup, setMyStandup] = useState<Standup | null>(null);
  const [todayDoing, setTodayDoing] = useState("");
  const [todayDone, setTodayDone] = useState("");
  const [blockers, setBlockers] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [standupsData, myStandupData] = await Promise.all([
        fetchStandups(supabase),
        fetchMyStandup(supabase, user.id),
      ]);

      setStandups(standupsData);
      setMyStandup(myStandupData);

      if (myStandupData) {
        setTodayDoing(myStandupData.today_doing);
        setTodayDone(myStandupData.today_done);
        setBlockers(myStandupData.blockers);
      }
    } catch {
      console.error("Failed to load standup data");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!userId) return;
    if (!todayDoing.trim() || !todayDone.trim()) {
      showToast({ title: "Please fill in both 'What I'm doing today' and 'What I did yesterday'", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createStandup(supabase, userId, {
        today_doing: todayDoing.trim(),
        today_done: todayDone.trim(),
        blockers: blockers.trim(),
      });

      if (result) {
        setMyStandup(result);
        setStandups((prev) => {
          const filtered = prev.filter((s) => s.user_id !== userId);
          return [result, ...filtered];
        });
        showToast({
          title: myStandup ? MESSAGES.STANDUP_UPDATED : MESSAGES.STANDUP_SUBMITTED,
          type: "success",
        });
      } else {
        showToast({ title: MESSAGES.STANDUP_ERROR, type: "error" });
      }
    } catch {
      showToast({ title: MESSAGES.STANDUP_ERROR, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Standup</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Daily team check-ins</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Standup</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Daily team check-ins</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Pencil size={18} />
          My Check-in
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="today_doing" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              What I&apos;m doing today <span className="text-red-500">*</span>
            </label>
            <textarea
              id="today_doing"
              value={todayDoing}
              onChange={(e) => setTodayDoing(e.target.value)}
              placeholder="e.g., Working on the new dashboard layout..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="today_done" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              What I did yesterday <span className="text-red-500">*</span>
            </label>
            <textarea
              id="today_done"
              value={todayDone}
              onChange={(e) => setTodayDone(e.target.value)}
              placeholder="e.g., Finished the API integration..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="blockers" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Any blockers?
            </label>
            <textarea
              id="blockers"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="e.g., Waiting for design approval..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            <Send size={16} />
            {isSubmitting ? "Submitting..." : myStandup ? "Update Check-in" : "Submit Check-in"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Team Check-ins</h2>

        {standups.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">No check-ins today yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {standups.map((standup) => (
              <div
                key={standup.id}
                className={`rounded-xl border bg-white p-4 dark:bg-gray-900 ${
                  standup.blockers
                    ? "border-l-4 border-l-red-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 dark:border-l-red-500 dark:border-t-gray-800 dark:border-r-gray-800 dark:border-b-gray-800"
                    : "border-l-4 border-l-emerald-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 dark:border-l-emerald-500 dark:border-t-gray-800 dark:border-r-gray-800 dark:border-b-gray-800"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navo-blue/10 text-sm font-medium text-navo-blue">
                      {standup.user?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {standup.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(standup.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Clock size={14} className="mt-0.5 shrink-0 text-navo-blue" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Doing: </span>
                      <span className="text-gray-600 dark:text-gray-400">{standup.today_doing}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Done: </span>
                      <span className="text-gray-600 dark:text-gray-400">{standup.today_done}</span>
                    </div>
                  </div>

                  {standup.blockers && (
                    <div className="flex gap-2">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Blockers: </span>
                        <span className="text-gray-600 dark:text-gray-400">{standup.blockers}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
