"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  TaskUser,
  TaskProject,
  TaskTag,
  TaskStatusConfig,
  TaskPriorityConfig,
} from "@/types/task";

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (task: {
    title: string;
    description: string;
    owner_id: string;
    project_id: string;
    status_id: string;
    priority_id: string;
    due_date: string;
    tag_ids: string[];
  }) => void;
  users: TaskUser[];
  projects: TaskProject[];
  tags: TaskTag[];
  statuses: TaskStatusConfig[];
  priorities: TaskPriorityConfig[];
}

export function CreateTaskDialog({
  open,
  onClose,
  onCreate,
  users,
  projects,
  tags,
  statuses,
  priorities,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleSubmit = () => {
    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    if (!statusId) {
      return;
    }

    if (!priorityId) {
      return;
    }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      owner_id: ownerId,
      project_id: projectId,
      status_id: statusId,
      priority_id: priorityId,
      due_date: dueDate,
      tag_ids: selectedTags,
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOwnerId("");
    setProjectId("");
    setStatusId("");
    setPriorityId("");
    setDueDate("");
    setSelectedTags([]);
    setErrors({});
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create Task" maxWidth="lg">
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="What needs to be done?"
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
            placeholder="Add more details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Assignee"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="Unassigned"
            options={users.map((u) => ({ value: u.id, label: u.name }))}
          />
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="No project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Status"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            placeholder="Select status"
            options={statuses.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select
            label="Priority"
            value={priorityId}
            onChange={(e) => setPriorityId(e.target.value)}
            placeholder="Select priority"
            options={priorities.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

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

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Task</Button>
        </div>
      </div>
    </Dialog>
  );
}
