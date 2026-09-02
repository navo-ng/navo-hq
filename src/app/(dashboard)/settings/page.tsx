"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings as SettingsIcon, Tag, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamSetting, UserSetting } from "@/types/settings";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTeamSettings,
  updateTeamSetting,
  fetchUserSettings,
  updateUserSetting,
} from "@/lib/data/settings";

export default function SettingsPage() {
  const [teamSettings, setTeamSettings] = useState<TeamSetting[]>([]);
  const [userSettings, setUserSettings] = useState<UserSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [theme, setTheme] = useState("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
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
        if (themeSetting) setTheme(String(themeSetting.value));

        const notifSetting = userData2.find((s) => s.key === "notifications_enabled");
        if (notifSetting) setNotificationsEnabled(Boolean(notifSetting.value));

        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleSaveTeamSettings = async () => {
    setSaving(true);
    await Promise.all([
      updateTeamSetting(supabase, "company_name", companyName),
      updateTeamSetting(supabase, "timezone", timezone),
    ]);
    setSaving(false);
  };

  const handleSaveUserSettings = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    setSaving(true);
    await Promise.all([
      updateUserSetting(supabase, userId, "theme", theme),
      updateUserSetting(supabase, userId, "notifications_enabled", notificationsEnabled),
    ]);
    setSaving(false);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              onChange={(e) => setTheme(e.target.value)}
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
