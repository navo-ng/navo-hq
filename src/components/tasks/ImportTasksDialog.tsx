"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  parseCSV,
  mapCSVToTasks,
  validateImportRows,
  type CSVImportRow,
} from "@/lib/utils/csv-import";
import { createClient } from "@/lib/supabase/client";

interface ImportTasksDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  onImported?: () => void;
}

export function ImportTasksDialog({
  open,
  onClose,
  projectId,
  onImported,
}: ImportTasksDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [parsedTasks, setParsedTasks] = useState<CSVImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const allRows = parseCSV(text);
      if (allRows.length < 2) {
        setErrors(["CSV file is empty or has no data rows"]);
        setParsedTasks([]);
        setStep("preview");
        return;
      }

      const hdrs = allRows[0];
      const dataRows = allRows.slice(1);

      const tasks = mapCSVToTasks(dataRows, hdrs);
      const { valid, errors: validationErrors } = validateImportRows(tasks);

      setParsedTasks(valid);
      setErrors(validationErrors);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const task of parsedTasks) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("tasks").insert({
          title: task.title,
          description: task.description || null,
          project_id: projectId || null,
          status_id: null,
          priority_id: null,
          owner_id: null,
          creator_id: user?.id || null,
          due_date: task.due_date || null,
        });
        if (error) failed++;
        else success++;
      } catch {
        failed++;
      }
    }

    setResult({ success, failed });
    setStep("done");
    setImporting(false);
    if (onImported) onImported();
  };

  const handleClose = () => {
    setStep("upload");
    setParsedTasks([]);
    setErrors([]);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Import Tasks from CSV" maxWidth="lg">
      {step === "upload" && (
        <div className="py-8">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center cursor-pointer hover:border-navo-blue hover:bg-navo-light/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-navo-blue"
          >
            <Upload size={40} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Click to upload CSV file
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Supported columns: title, description, priority, status,
                assignee, due_date, project
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          {errors.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertCircle size={16} />
                <span>{errors.length} row(s) skipped</span>
              </div>
              <ul className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                {errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Found{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {parsedTasks.length}
            </span>{" "}
            tasks to import
          </p>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Title
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Priority
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {parsedTasks.slice(0, 10).map((task, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">
                      {task.title}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {task.priority || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {task.due_date || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || parsedTasks.length === 0}
            >
              {importing
                ? "Importing..."
                : `Import ${parsedTasks.length} Tasks`}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="py-8 text-center">
          <CheckCircle size={48} className="mx-auto text-emerald-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Import Complete
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-emerald-600">
              {result.success}
            </span>{" "}
            tasks imported
            {result.failed > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-red-600">
                  {result.failed}
                </span>{" "}
                failed
              </>
            )}
          </p>
          <Button onClick={handleClose} className="mt-6">
            Done
          </Button>
        </div>
      )}
    </Dialog>
  );
}
