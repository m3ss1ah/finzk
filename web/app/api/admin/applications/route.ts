export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const missingEnv: string[] = [];

    if (!supabaseUrl) missingEnv.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missingEnv.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!supabaseServiceRoleKey) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missingEnv.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required server configuration",
          missingEnv,
        },
        { status: 500 }
      );
    }

    const requiredSupabaseUrl = supabaseUrl as string;
    const requiredSupabaseAnonKey = supabaseAnonKey as string;
    const requiredSupabaseServiceRoleKey = supabaseServiceRoleKey as string;

    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const authClient = createClient(requiredSupabaseUrl, requiredSupabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await authClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createClient(requiredSupabaseUrl, requiredSupabaseServiceRoleKey);

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ applications: data });
  } catch (error) {
    console.error("[admin/applications]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
