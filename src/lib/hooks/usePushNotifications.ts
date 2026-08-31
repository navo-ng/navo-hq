"use client";

import { useState, useEffect, useCallback } from "react";

interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
}

export function usePushNotifications(): PushNotificationState {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    setPermission(Notification.permission);

    if ("serviceWorker" in navigator && Notification.permission === "granted") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.pushManager?.getSubscription().then((subscription) => {
            if (subscription) {
              localStorage.setItem("navo-push-subscription", JSON.stringify(subscription));
            }
          });
        })
        .catch((err) => console.error("Service worker registration failed:", err));
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return "denied";

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted" && "serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager?.getSubscription();
        if (subscription) {
          localStorage.setItem("navo-push-subscription", JSON.stringify(subscription));
        }
      } catch (err) {
        console.error("Service worker registration after permission:", err);
      }
    }

    return result;
  }, [isSupported]);

  return { permission, isSupported, requestPermission };
}
