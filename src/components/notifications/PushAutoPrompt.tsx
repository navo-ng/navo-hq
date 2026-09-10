"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";

const PROMPT_KEY = "navo-push-prompted";

/**
 * Automatically asks for browser notification permission shortly after the
 * app opens (mobile-app style), then subscribes the device for web push.
 *
 * Behavior:
 * - Only asks once per browser (localStorage flag).
 * - Never asks if the user already granted or blocked permission.
 * - Only asks logged-in users (a subscription must belong to a user).
 * - Silently re-subscribes when permission is granted but the subscription
 *   is missing (expired, cleared site data, new login).
 * - Does nothing when push is unsupported or the VAPID key isn't configured.
 */
export function PushAutoPrompt() {
  const { permission, isSupported, isSubscribed, requestPermission } =
    usePushNotifications();
  const askAttempted = useRef(false);
  const repairAttempted = useRef(false);

  // Auto-ask on app open (mobile-app style prompt)
  useEffect(() => {
    if (!isSupported || askAttempted.current) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(PROMPT_KEY)) return;
    if (permission !== "default") return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    askAttempted.current = true;

    // Short delay so the prompt doesn't fight page load / auth redirects
    const t = window.setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) return;
        window.localStorage.setItem(PROMPT_KEY, "1");
        await requestPermission(true);
      } catch {
        // Never break the app over notifications
      }
    }, 2500);

    return () => window.clearTimeout(t);
  }, [isSupported, permission, requestPermission]);

  // Silent repair: permission granted but no subscription saved
  useEffect(() => {
    if (!isSupported || repairAttempted.current) return;
    if (permission !== "granted" || isSubscribed) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    repairAttempted.current = true;

    const t = window.setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          repairAttempted.current = false;
          return;
        }
        await requestPermission(true);
      } catch {
        // Never break the app over notifications
      }
    }, 5000);

    return () => window.clearTimeout(t);
  }, [isSupported, permission, isSubscribed, requestPermission]);

  return null;
}
