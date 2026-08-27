"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Notification,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead as dbMarkAsRead,
  markAllRead as dbMarkAllRead,
} from "@/lib/data/notifications";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNewNotification: () => void;
  newNotification: Notification | null;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const supabase = createClient();
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || cancelled) return;
      setUserId(uid);
      const [count, notifs] = await Promise.all([
        fetchUnreadCount(supabase, uid),
        fetchNotifications(supabase, uid, { limit: 20 }),
      ]);
      if (!cancelled) {
        setUnreadCount(count);
        setNotifications(notifs);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => [n, ...prev]);
          setUnreadCount((prev) => prev + 1);
          setNewNotification(n);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          setUnreadCount((prev) => {
            const wasRead = notificationsRef.current.find((n) => n.id === updated.id)?.is_read;
            if (!wasRead && updated.is_read) return Math.max(0, prev - 1);
            if (wasRead && !updated.is_read) return prev + 1;
            return prev;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  const markAsRead = useCallback(async (id: string) => {
    await dbMarkAsRead(supabase, id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [supabase]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await dbMarkAllRead(supabase, userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [supabase, userId]);

  const clearNewNotification = useCallback(() => setNewNotification(null), []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearNewNotification, newNotification }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
