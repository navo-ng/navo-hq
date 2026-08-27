"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle, FileText, AlertTriangle, CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Notification,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead as dbMarkAsRead,
  markAllRead as dbMarkAllRead,
} from "@/lib/data/notifications";

function getIcon(type: string) {
  switch (type) {
    case "task":
      return <CheckCircle size={18} className="text-navo-green" />;
    case "document":
      return <FileText size={18} className="text-navo-blue" />;
    case "alert":
      return <AlertTriangle size={18} className="text-orange-500" />;
    default:
      return <Bell size={18} className="text-navo-blue" />;
  }
}

function getRoute(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case "task":
      return `/tasks?id=${entityId}`;
    case "project":
      return `/projects/${entityId}`;
    case "decision":
      return `/decisions?id=${entityId}`;
    case "document":
      return `/documents?id=${entityId}`;
    default:
      return null;
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

type FilterTab = "all" | "unread";

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid || cancelled) {
        setIsLoading(false);
        return;
      }
      const [data, count] = await Promise.all([
        fetchNotifications(supabase, uid, { unreadOnly: filter === "unread" }),
        fetchUnreadCount(supabase, uid),
      ]);
      if (!cancelled) {
        setNotifications(data);
        setUnreadCount(count);
        setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase, filter]);

  const handleMarkAllRead = async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;
    await dbMarkAllRead(supabase, uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await dbMarkAsRead(supabase, notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    const route = getRoute(notification.entity_type, notification.entity_id);
    if (route) router.push(route);
  };

  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Stay updated on what&apos;s happening
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck size={14} />
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900 w-fit">
        {(["all", "unread"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-navo-blue/10 text-navo-blue"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab === "all" ? "All" : "Unread"}
            {tab === "unread" && unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-navo-blue px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          {filter === "unread" ? (
            <>
              <CheckCheck size={40} className="mb-3 text-navo-green" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                No unread notifications
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You&apos;re all caught up
              </p>
            </>
          ) : (
            <>
              <Inbox size={40} className="mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                You&apos;re all caught up
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No notifications yet
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {displayed.map((notification) => {
            const route = getRoute(notification.entity_type, notification.entity_id);
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  !notification.is_read ? "bg-navo-blue/5" : ""
                } ${route ? "cursor-pointer" : ""}`}
              >
                <div className="mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm ${
                      !notification.is_read
                        ? "font-semibold text-gray-900 dark:text-white"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
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
                {!notification.is_read && (
                  <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-navo-blue" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
