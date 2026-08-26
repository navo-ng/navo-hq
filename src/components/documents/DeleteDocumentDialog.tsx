"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocDocument } from "@/types/document";
import { archiveDocument } from "@/lib/data/documents";
import { createClient } from "@/lib/supabase/client";

interface DeleteDocumentDialogProps {
  document: DocDocument;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteDocumentDialog({
  document: doc,
  open,
  onClose,
  onDeleted,
}: DeleteDocumentDialogProps) {
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await archiveDocument(supabase, doc.id);
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Delete Document" maxWidth="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            &ldquo;{doc.title}&rdquo;
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Document"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
