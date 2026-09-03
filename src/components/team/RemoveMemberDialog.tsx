"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { MESSAGES } from "@/lib/utils/messages";

interface RemoveMemberDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onRemoved: () => void;
}

export function RemoveMemberDialog({
  open,
  onClose,
  userId,
  userName,
  onRemoved,
}: RemoveMemberDialogProps) {
  const [removing, setRemoving] = useState(false);
  const { showToast } = useToast();
  const supabase = createClient();

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/team/remove-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast({ title: data.error || MESSAGES.UNKNOWN_ERROR, type: "error" });
        return;
      }

      showToast({
        title: `${userName} has been removed from the team`,
        type: "success",
      });
      onRemoved();
      onClose();
    } catch {
      showToast({ title: MESSAGES.NETWORK_ERROR, type: "error" });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Remove Team Member">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to remove{" "}
              <span className="font-semibold">{userName}</span> from the team?
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This will permanently delete their account and all associated data.
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRemove}
            disabled={removing}
          >
            <Trash2 size={14} />
            {removing ? "Removing..." : "Remove Member"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
