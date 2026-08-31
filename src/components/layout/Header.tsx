"use client";

import { Moon, Sun, Search, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { EnableNotifications } from "@/components/notifications/EnableNotifications";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { useSidebar } from "@/components/layout/Sidebar";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Header({ onSearchClick }: { onSearchClick?: () => void }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const { setMobileOpen } = useSidebar();
  const { permission } = usePushNotifications();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
        >
          <Menu size={20} />
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {getGreeting()}
        </p>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onSearchClick}
          className="flex items-center gap-1.5 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Search size={18} />
          <span className="hidden text-xs text-gray-400 sm:inline">⌘K</span>
        </button>
        <NotificationBell />
        {permission !== "granted" && <EnableNotifications />}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
        <div className="ml-1 h-8 w-8 rounded-full bg-navo-blue flex items-center justify-center text-sm font-medium text-white sm:ml-2">
          N
        </div>
      </div>
    </header>
  );
}
