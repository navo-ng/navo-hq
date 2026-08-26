"use client";

import { Moon, Sun, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {getGreeting()}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Search size={18} />
        </button>
        <NotificationBell />
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
        <div className="ml-2 h-8 w-8 rounded-full bg-navo-blue flex items-center justify-center text-sm font-medium text-white">
          N
        </div>
      </div>
    </header>
  );
}
