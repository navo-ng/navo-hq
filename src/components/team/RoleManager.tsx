"use client";

import { useState } from "react";
import { Shield, ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { updateMemberRole, fetchRoles } from "@/lib/data/team";
import { MESSAGES } from "@/lib/utils/messages";
import { useEffect } from "react";

interface RoleManagerProps {
  userId: string;
  currentRoleId: string;
  currentRoleName?: string;
  userName: string;
  isOwner: boolean;
  onRoleChanged: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "#F59E0B",
  admin: "#8B5CF6",
  member: "#10B981",
  viewer: "#6B7280",
};

export function RoleManager({
  userId,
  currentRoleId,
  currentRoleName: fallbackRoleName,
  userName,
  isOwner,
  onRoleChanged,
}: RoleManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRoleName, setSelectedRoleName] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const { showToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchRoles(supabase).then(setRoles);
  }, [supabase]);

  const currentRoleName =
    roles.find((r) => r.id === currentRoleId)?.name || fallbackRoleName || "Unknown";

  const handleRoleSelect = (roleId: string, roleName: string) => {
    if (roleId === currentRoleId) return;

    if (roleName.toLowerCase() === "owner") {
      setSelectedRoleId(roleId);
      setSelectedRoleName(roleName);
      setConfirmOpen(true);
    } else {
      performRoleChange(roleId, roleName);
    }
  };

  const performRoleChange = async (roleId: string, roleName: string) => {
    setIsUpdating(true);
    try {
      await updateMemberRole(supabase, userId, roleId);
      showToast({
        title: MESSAGES.ROLE_CHANGED.replace("{name}", userName).replace(
          "{role}",
          roleName
        ),
        type: "success",
      });
      onRoleChanged();
    } catch {
      showToast({ title: MESSAGES.UNKNOWN_ERROR, type: "error" });
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
      setConfirmOpen(false);
    }
  };

  const handleConfirmOwnerChange = () => {
    performRoleChange(selectedRoleId, selectedRoleName);
  };

  if (!isOwner) return null;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUpdating}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Shield size={14} />
          {currentRoleName}
          <ChevronDown
            size={14}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id, role.name)}
                  disabled={role.id === currentRoleId || isUpdating}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    role.id === currentRoleId
                      ? "bg-gray-100 font-medium text-gray-900 dark:bg-gray-700 dark:text-white"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  } disabled:opacity-50`}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        ROLE_COLORS[role.name.toLowerCase()] || "#6B7280",
                    }}
                  />
                  {role.name}
                  {role.id === currentRoleId && (
                    <span className="ml-auto text-xs text-gray-400">
                      Current
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Role Change"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle
                size={20}
                className="text-amber-600 dark:text-amber-400"
              />
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Are you sure you want to make{" "}
                <span className="font-semibold">{userName}</span> the new Owner?
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This will transfer full ownership privileges. You will lose Owner
                access.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmOwnerChange}
              disabled={isUpdating}
            >
              {isUpdating ? "Transferring..." : "Transfer Ownership"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
