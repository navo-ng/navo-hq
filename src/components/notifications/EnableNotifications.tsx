"use client";

import { Bell, CheckCircle, Info, X } from "lucide-react";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";

export function EnableNotifications() {
  const { permission, isSupported, isSubscribed, requestPermission, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  if (permission === "granted" && isSubscribed) {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        title="Disable notifications"
      >
        <CheckCircle size={14} />
        <span className="hidden sm:inline">Notifications on</span>
      </button>
    );
  }

  if (permission === "granted" && !isSubscribed) {
    return (
      <button
        onClick={requestPermission}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-navo-blue hover:bg-navo-blue/10 transition-colors"
      >
        <Bell size={14} />
        <span className="hidden sm:inline">Subscribe to push</span>
      </button>
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
