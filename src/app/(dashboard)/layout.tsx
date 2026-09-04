"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar, SidebarProvider } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SearchPalette } from "@/components/search/SearchPalette";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { ToastProvider } from "@/components/ui/toast";
import { NotificationsProvider, useNotifications } from "@/lib/hooks/useRealtimeNotifications";
import { UserProvider } from "@/lib/hooks/useCurrentUser";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help";
import { BottomNav } from "@/components/layout/BottomNav";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const toggleSearch = useCallback(() => setSearchOpen((prev) => !prev), []);
  const { newNotification, clearNewNotification } = useNotifications();

  useKeyboardShortcuts([
    { key: "k", meta: true, action: () => setSearchOpen(true), description: "Open search" },
    { key: "?", action: () => setShortcutsOpen(true), description: "Show keyboard shortcuts" },
  ]);

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onSearchClick={toggleSearch} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-3 pb-20 sm:p-6 md:pb-6 dark:bg-gray-950">
            {children}
          </main>
        </div>
      </div>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationToast
        notification={newNotification}
        onDismiss={clearNewNotification}
      />
      <KeyboardShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <BottomNav />
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <ToastProvider>
        <NotificationsProvider>
          <OnboardingProvider>
            <SidebarProvider>
              <DashboardInner>{children}</DashboardInner>
              <OnboardingOverlay />
            </SidebarProvider>
          </OnboardingProvider>
        </NotificationsProvider>
      </ToastProvider>
    </UserProvider>
  );
}
