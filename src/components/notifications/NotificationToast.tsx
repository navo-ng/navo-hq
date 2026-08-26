"use client";

import { useEffect } from "react";
import { X, Bell, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { Notification } from "@/lib/data/notifications";
import { useRouter } from "next/navigation";

interface NotificationToastProps {
  notification: Notification | null;
  onDismiss: () => void;
}

function getIcon(type: string) {
  switch (type) {
    case "task": return <CheckCircle size={18} className="text-navo-green" />;
    case "document": return <FileText size={18} className="text-navo-blue" />;
    case "alert": return <AlertTriangle size={18} className="text-orange-500" />;
    default: return <Bell size={18} className="text-navo-blue" />;
  }
}

function getRoute(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case "task": return `/tasks?id=${entityId}`;
    case "project": return `/projects/${entityId}`;
    case "decision": return `/decisions?id=${entityId}`;
    case "document": return `/documents?id=${entityId}`;
    default: return null;
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const router = useRouter();

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const route = getRoute(notification.entity_type, notification.entity_id);

  return (
    <div className="fixed right-4 top-4 z-[100] max-w-sm animate-in fade-in slide-in-from-right-5">
      <div
        className={`flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900 ${
          route ? "cursor-pointer" : ""
        }`}
        onClick={() => {
          if (route) {
            router.push(route);
            onDismiss();
          }
        }}
      >
        <div className="mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {notification.title}
          </p>
          {notification.message && (
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
              {notification.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
