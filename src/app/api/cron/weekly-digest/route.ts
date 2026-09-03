import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildWeeklyDigest, logDigest } from "@/lib/data/email-digest";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true);

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  let sentCount = 0;
  let skippedCount = 0;

  for (const user of users || []) {
    try {
      const digest = await buildWeeklyDigest(supabase, user.id, baseUrl);
      if (!digest) {
        skippedCount++;
        continue;
      }

      await logDigest(supabase, user.id, digest.subject, digest.html);
      sentCount++;
    } catch (err) {
      console.error(`Error building weekly digest for ${user.id}:`, err);
    }
  }

  return NextResponse.json({
    sent: sentCount,
    skipped: skippedCount,
    total: users?.length || 0,
    message: "Weekly digest generation complete",
  });
}
