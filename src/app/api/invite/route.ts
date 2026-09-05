import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function generateRandomPassword(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user: caller } } = await supabaseAnon.auth.getUser(token);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role_id")
      .eq("id", caller.id)
      .single();

    if (!callerProfile?.role_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: callerRole } = await supabaseAdmin
      .from("roles")
      .select("name")
      .eq("id", callerProfile.role_id)
      .single();

    if (callerRole?.name !== "owner" && callerRole?.name !== "admin") {
      return NextResponse.json({ error: "Only owners and admins can invite members" }, { status: 403 });
    }

    const { email, role_id, message } = await req.json();

    if (!email || !role_id) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingProfile) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role_id, is_active: true })
        .eq("id", existingProfile.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update existing member" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Existing member's role updated",
        email,
        tempPassword: null,
      });
    }

    const tempPassword = generateRandomPassword();

    if (supabaseServiceKey) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        return NextResponse.json(
          { error: authError.message },
          { status: 500 }
        );
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email,
          name: email.split("@")[0],
          role_id,
          is_active: true,
        });

      if (profileError) {
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Team member invited successfully",
        email,
        tempPassword,
        userId: authData.user.id,
      });
    }

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: { role_id },
      },
    });

    if (signupError) {
      return NextResponse.json(
        { error: signupError.message },
        { status: 500 }
      );
    }

    if (!signupData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: signupData.user.id,
        email,
        name: email.split("@")[0],
        role_id,
        is_active: true,
      });

    if (profileError) {
      console.error("Profile insert error:", profileError);
    }

    return NextResponse.json({
      success: true,
      message: "Team member invited successfully",
      email,
      tempPassword,
      userId: signupData.user.id,
    });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}