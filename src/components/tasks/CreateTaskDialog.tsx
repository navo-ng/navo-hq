"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { CustomFieldRenderer } from "@/components/ui/CustomFieldRenderer";
import { createClient } from "@/lib/supabase/client";
import {
  CustomFieldDefinition,
  fetchCustomFieldDefinitions,
  saveCustomFieldValues,
} from "@/lib/data/custom-fields";
import {
  TaskUser,
  TaskProject,
  TaskTag,
  TaskStatusConfig,
  TaskPriorityConfig,
} from "@/types/task";
import { CreateTaskFromTemplate } from "./CreateTaskFromTemplate";
import { FileText } from "lucide-react";

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
    recurrence: string;
    recurrence_end_date: string;
  }) => void;
  users: TaskUser[];
  projects: TaskProject[];
  tags: TaskTag[];
  statuses: TaskStatusConfig[];
  priorities: TaskPriorityConfig[];
  initialStatusId?: string;
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
  initialStatusId,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      resetForm();
      if (initialStatusId) {
        setStatusId(initialStatusId);
      }
      const supabase = createClient();
      fetchCustomFieldDefinitions(supabase, "task").then((defs) => {
        setCustomFieldDefs(defs);
        const initial: Record<string, string> = {};
        for (const def of defs) {
          initial[def.id] = "";
        }
        setCustomFieldValues(initial);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialStatusId]);

  const handleSelectTemplate = (template: {
    title: string;
    description: string;
    priority_name: string;
    status_name: string;
    recurrence: string;
  }) => {
    setTitle(template.title);
    setDescription(template.description);
    setRecurrence(template.recurrence);

    const matchedStatus = statuses.find(
      (s) => s.name.toLowerCase() === template.status_name.toLowerCase()
    );
    if (matchedStatus) setStatusId(matchedStatus.id);

    const matchedPriority = priorities.find(
      (p) => p.name.toLowerCase() === template.priority_name.toLowerCase()
    );
    if (matchedPriority) setPriorityId(matchedPriority.id);

    showToast({ title: "Template applied", type: "success" });
  };

  const handleSubmit = async () => {
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

    setIsSubmitting(true);
    try {
      onCreate({
        title: title.trim(),
        description: description.trim(),
        owner_id: ownerId,
        project_id: projectId,
        status_id: statusId,
        priority_id: priorityId,
        due_date: dueDate,
        tag_ids: selectedTags,
        recurrence,
        recurrence_end_date: recurrenceEndDate,
      });

      showToast({ title: MESSAGES.TASK_CREATED, type: "success" });
    } catch {
      showToast({ title: MESSAGES.TASK_CREATE_FAILED, type: "error" });
    } finally {
      setIsSubmitting(false);
    }

    resetForm();
    onClose();
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
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
    setRecurrence("none");
    setRecurrenceEndDate("");
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
        <button
          onClick={() => setTemplateDialogOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-600 transition-colors hover:border-navo-blue hover:bg-navo-blue/5 hover:text-navo-blue dark:border-gray-700 dark:text-gray-400 dark:hover:border-navo-blue dark:hover:bg-navo-blue/10"
        >
          <FileText size={16} />
          Use a template to pre-fill this task
        </button>

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
                onChange={(value) => handleCustomFieldChange(def.id, value)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </div>

      <CreateTaskFromTemplate
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        users={users}
        projects={projects}
        tags={tags}
        statuses={statuses}
        priorities={priorities}
      />
    </Dialog>
  );
}
