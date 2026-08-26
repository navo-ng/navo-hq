"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DocDocument, DocumentStatusConfig, DocumentUser } from "@/types/document";
import { updateDocument } from "@/lib/data/documents";
import { createClient } from "@/lib/supabase/client";

interface EditDocumentDialogProps {
  document: DocDocument;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  users: DocumentUser[];
  statuses: DocumentStatusConfig[];
  tags: { id: string; name: string; color: string }[];
  projects: { id: string; name: string }[];
  key?: string;
}

export function EditDocumentDialog({
  document: doc,
  open,
  onClose,
  onUpdated,
  users,
  statuses,
  tags,
  projects,
}: EditDocumentDialogProps) {
  const supabase = createClient();
  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description || "");
  const [category, setCategory] = useState(doc.category || "");
  const [ownerId, setOwnerId] = useState(doc.owner_id);
  const [statusId, setStatusId] = useState(doc.status_id);
  const [projectId, setProjectId] = useState(doc.project_id || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(doc.tags?.map((t) => t.id) || []);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrors({ title: "Document title is required" });
      return;
    }

    if (!ownerId) {
      return;
    }

    if (!statusId) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateDocument(supabase, doc.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        owner_id: ownerId,
        project_id: projectId || undefined,
        status_id: statusId,
      });

      if (updated) {
        onUpdated();
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title="Edit Document" maxWidth="lg">
      <div className="space-y-4">
        <Input
          label="Document Title"
          placeholder="What is this document about?"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({});
          }}
          error={errors.title}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            placeholder="Brief description of this document..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Category"
            placeholder="e.g. Legal, Technical, Policy"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Select
            label="Status"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            placeholder="Select status"
            options={statuses.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Owner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="Select owner"
            options={users.map((u) => ({ value: u.id, label: u.name }))}
          />
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Select project (optional)"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>

        {tags.length > 0 && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                  style={
                    selectedTags.includes(tag.id)
                      ? { backgroundColor: tag.color }
                      : undefined
                  }
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
