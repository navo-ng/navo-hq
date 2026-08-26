"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar, SidebarProvider } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { SearchPalette } from "@/components/search/SearchPalette";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { useRealtimeNotifications } from "@/lib/hooks/useRealtimeNotifications";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const toggleSearch = useCallback(() => setSearchOpen((prev) => !prev), []);
  const { newNotification, clearNewNotification } = useRealtimeNotifications();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSearch]);

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header onSearchClick={toggleSearch} />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-6 dark:bg-gray-950">
              {children}
            </main>
          </div>
        </div>
        <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
        <NotificationToast
          notification={newNotification}
          onDismiss={clearNewNotification}
        />
      </SidebarProvider>
    </ThemeProvider>
  );
}
