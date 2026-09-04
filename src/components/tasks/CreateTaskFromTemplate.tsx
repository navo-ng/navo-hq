"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTaskTemplates,
  createTaskTemplate,
  deleteTaskTemplate,
  TaskTemplate,
} from "@/lib/data/task-templates";
import {
  TaskUser,
  TaskProject,
  TaskTag,
  TaskStatusConfig,
  TaskPriorityConfig,
} from "@/types/task";
import { FileText, Trash2, Plus } from "lucide-react";

interface CreateTaskFromTemplateProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: {
    title: string;
    description: string;
    priority_name: string;
    status_name: string;
    recurrence: string;
  }) => void;
  users: TaskUser[];
  projects: TaskProject[];
  tags: TaskTag[];
  statuses: TaskStatusConfig[];
  priorities: TaskPriorityConfig[];
}

export function CreateTaskFromTemplate({
  open,
  onClose,
  onSelectTemplate,
  statuses,
  priorities,
}: CreateTaskFromTemplateProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriorityName, setNewPriorityName] = useState("Medium");
  const [newStatusName, setNewStatusName] = useState("To Do");
  const [newRecurrence, setNewRecurrence] = useState("none");
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchTaskTemplates(supabase).then((data) => {
      if (!cancelled) {
        setTemplates(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, supabase]);

  const handleSelect = (template: TaskTemplate) => {
    onSelectTemplate({
      title: template.title,
      description: template.task_description || "",
      priority_name: template.priority_name,
      status_name: template.status_name,
      recurrence: template.recurrence,
    });
    onClose();
  };

  const handleCreateTemplate = async () => {
    if (!newName.trim() || !newTitle.trim()) return;
    const created = await createTaskTemplate(supabase, {
      name: newName.trim(),
      title: newTitle.trim(),
      task_description: newDescription.trim() || undefined,
      priority_name: newPriorityName,
      status_name: newStatusName,
      recurrence: newRecurrence,
    });
    if (created) {
      setTemplates((prev) => [...prev, created]);
      setShowCreateForm(false);
      setNewName("");
      setNewTitle("");
      setNewDescription("");
      setNewPriorityName("Medium");
      setNewStatusName("To Do");
      setNewRecurrence("none");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Delete this template?")) return;
    await deleteTaskTemplate(supabase, templateId);
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Task Templates"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {showCreateForm ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              New Template
            </h4>
            <Input
              label="Template Name"
              placeholder="e.g. Weekly Report"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              label="Task Title"
              placeholder="Task title when using this template"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Description
              </label>
              <textarea
                placeholder="Default description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Status
                </label>
                <select
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Priority
                </label>
                <select
                  value={newPriorityName}
                  onChange={(e) => setNewPriorityName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {priorities.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Default Recurrence
              </label>
              <select
                value={newRecurrence}
                onChange={(e) => setNewRecurrence(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateTemplate}>
                Save Template
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="w-full"
          >
            <Plus size={14} />
            Create New Template
          </Button>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
              />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800/50">
            <FileText size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No templates yet. Create one to speed up task creation.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {template.title}
                    {template.task_description && (
                      <span className="ml-1 text-gray-400">
                        - {template.task_description.slice(0, 50)}
                        {template.task_description.length > 50 ? "..." : ""}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelect(template)}
                  >
                    Use
                  </Button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
