import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { userId: targetUserId } = await req.json();

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Verify caller is authenticated
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user: caller } } = await supabaseAnon.auth.getUser(token);
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role for all DB operations (bypasses RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check caller is owner
  const { data: callerProfile } = await supabaseAdmin
    .from("profiles")
    .select("role_id")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.role_id) {
    return NextResponse.json({ error: "Only owners can remove members" }, { status: 403 });
  }

  const { data: callerRole } = await supabaseAdmin
    .from("roles")
    .select("name")
    .eq("id", callerProfile.role_id)
    .single();

  if (callerRole?.name !== "owner") {
    return NextResponse.json({ error: "Only owners can remove members" }, { status: 403 });
  }

  // Can't remove yourself
  if (targetUserId === caller.id) {
    return NextResponse.json({ error: "Can't remove yourself" }, { status: 400 });
  }

  // Delete profile first
  await supabaseAdmin.from("profiles").delete().eq("id", targetUserId);

  // Then delete auth user
  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

  if (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
