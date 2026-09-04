"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, FileText, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTaskSetTemplates,
  createTaskSetTemplate,
  deleteTaskSetTemplate,
  createTasksFromSetTemplate,
  type TaskSetTemplate,
} from "@/lib/data/task-set-templates";

interface TaskSetTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  selectedTasks?: Array<{ title: string; description?: string }>;
  projectId?: string;
  onCreated?: () => void;
}

export function TaskSetTemplateDialog({
  open,
  onClose,
  selectedTasks,
  projectId,
  onCreated,
}: TaskSetTemplateDialogProps) {
  const [templates, setTemplates] = useState<TaskSetTemplate[]>([]);
  const [step, setStep] = useState<"list" | "create">("list");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateTasks, setTemplateTasks] = useState<Array<{ title: string; description: string }>>(
    selectedTasks?.map(t => ({ title: t.title, description: t.description || "" })) || []
  );
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchTaskSetTemplates(supabase).then(setTemplates);
      if (selectedTasks) {
        setTemplateTasks(selectedTasks.map(t => ({ title: t.title, description: t.description || "" })));
      }
    }
  }, [open, supabase, selectedTasks]);

  const handleCreate = async () => {
    if (!name.trim() || templateTasks.length === 0) return;
    setLoading(true);
    await createTaskSetTemplate(supabase, {
      name: name.trim(),
      description: description.trim() || undefined,
      tasks: templateTasks,
    });
    setLoading(false);
    setName("");
    setDescription("");
    setTemplateTasks([]);
    setStep("list");
    fetchTaskSetTemplates(supabase).then(setTemplates);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await deleteTaskSetTemplate(supabase, id);
    setTemplates(t => t.filter(tmpl => tmpl.id !== id));
  };

  const handleUseTemplate = async (template: TaskSetTemplate) => {
    setLoading(true);
    const count = await createTasksFromSetTemplate(supabase, template.id, projectId);
    setLoading(false);
    if (count > 0) {
      onCreated?.();
      onClose();
    }
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTemplateTasks(prev => [...prev, { title: newTaskTitle.trim(), description: "" }]);
    setNewTaskTitle("");
  };

  const removeTask = (index: number) => {
    setTemplateTasks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onClose={onClose} title="Task Templates" maxWidth="lg">
      {step === "list" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {templates.length} template{templates.length !== 1 ? "s" : ""}
            </p>
            {selectedTasks && selectedTasks.length > 0 && (
              <Button size="sm" onClick={() => setStep("create")}>
                <Plus size={14} className="mr-1" /> Save Selection as Template
              </Button>
            )}
          </div>

          {templates.length === 0 ? (
            <div className="py-8 text-center">
              <FileText size={32} className="mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No templates yet. Select tasks and save them as a template.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(template => (
                <div key={template.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(template.tasks as TaskSetTemplate["tasks"]).length} tasks
                      {template.description && ` · ${template.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleUseTemplate(template)} disabled={loading}>
                      <Play size={12} className="mr-1" /> Use
                    </Button>
                    <button onClick={() => handleDelete(template.id)} className="rounded p-1 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "create" && (
        <div className="space-y-4">
          <Input label="Template Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprint Setup" />
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tasks in Template</label>
            <div className="space-y-2">
              {templateTasks.map((task, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                  <span className="text-sm text-gray-900 dark:text-white flex-1">{task.title}</span>
                  <button onClick={() => removeTask(i)} className="rounded p-1 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a task..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())}
              />
              <Button size="sm" onClick={addTask}>Add</Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setStep("list")}>Back</Button>
            <Button onClick={handleCreate} disabled={loading || !name.trim() || templateTasks.length === 0}>
              {loading ? "Creating..." : "Save Template"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
