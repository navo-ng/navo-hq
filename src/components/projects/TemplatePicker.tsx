"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTemplates,
  ProjectTemplate,
} from "@/lib/data/project-templates";
import { createTask } from "@/lib/data/tasks";
import { FileText, Plus } from "lucide-react";

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: (taskCount: number) => void;
}

export function TemplatePicker({
  open,
  onClose,
  projectId,
  onSuccess,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const { showToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedId(null);
    fetchTemplates(supabase).then((t) => {
      setTemplates(t);
      setLoading(false);
    });
  }, [open, supabase]);

  const handleApply = async () => {
    const template = templates.find((t) => t.id === selectedId);
    if (!template) return;

    setApplying(true);
    const tasks = template.template_data.tasks || [];
    let createdCount = 0;

    for (const task of tasks) {
      const created = await createTask(supabase, {
        title: task.title,
        description: task.description || undefined,
        project_id: projectId,
        priority_id: task.priority || "",
        status_id: task.status || "",
      });
      if (created) createdCount++;
    }

    setApplying(false);
    showToast({
      title: MESSAGES.TEMPLATE_APPLIED.replace(
        "{count}",
        String(createdCount)
      ),
      type: "success",
    });
    onSuccess?.(createdCount);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Use a Template"
      maxWidth="md"
    >
      <div className="space-y-4">
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
          <div className="py-8 text-center">
            <FileText
              size={32}
              className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No templates yet. Create one in Settings &gt; Templates.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedId === template.id
                    ? "border-navo-blue bg-blue-50 dark:border-navo-blue dark:bg-blue-950/30"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </p>
                    {template.description && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {template.template_data.tasks?.length || 0} tasks
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedId || applying}
          >
            <Plus size={14} />
            {applying ? "Applying..." : "Apply Template"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
