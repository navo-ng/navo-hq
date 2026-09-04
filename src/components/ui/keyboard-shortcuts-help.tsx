"use client";

import { Keyboard, LayoutDashboard, Search, PanelLeftClose, GripVertical } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sections = [
  {
    title: "Navigation",
    icon: LayoutDashboard,
    shortcuts: [
      { keys: ["⌘", "1"], label: "Dashboard" },
      { keys: ["⌘", "2"], label: "Tasks" },
      { keys: ["⌘", "3"], label: "Projects" },
      { keys: ["⌘", "4"], label: "Team" },
      { keys: ["⌘", "5"], label: "Decisions" },
      { keys: ["⌘", "6"], label: "Documents" },
      { keys: ["⌘", "7"], label: "Calendar" },
    ],
  },
  {
    title: "Actions",
    icon: Search,
    shortcuts: [
      { keys: ["⌘", "K"], label: "Global Search" },
      { keys: ["⌘", "N"], label: "New Task" },
      { keys: ["⌘", "⇧", "S"], label: "Standup" },
    ],
  },
  {
    title: "View",
    icon: PanelLeftClose,
    shortcuts: [
      { keys: ["⌘", "\\"], label: "Toggle Sidebar" },
      { keys: ["?"], label: "Show Shortcuts" },
    ],
  },
  {
    title: "Task Board",
    icon: GripVertical,
    shortcuts: [
      { keys: ["Drag"], label: "Reorder tasks" },
      { keys: ["Click"], label: "Open task detail" },
    ],
  },
];

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} title="Keyboard Shortcuts" maxWidth="lg">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard size={18} className="text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Quick navigation shortcuts</span>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <section.icon size={16} className="text-gray-400" />
              {section.title}
            </div>
            <div className="space-y-2">
              {section.shortcuts.map((shortcut) => (
                <div key={shortcut.label} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{shortcut.label}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i} className="flex items-center">
                        <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-gray-300 bg-gray-100 px-1.5 font-mono text-[11px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {key}
                        </kbd>
                        {i < shortcut.keys.length - 1 && <span className="mx-0.5 text-gray-400">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
