"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  unsubscribe: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(): PushNotificationState {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    setPermission(Notification.permission);

    if (Notification.permission === "granted") {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        reg.pushManager?.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return "denied";

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("VAPID public key not configured");
        return result;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer,
      });

      const sub = subscription.toJSON();
      if (sub.endpoint && sub.keys) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from("push_subscriptions").upsert(
            {
              user_id: userData.user.id,
              endpoint: sub.endpoint,
              p256dh: sub.keys.p256dh || "",
              auth: sub.keys.auth || "",
            },
            { onConflict: "user_id,endpoint" }
          );
        }
      }

      setIsSubscribed(true);
    }

    return result;
  }, [isSupported, supabase]);

  const unsubscribe = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;

    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    const endpoint = sub.endpoint;
    await sub.unsubscribe();

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("endpoint", endpoint);
    }

    setIsSubscribed(false);
  }, [supabase]);

  return { permission, isSupported, isSubscribed, requestPermission, unsubscribe };
}
