"use client";

import { useState } from "react";
import { UserPlus, X, Shield, Eye, Edit3, Settings } from "lucide-react";
import { ProjectMember, ProjectUser } from "@/types/project";
import { ProjectRole, ROLE_LABELS } from "@/lib/data/project-permissions";

interface ProjectMembersProps {
  members: ProjectMember[];
  allUsers: ProjectUser[];
  onAddMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  canManage?: boolean;
  onManageClick?: () => void;
}

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-navo-blue/10 text-navo-blue",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  editor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  member: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const ROLE_ICONS: Record<string, typeof Eye> = {
  owner: Shield,
  admin: Shield,
  editor: Edit3,
  viewer: Eye,
  member: Eye,
};

export function ProjectMembers({
  members,
  allUsers,
  onAddMember,
  onRemoveMember,
  canManage = false,
  onManageClick,
}: ProjectMembersProps) {
  const [showAdd, setShowAdd] = useState(false);

  const availableUsers = allUsers.filter(
    (u) => !members.some((m) => m.user_id === u.id)
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Team Members
        </h3>
        <div className="flex items-center gap-2">
          {canManage && onManageClick && (
            <button
              onClick={onManageClick}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Settings size={14} />
              Manage
            </button>
          )}
          {availableUsers.length > 0 && !canManage && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1 text-xs font-medium text-navo-blue hover:underline"
            >
              <UserPlus size={14} />
              Add member
            </button>
          )}
        </div>
      </div>

      {showAdd && availableUsers.length > 0 && (
        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Select team members to add:
          </p>
          <div className="flex flex-wrap gap-2">
            {availableUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  onAddMember(user.id);
                  setShowAdd(false);
                }}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-navo-blue hover:text-navo-blue dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ backgroundColor: "#0064F0" }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                {user.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No team members yet.
          </p>
        ) : (
          members.map((member) => {
            const RoleIcon = ROLE_ICONS[member.role] || Eye;
            const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.viewer;
            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "#0064F0" }}
                  >
                    {member.user?.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.user?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleStyle}`}
                  >
                    <RoleIcon size={12} />
                    {ROLE_LABELS[member.role as ProjectRole] || member.role}
                  </span>
                  {member.role !== "owner" && (
                    <button
                      onClick={() => onRemoveMember(member.user_id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
