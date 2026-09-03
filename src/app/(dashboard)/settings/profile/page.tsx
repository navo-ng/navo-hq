"use client";

import { useState, useEffect } from "react";
import { User, Lock, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";

export default function ProfilePage() {
  const { userId, fullName, role } = useCurrentUser();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, created_at")
        .eq("id", userId)
        .single();

      const { data: authData } = await supabase.auth.getUser();

      if (!cancelled && profile) {
        setName(profile.name || "");
        setEmail(authData.user?.email || "");
        setCreatedAt(
          profile.created_at
            ? new Date(profile.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""
        );
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, supabase]);

  const handleSaveName = async () => {
    if (!userId || !name.trim()) return;
    setSaving(true);
    setNameSaved(false);

    const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("id", userId);

    setSaving(false);
    if (error) {
      showToast({ title: MESSAGES.UNKNOWN_ERROR, type: "error" });
      return;
    }
    setNameSaved(true);
    showToast({ title: MESSAGES.PROFILE_UPDATED, type: "success" });
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSaved(false);

    if (!newPassword || !confirmPassword) {
      setPasswordError(MESSAGES.REQUIRED_FIELD);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(MESSAGES.PASSWORD_MISMATCH);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(MESSAGES.PASSWORD_TOO_SHORT);
      return;
    }

    setPasswordSaving(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
      setPasswordSaving(false);
      return;
    }

    setPasswordSaving(false);
    setPasswordSaved(true);
    showToast({ title: MESSAGES.PASSWORD_CHANGED, type: "success" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  const getInitial = () => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (name) return name.charAt(0).toUpperCase();
    return "N";
  };

  const getRoleDisplay = () => {
    if (!role) return "Member";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navo-blue text-xl font-bold text-white">
            {getInitial()}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {name || "New User"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
            <span className="inline-block rounded-full bg-navo-blue/10 px-2.5 py-0.5 text-xs font-medium text-navo-blue">
              {getRoleDisplay()}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Name */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <User size={18} className="text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>
        </div>
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            value={email}
            disabled
            className="opacity-60 cursor-not-allowed"
          />
          {createdAt && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Member since {createdAt}
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={handleSaveName} disabled={saving || !name.trim()}>
              {saving ? (
                "Saving..."
              ) : nameSaved ? (
                <span className="flex items-center gap-1.5">
                  <Check size={14} /> Saved
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={18} className="text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Change Password
          </h2>
        </div>
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={passwordSaving || !newPassword || !confirmPassword}
            >
              {passwordSaving ? (
                "Updating..."
              ) : passwordSaved ? (
                <span className="flex items-center gap-1.5">
                  <Check size={14} /> Updated
                </span>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
