"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/client";

interface DeleteProjectDialogProps {
  project: { id: string; name: string };
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteProjectDialog({
  project,
  open,
  onClose,
  onDeleted,
}: DeleteProjectDialogProps) {
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(supabase, project.id);
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Delete Project" maxWidth="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            &ldquo;{project.name}&rdquo;
          </span>
          ? This will also delete all associated tasks. This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
