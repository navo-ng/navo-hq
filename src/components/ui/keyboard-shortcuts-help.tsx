"use client";
import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Cmd", "K"], description: "Open search" },
  { keys: ["Cmd", "N"], description: "New task" },
  { keys: ["Cmd", "1"], description: "Dashboard" },
  { keys: ["Cmd", "2"], description: "Tasks" },
  { keys: ["Cmd", "3"], description: "Projects" },
  { keys: ["Cmd", "4"], description: "Decisions" },
  { keys: ["Cmd", "5"], description: "Documents" },
  { keys: ["Cmd", "6"], description: "Calendar" },
  { keys: ["Cmd", "7"], description: "Team" },
  { keys: ["?"], description: "Show shortcuts" },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener("open-shortcuts-help", handler);
    return () => document.removeEventListener("open-shortcuts-help", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-600 dark:text-gray-400">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd key={key} className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
