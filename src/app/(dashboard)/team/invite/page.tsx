"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Copy, Check, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamRole } from "@/types/team";
import { createClient } from "@/lib/supabase/client";
import { fetchRoles } from "@/lib/data/team";
import { useToastContext } from "@/components/ui/toast";

export default function InviteMemberPage() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const supabase = createClient();

  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      const data = await fetchRoles(supabase);
      setRoles(data);
      if (data.length > 0) {
        setRoleId(data[0].id);
      }
    }
    loadRoles();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !roleId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role_id: roleId, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({ title: data.error || "Failed to send invite", type: "error" });
        return;
      }

      if (data.tempPassword) {
        setInviteResult({ email: data.email, tempPassword: data.tempPassword });
        showToast({ title: "Team member invited!", type: "success" });
      } else {
        showToast({ title: "Existing member updated", type: "success" });
        router.push("/team");
      }
    } catch {
      showToast({ title: "Something went wrong", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!inviteResult) return;
    const text = `Welcome to NAVO HQ!\n\nEmail: ${inviteResult.email}\nPassword: ${inviteResult.tempPassword}\n\nPlease log in and change your password.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inviteResult) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <button
            onClick={() => router.push("/team")}
            className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft size={16} />
            Back to Team
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invite Sent
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Share these credentials with the new team member
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navo-blue/10">
              <Mail size={20} className="text-navo-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {inviteResult.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                New team member
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Temporary Password
            </p>
            <code className="block break-all font-mono text-sm text-gray-900 dark:text-white">
              {inviteResult.tempPassword}
            </code>
          </div>

          <Button
            onClick={handleCopyCredentials}
            className="mt-4 w-full"
            variant={copied ? "secondary" : "primary"}
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Credentials
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Share these credentials with the team member via a secure channel.
          They should change their password after first login.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <button
          onClick={() => router.push("/team")}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={16} />
          Back to Team
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Invite Team Member
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add a new member to your team
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address *
            </label>
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Shield size={14} className="mr-1 inline" />
              Role *
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              required
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message (optional)
            </label>
            <textarea
              placeholder="A note for the invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || !email || !roleId}>
          {isSubmitting ? (
            "Sending Invite..."
          ) : (
            <>
              <Send size={16} />
              Send Invite
            </>
          )}
        </Button>
      </form>
    </div>
  );
}