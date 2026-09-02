"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  fetchPreferences,
  updatePreferences,
  NotificationPreferences,
} from "@/lib/data/notification-preferences";
import { createClient } from "@/lib/supabase/client";

const TOGGLES = [
  { key: "task_assigned" as const, label: "Task assigned to me", desc: "When someone assigns you a task" },
  { key: "task_status_changed" as const, label: "Task status changed", desc: "When a task you own is moved to a different status" },
  { key: "task_commented" as const, label: "Task commented", desc: "When someone comments on your task" },
  { key: "project_added" as const, label: "Added to project", desc: "When you are added to a project" },
  { key: "decision_voted" as const, label: "Decision voted", desc: "When someone votes on a decision you created" },
  { key: "dependency_added" as const, label: "Dependency added", desc: "When a dependency is added to your task" },
  { key: "email_digest" as const, label: "Email digest", desc: "Receive a daily summary of activity" },
] as const;

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-navo-blue" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;
      const data = await fetchPreferences(supabase, userId);
      if (!cancelled) {
        setPrefs(data);
        setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  const handleSave = async () => {
    if (!prefs) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    setSaving(true);
    await updatePreferences(supabase, userId, {
      task_assigned: prefs.task_assigned,
      task_status_changed: prefs.task_status_changed,
      task_commented: prefs.task_commented,
      project_added: prefs.project_added,
      decision_voted: prefs.decision_voted,
      dependency_added: prefs.dependency_added,
      email_digest: prefs.email_digest,
    });
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Preferences</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage which notifications you receive</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={14} />
          Settings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notification Preferences
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage which notifications you receive
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={18} className="text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            In-App Notifications
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {TOGGLES.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {toggle.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {toggle.desc}
                </p>
              </div>
              <Toggle
                checked={prefs ? Boolean(prefs[toggle.key]) : true}
                onChange={() => handleToggle(toggle.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
