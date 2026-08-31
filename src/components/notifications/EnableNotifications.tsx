"use client";

import { Bell, CheckCircle, Info } from "lucide-react";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";

export function EnableNotifications() {
  const { permission, isSupported, requestPermission } = usePushNotifications();

  if (!isSupported) return null;

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
        <CheckCircle size={14} />
        <span className="hidden sm:inline">Notifications enabled</span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500" title="Enable in browser settings">
        <Info size={14} />
        <span className="hidden sm:inline">Notifications blocked</span>
      </div>
    );
  }

  return (
    <button
      onClick={requestPermission}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-navo-blue hover:bg-navo-blue/10 transition-colors"
    >
      <Bell size={14} />
      <span className="hidden sm:inline">Enable notifications</span>
    </button>
  );
}
