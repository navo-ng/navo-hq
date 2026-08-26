"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DocumentStatusConfig, DocumentUser } from "@/types/document";

interface CreateDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (document: {
    title: string;
    description: string;
    category: string;
    owner_id: string;
    project_id: string;
    status_id: string;
    tag_ids: string[];
  }) => void;
  users: DocumentUser[];
  statuses: DocumentStatusConfig[];
  tags: { id: string; name: string; color: string }[];
  projects: { id: string; name: string }[];
}

export function CreateDocumentDialog({
  open,
  onClose,
  onCreate,
  users,
  statuses,
  tags,
  projects,
}: CreateDocumentDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleSubmit = () => {
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

    onCreate({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      owner_id: ownerId,
      project_id: projectId,
      status_id: statusId,
      tag_ids: selectedTags,
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setOwnerId("");
    setStatusId("");
    setProjectId("");
    setSelectedTags([]);
    setErrors({});
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create Document" maxWidth="lg">
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

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
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
          <Button onClick={handleSubmit}>Create Document</Button>
        </div>
      </div>
    </Dialog>
  );
}
