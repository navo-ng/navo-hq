"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/useToast";

interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  isWorking: boolean;
  requestPermission: (silent?: boolean) => Promise<NotificationPermission>;
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
  const [isWorking, setIsWorking] = useState(false);
  const { showToast } = useToast();
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

  const requestPermission = useCallback(async (silent = false): Promise<NotificationPermission> => {
    if (!isSupported) {
      if (!silent) {
        showToast({ title: "Push notifications aren't supported in this browser", type: "error" });
      }
      return "denied";
    }

    try {
      setIsWorking(true);
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "denied") {
        if (!silent) {
          showToast({ title: "Notifications are blocked — allow them in your browser's site settings, then try again", type: "error" });
        }
        return result;
      }

      // Dismissed the prompt: stay quiet, we may ask again later
      if (result !== "granted") return result;

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("VAPID public key not configured");
        if (!silent) {
          showToast({ title: "Push isn't configured yet — please update the app and try again", type: "error" });
        }
        return result;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
      });

      const sub = subscription.toJSON();
      if (sub.endpoint && sub.keys) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          if (!silent) {
            showToast({ title: "Please sign in again, then enable notifications", type: "error" });
          }
          return result;
        }
        const { error: upsertError } = await supabase.from("push_subscriptions").upsert(
          {
            user_id: userData.user.id,
            endpoint: sub.endpoint,
            p256dh: sub.keys.p256dh || "",
            auth: sub.keys.auth || "",
          },
          { onConflict: "user_id,endpoint" }
        );
        if (upsertError) throw upsertError;
      }

      setIsSubscribed(true);
      if (!silent) {
        showToast({ title: "Push notifications enabled on this device", type: "success" });
      }
      return result;
    } catch (err) {
      console.error("Push subscribe failed:", err);
      if (!silent) {
        showToast({ title: "Couldn't enable push on this device. Check your connection and try again.", type: "error" });
      }
      return typeof Notification !== "undefined" ? Notification.permission : "default";
    } finally {
      setIsWorking(false);
    }
  }, [isSupported, supabase, showToast]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setIsSubscribed(false);
        return;
      }

      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setIsSubscribed(false);
        return;
      }

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
      showToast({ title: "Push notifications turned off on this device", type: "info" });
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
      showToast({ title: "Couldn't turn off push — please try again", type: "error" });
    }
  }, [supabase, showToast]);

  return { permission, isSupported, isSubscribed, isWorking, requestPermission, unsubscribe };
}
