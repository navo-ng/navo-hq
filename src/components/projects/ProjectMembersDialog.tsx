"use client";

import { useState } from "react";
import { UserPlus, X, Shield, Eye, Edit3 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProjectMember, ProjectUser } from "@/types/project";
import {
  ProjectRole,
  addProjectMemberWithRole,
  updateMemberRole,
  removeProjectMemberById,
} from "@/lib/data/project-permissions";
import { SupabaseClient } from "@supabase/supabase-js";

interface ProjectMembersDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: ProjectMember[];
  allUsers: ProjectUser[];
  supabase: SupabaseClient;
  onMembersChanged: () => void;
}

const ROLE_ICONS: Record<ProjectRole, typeof Eye> = {
  viewer: Eye,
  editor: Edit3,
  admin: Shield,
};

const ROLE_OPTIONS: { value: ProjectRole; label: string }[] = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
];

export function ProjectMembersDialog({
  open,
  onClose,
  projectId,
  members,
  allUsers,
  supabase,
  onMembersChanged,
}: ProjectMembersDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("viewer");
  const [isAdding, setIsAdding] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const availableUsers = allUsers.filter(
    (u) => !members.some((m) => m.user_id === u.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setIsAdding(true);
    try {
      await addProjectMemberWithRole(supabase, projectId, selectedUserId, selectedRole);
      setSelectedUserId("");
      setSelectedRole("viewer");
      onMembersChanged();
    } catch {
      // error handled in data layer
    } finally {
      setIsAdding(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: ProjectRole) => {
    setUpdatingRoleId(userId);
    try {
      await updateMemberRole(supabase, projectId, userId, newRole);
      onMembersChanged();
    } catch {
      // error handled in data layer
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeProjectMemberById(supabase, projectId, userId);
      onMembersChanged();
    } catch {
      // error handled in data layer
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Manage Members" maxWidth="md">
      <div className="space-y-5">
        {/* Add member section */}
        {availableUsers.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
            <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              Add a team member
            </p>
            <div className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAddMember}
                disabled={!selectedUserId || isAdding}
              >
                <UserPlus size={16} />
                {isAdding ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        )}

        {/* Members list */}
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No team members yet.
            </p>
          ) : (
            members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role as ProjectRole] || Eye;
              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: "#0064F0" }}
                    >
                      {member.user?.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <RoleIcon size={14} className="text-gray-400" />
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.user_id,
                            e.target.value as ProjectRole
                          )
                        }
                        disabled={updatingRoleId === member.user_id}
                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 focus:border-navo-blue focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      title="Remove member"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Role descriptions */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Role permissions
          </p>
          <div className="space-y-1">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = ROLE_ICONS[opt.value];
              return (
                <div key={opt.value} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Icon size={12} />
                  <span className="font-medium">{opt.label}:</span>
                  <span>
                    {opt.value === "viewer" && "Can view tasks"}
                    {opt.value === "editor" && "Can view and edit tasks"}
                    {opt.value === "admin" && "Can view, edit, and manage members"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
