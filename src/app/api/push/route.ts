import { NextRequest, NextResponse } from "next/server";
import webPush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:projectprimeengine@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
  userId: string;
  title: string;
  body?: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  try {
    const { userId, title, body, url }: PushPayload = await req.json();

    if (!userId || !title) {
      return NextResponse.json({ error: "userId and title required" }, { status: 400 });
    }

    // Fetch subscriptions from Supabase using service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const subRes = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=endpoint,p256dh,auth`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!subRes.ok) {
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    const subscriptions = await subRes.json();

    if (!subscriptions.length) {
      return NextResponse.json({ sent: 0, message: "No push subscriptions" });
    }

    const payload = JSON.stringify({ title, body: body || "", url: url || "/dashboard" });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          return { endpoint: sub.endpoint, status: "sent" };
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          // 404/410 = subscription expired, remove it
          if (statusCode === 404 || statusCode === 410) {
            await fetch(
              `${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
              {
                method: "DELETE",
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                },
              }
            );
            return { endpoint: sub.endpoint, status: "removed" };
          }
          return { endpoint: sub.endpoint, status: "failed", error: String(err) };
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value.status === "sent").length;

    return NextResponse.json({ sent, total: subscriptions.length });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
