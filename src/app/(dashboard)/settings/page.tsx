"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Settings as SettingsIcon, Tag, Users, User, Bell, LayoutList, FileText, Webhook, Shield, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamSetting, UserSetting } from "@/types/settings";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/useToast";
import {
  fetchTeamSettings,
  updateTeamSetting,
  fetchUserSettings,
  updateUserSetting,
} from "@/lib/data/settings";

export default function SettingsPage() {
  const { theme: activeTheme, setTheme: setGlobalTheme } = useTheme();
  const { showToast } = useToast();
  const [teamSettings, setTeamSettings] = useState<TeamSetting[]>([]);
  const [userSettings, setUserSettings] = useState<UserSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [theme, setTheme] = useState("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        const [teamData, userData2] = await Promise.all([
          fetchTeamSettings(supabase),
          userId ? fetchUserSettings(supabase, userId) : Promise.resolve([]),
        ]);

        if (!cancelled) {
          setTeamSettings(teamData);
          setUserSettings(userData2);

          const companySetting = teamData.find((s) => s.key === "company_name");
          if (companySetting) setCompanyName(String(companySetting.value));

          const tzSetting = teamData.find((s) => s.key === "timezone");
          if (tzSetting) setTimezone(String(tzSetting.value));

          const themeSetting = userData2.find((s) => s.key === "theme");
          if (themeSetting) {
            const t = String(themeSetting.value);
            setTheme(t);
            setGlobalTheme(t);
          }

          const notifSetting = userData2.find((s) => s.key === "notifications_enabled");
          if (notifSetting) setNotificationsEnabled(Boolean(notifSetting.value));
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        if (!cancelled) setLoadError("Failed to load settings");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, setGlobalTheme]);

  const handleSaveTeamSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateTeamSetting(supabase, "company_name", companyName),
        updateTeamSetting(supabase, "timezone", timezone),
      ]);
      showToast({ title: "Team settings saved", type: "success" });
    } catch {
      showToast({ title: "Failed to save team settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserSettings = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    setSaving(true);
    try {
      await Promise.all([
        updateUserSetting(supabase, userId, "theme", theme),
        updateUserSetting(supabase, userId, "notifications_enabled", notificationsEnabled),
      ]);
      setGlobalTheme(theme);
      showToast({ title: "Preferences saved", type: "success" });
    } catch {
      showToast({ title: "Failed to save preferences", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your workspace preferences
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">{loadError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm text-navo-blue hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your workspace preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/settings/tags"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <Tag size={20} className="text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Tag Management
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Create and manage tags for tasks and projects
            </p>
          </div>
        </Link>
        <Link
          href="/settings/templates"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
            <FileText size={20} className="text-green-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Project Templates
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Create reusable project templates with predefined tasks
            </p>
          </div>
        </Link>
        <Link
          href="/settings/custom-fields"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <LayoutList size={20} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Custom Fields
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add custom fields to tasks and projects
            </p>
          </div>
        </Link>
        <Link
          href="/settings/notifications"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <Bell size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notification Preferences
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Choose which notifications you receive
            </p>
          </div>
        </Link>
        <Link
          href="/settings/webhooks"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20">
            <Webhook size={20} className="text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Webhooks
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Receive HTTP callbacks for workspace events
            </p>
          </div>
        </Link>
        <Link
          href="/settings/audit-log"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
            <Shield size={20} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Audit Log
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track all changes in your workspace
            </p>
          </div>
        </Link>
        <Link
          href="/settings/statuses"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/20">
            <CircleDot size={20} className="text-teal-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Task Statuses
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Create and manage custom task statuses
            </p>
          </div>
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <Users size={18} className="text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Team Settings
          </h2>
        </div>
        <div className="space-y-4">
          <Input
            label="Company Name"
            placeholder="Your company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select timezone</option>
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Chicago">America/Chicago (CST)</option>
              <option value="America/Denver">America/Denver (MST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveTeamSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Team Settings"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <User size={18} className="text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            User Preferences
          </h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value);
                setGlobalTheme(e.target.value);
              }}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Notifications
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receive email updates for assignments and mentions
              </p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              role="switch"
              aria-checked={notificationsEnabled}
              aria-label="Email notifications"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                notificationsEnabled ? "bg-navo-blue" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  notificationsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveUserSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
