"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTemplates,
  createTemplate,
  deleteTemplate,
  ProjectTemplate,
} from "@/lib/data/project-templates";

interface TaskDraft {
  id: string;
  title: string;
  description: string;
  priority: string;
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([
    { id: newId(), title: "", description: "", priority: "medium" },
  ]);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchTemplates(supabase).then((t) => {
      setTemplates(t);
      setLoading(false);
    });
  }, [supabase]);

  const addTask = () => {
    setTasks((prev) => [
      ...prev,
      { id: newId(), title: "", description: "", priority: "medium" },
    ]);
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTask = (
    id: string,
    field: keyof TaskDraft,
    value: string
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      showToast({ title: "Template name is required", type: "error" });
      return;
    }

    const validTasks = tasks.filter((t) => t.title.trim());
    if (validTasks.length === 0) {
      showToast({
        title: "Add at least one task with a title",
        type: "error",
      });
      return;
    }

    setSaving(true);
    const result = await createTemplate(supabase, {
      name: templateName.trim(),
      description: templateDesc.trim() || undefined,
      template_data: {
        tasks: validTasks.map((t) => ({
          title: t.title.trim(),
          description: t.description.trim() || undefined,
          priority: t.priority,
          status: "To Do",
        })),
      },
    });

    setSaving(false);

    if (result) {
      showToast({ title: MESSAGES.TEMPLATE_CREATED, type: "success" });
      setTemplates((prev) => [result, ...prev]);
      resetForm();
      setShowForm(false);
    } else {
      showToast({ title: "Failed to create template", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteTemplate(supabase, id);
    if (ok) {
      showToast({ title: MESSAGES.TEMPLATE_DELETED, type: "success" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const resetForm = () => {
    setTemplateName("");
    setTemplateDesc("");
    setTasks([
      { id: newId(), title: "", description: "", priority: "medium" },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Project Templates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create reusable project templates with predefined tasks
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          {showForm ? "Cancel" : "New Template"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-4">
            <Input
              label="Template Name"
              placeholder="e.g. Website Redesign, Product Launch"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                placeholder="What is this template for?"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                rows={2}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tasks
                </label>
                <button
                  onClick={addTask}
                  className="text-xs font-medium text-navo-blue hover:underline"
                >
                  + Add task
                </button>
              </div>

              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <GripVertical
                    size={14}
                    className="mt-2.5 text-gray-300 dark:text-gray-600"
                  />
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Task title"
                      value={task.title}
                      onChange={(e) =>
                        updateTask(task.id, "title", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={task.description}
                      onChange={(e) =>
                        updateTask(task.id, "description", e.target.value)
                      }
                    />
                    <Select
                      value={task.priority}
                      onChange={(e) =>
                        updateTask(task.id, "priority", e.target.value)
                      }
                      options={[
                        { value: "low", label: "Low" },
                        { value: "medium", label: "Medium" },
                        { value: "high", label: "High" },
                        { value: "urgent", label: "Urgent" },
                      ]}
                    />
                  </div>
                  {tasks.length > 1 && (
                    <button
                      onClick={() => removeTask(task.id)}
                      className="mt-2 rounded p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <FileText
            size={40}
            className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No templates yet. Create your first template to speed up project
            setup.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {template.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {template.template_data.tasks?.length || 0} tasks
                </p>
              </div>
              <button
                onClick={() => handleDelete(template.id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
