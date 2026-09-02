"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts?: ShortcutConfig[]) {
  const router = useRouter();

  useEffect(() => {
    const defaultShortcuts: ShortcutConfig[] = [
      { key: "k", meta: true, action: () => document.dispatchEvent(new CustomEvent("open-search")), description: "Open search" },
      { key: "1", meta: true, action: () => router.push("/dashboard"), description: "Go to Dashboard" },
      { key: "2", meta: true, action: () => router.push("/tasks"), description: "Go to Tasks" },
      { key: "3", meta: true, action: () => router.push("/projects"), description: "Go to Projects" },
      { key: "4", meta: true, action: () => router.push("/decisions"), description: "Go to Decisions" },
      { key: "5", meta: true, action: () => router.push("/documents"), description: "Go to Documents" },
      { key: "6", meta: true, action: () => router.push("/calendar"), description: "Go to Calendar" },
      { key: "7", meta: true, action: () => router.push("/team"), description: "Go to Team" },
      { key: "c", meta: true, action: () => document.dispatchEvent(new CustomEvent("open-new-task")), description: "New task" },
    ];

    const allShortcuts = [...defaultShortcuts, ...(shortcuts || [])];

    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      const shortcut = allShortcuts.find(
        (s) => s.key.toLowerCase() === e.key.toLowerCase() && !!s.meta === isMeta
      );

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, shortcuts]);
}
