"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteTask } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/client";

interface DeleteTaskDialogProps {
  task: { id: string; title: string };
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteTaskDialog({
  task,
  open,
  onClose,
  onDeleted,
}: DeleteTaskDialogProps) {
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(supabase, task.id);
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Delete Task" maxWidth="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            &ldquo;{task.title}&rdquo;
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Task"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
