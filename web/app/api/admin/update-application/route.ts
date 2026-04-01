export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { id, verified, audit_required } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing application id" }, { status: 400 });
    }

    const supabase = createClient(requiredSupabaseUrl, requiredSupabaseServiceRoleKey);

    const updates: Record<string, boolean> = {};
    if (typeof verified === "boolean") updates.verified = verified;
    if (typeof audit_required === "boolean") updates.audit_required = audit_required;

    if (typeof verified !== "boolean" && typeof audit_required !== "boolean") {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    if (verified === true) {
      updates.audit_required = false;
    }

    const statusUpdate: Record<string, string> = {};
    if (audit_required === true) {
      statusUpdate.status = "audit";
      updates.verified = false;
    } else if (verified === true) {
      statusUpdate.status = "verified";
    } else if (verified === false || audit_required === false) {
      statusUpdate.status = "pending";
    }

    const { data, error } = await supabase
      .from("applications")
      .update({ ...updates, ...statusUpdate })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: data ?? null });
  } catch (error) {
    console.error("[admin/update-application]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
