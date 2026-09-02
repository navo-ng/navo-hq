"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { CustomFieldRenderer } from "@/components/ui/CustomFieldRenderer";
import { createClient } from "@/lib/supabase/client";
import {
  CustomFieldDefinition,
  fetchCustomFieldDefinitions,
  fetchCustomFieldValues,
  saveCustomFieldValues,
} from "@/lib/data/custom-fields";
import { Task, TaskUser, TaskProject, TaskTag, TaskStatusConfig, TaskPriorityConfig } from "@/types/task";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  users: TaskUser[];
  projects: TaskProject[];
  tags: TaskTag[];
  statuses: TaskStatusConfig[];
  priorities: TaskPriorityConfig[];
}

export function EditTaskDialog({
  task,
  open,
  onClose,
  onUpdated,
  users,
  projects,
  tags,
  statuses,
  priorities,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [ownerId, setOwnerId] = useState(task.owner_id || "");
  const [projectId, setProjectId] = useState(task.project_id || "");
  const [statusId, setStatusId] = useState(task.status_id);
  const [priorityId, setPriorityId] = useState(task.priority_id);
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    task.tags?.map((t) => t.id) || []
  );
  const [recurrence, setRecurrence] = useState(task.recurrence || "none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(task.recurrence_end_date || "");
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | null>>({});
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || "");
      setOwnerId(task.owner_id || "");
      setProjectId(task.project_id || "");
      setStatusId(task.status_id);
      setPriorityId(task.priority_id);
      setDueDate(task.due_date || "");
      setSelectedTags(task.tags?.map((t) => t.id) || []);
      setRecurrence(task.recurrence || "none");
      setRecurrenceEndDate(task.recurrence_end_date || "");
      setErrors({});

      // Fetch custom fields
      const supabase = createClient();
      fetchCustomFieldDefinitions(supabase, "task").then(async (defs) => {
        setCustomFieldDefs(defs);
        const values = await fetchCustomFieldValues(supabase, "task", task.id);
        setCustomFieldValues(values);
      });
    }
  }, [open, task]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    setIsSaving(true);
    try {
      const { updateTask } = await import("@/lib/data/tasks");
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      await updateTask(supabase, task.id, {
        title: title.trim(),
        description: description.trim() || null,
        status_id: statusId,
        priority_id: priorityId,
        owner_id: ownerId || null,
        project_id: projectId || null,
        due_date: dueDate || null,
        tag_ids: selectedTags,
        recurrence,
        recurrence_end_date: recurrenceEndDate || null,
      });

      // Save custom field values
      if (Object.keys(customFieldValues).length > 0) {
        await saveCustomFieldValues(supabase, task.id, customFieldValues);
      }

      showToast({ title: "Task updated", type: "success" });
      onUpdated();
      onClose();
    } catch {
      showToast({ title: "Failed to update task", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title="Edit Task" maxWidth="lg">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Recurrence"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            placeholder="None"
            options={[
              { value: "none", label: "None" },
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "biweekly", label: "Biweekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
          {recurrence !== "none" && (
            <Input
              label="Recurrence End Date"
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => setRecurrenceEndDate(e.target.value)}
            />
          )}
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
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
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

        {customFieldDefs.length > 0 && (
          <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Fields
            </p>
            {customFieldDefs.map((def) => (
              <CustomFieldRenderer
                key={def.id}
                definition={def}
                value={customFieldValues[def.id] || null}
                onChange={(value) =>
                  setCustomFieldValues((prev) => ({ ...prev, [def.id]: value }))
                }
              />
            ))}
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
